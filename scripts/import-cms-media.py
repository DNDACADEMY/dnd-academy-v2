#!/usr/bin/env python3
"""Transfer quality-approved local outputs and emit their verified database mapping."""
import argparse
import hashlib
import json
import os
import pathlib
import re
import urllib.error
import urllib.parse
import urllib.request

SOURCE_HOST = "dnd-academy-v3.s3.ap-northeast-2.amazonaws.com"
CHUNK = 6 * 1024 * 1024
ATTRS = ("source_key", "source_sha256", "output_sha256", "output", "conversion", "quality_approved")


def url_key(value):
    return urllib.parse.quote(value, safe="/")


def digest(stream):
    checksum = hashlib.sha256()
    size = 0
    while chunk := stream.read(CHUNK):
        checksum.update(chunk)
        size += len(chunk)
    return checksum.hexdigest(), size


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def request(url, method="GET", data=None, headers=None):
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    return urllib.request.build_opener(NoRedirect()).open(req, timeout=120)


def upload(base, key, path, mime, size, secret):
    destination = f"{base}/storage/v1/object/cms-public/{url_key(key)}"
    headers = {"apikey": secret, "Authorization": "Bearer " + secret}
    if size <= CHUNK:
        with path.open("rb") as file:
            try:
                with request(destination, "POST", file, {
                    **headers, "Content-Length": str(size), "Content-Type": mime, "x-upsert": "false",
                }):
                    pass
            except urllib.error.HTTPError as error:
                if error.code not in (400, 409):
                    raise
        return

    import base64

    def encode(text):
        return base64.b64encode(text.encode()).decode()

    meta = ",".join(f"{name} {encode(value)}" for name, value in {
        "bucketName": "cms-public", "objectName": key, "contentType": mime,
    }.items())
    resumable = base + "/storage/v1/upload/resumable"
    with request(resumable, "POST", b"", {
        **headers, "Tus-Resumable": "1.0.0", "Upload-Length": str(size), "Upload-Metadata": meta,
    }) as response:
        location = urllib.parse.urljoin(resumable, response.headers["Location"])
    if urllib.parse.urlsplit(location).netloc != urllib.parse.urlsplit(base).netloc:
        raise ValueError("Unexpected Storage upload host")
    with path.open("rb") as file:
        offset = 0
        while block := file.read(CHUNK):
            with request(location, "PATCH", block, {
                **headers, "Tus-Resumable": "1.0.0", "Upload-Offset": str(offset),
                "Content-Type": "application/offset+octet-stream",
            }) as response:
                offset += len(block)
                if int(response.headers["Upload-Offset"]) != offset:
                    raise ValueError("Unexpected TUS upload offset")


def public_checks(url, mime):
    with request(url) as response:
        if response.headers.get_content_type() != mime:
            raise ValueError("Unexpected CDN MIME")
        return digest(response)


def transfer(folder, entry, base, secret, allowed):
    if not set(ATTRS).issubset(entry) or entry["quality_approved"] is not True:
        raise ValueError("An approved local output is required")
    if not all(re.fullmatch(r"[0-9a-f]{64}", entry[name]) for name in ("source_sha256", "output_sha256")):
        raise ValueError("Malformed checksum")
    source_key = entry["source_key"]
    if source_key not in allowed:
        raise ValueError("Unknown S3 source key")
    expected_ext = ".pdf" if source_key.lower().endswith(".pdf") else ".webp"
    path = (folder / entry["output"]).resolve()
    if not path.is_relative_to(folder) or path.suffix.lower() != expected_ext:
        raise ValueError("Unexpected output path or extension")
    mime = "application/pdf" if expected_ext == ".pdf" else "image/webp"
    with path.open("rb") as file:
        prefix = file.read(16)
        if (mime == "application/pdf" and not prefix.startswith(b"%PDF-")) or (
            mime == "image/webp" and (prefix[:4] != b"RIFF" or prefix[8:12] != b"WEBP")
        ):
            raise ValueError("Unexpected output format")
        file.seek(0)
        output_hash, output_bytes = digest(file)
    if output_hash != entry["output_sha256"]:
        raise ValueError("Local output SHA-256 differs from the approved output")
    with request(f"https://{SOURCE_HOST}/{url_key(source_key)}") as response:
        source_hash, _ = digest(response)
    if source_hash != entry["source_sha256"]:
        raise ValueError("S3 source SHA-256 differs from the manifest")
    if entry["conversion"] == "copy" and source_hash != output_hash:
        raise ValueError("Unchanged copy must match the source SHA-256")
    target = f"legacy/{output_hash}{expected_ext}"
    public_url = f"{base}/storage/v1/object/public/cms-public/{url_key(target)}"
    try:
        existing = public_checks(public_url, mime)
    except urllib.error.HTTPError as error:
        if error.code not in (400, 404):
            raise
        existing = None
    if existing is None:
        upload(base, target, path, mime, output_bytes, secret)
    if public_checks(public_url, mime) != (output_hash, output_bytes):
        raise ValueError("CDN bytes or SHA-256 differ from the approved output")
    return {**entry, "mime": mime, "bytes": output_bytes, "target": target}


def emit_sql(rows):
    def sql(value):
        return "'" + value.replace("'", "''") + "'"

    print("begin;\nset local standard_conforming_strings=on;")
    print("do $link$ declare asset uuid; begin")
    for row in rows:
        key, sha256, target, mime, source, conversion = map(sql, (
            row["source_key"], row["output_sha256"], row["target"], row["mime"], row["source_sha256"], row["conversion"],
        ))
        legacy_url = sql(f"https://{SOURCE_HOST}/{url_key(row['source_key'])}")
        print(f"""insert into public.media_assets(bucket,object_key,mime,bytes,sha256)
          values ('cms-public',{target},{mime},{row['bytes']},{sha256})
          on conflict (bucket,object_key) do nothing;
          select id into strict asset from public.media_assets
            where bucket='cms-public' and object_key={target} and mime={mime} and bytes={row['bytes']} and sha256={sha256} and ready;
          insert into public.cms_legacy_media(source_object_key,source_sha256,conversion,asset_id)
            values ({key},{source},{conversion},asset) on conflict do nothing;
          perform 1 from public.cms_legacy_media where source_object_key={key} and source_sha256={source} and asset_id=asset;
          if not found then raise exception 'Legacy mapping conflicts with previous approval'; end if;
          update public.project_revisions set thumbnail_id=asset where thumbnail_id is null and legacy_thumbnail={legacy_url};
          update public.project_revisions set pdf_id=asset where pdf_id is null and legacy_pdf={legacy_url};
          update public.organizer_revisions set thumbnail_id=asset where thumbnail_id is null and legacy_thumbnail={legacy_url};
          update public.project_revision_images set media_id=asset where media_id is null and legacy_url={legacy_url};""")
    print("end $link$;\ncommit;")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=pathlib.Path)
    parser.add_argument("--source-keys", required=True, type=pathlib.Path)
    args = parser.parse_args()
    entries = json.loads(args.manifest.read_text())
    allowed = set(json.loads(args.source_keys.read_text()))
    base = os.environ["DND_SUPABASE_URL"].rstrip("/")
    secret = os.environ["DND_SUPABASE_SERVICE_KEY"]
    host = urllib.parse.urlsplit(base)
    if host.scheme != "https" and host.hostname not in ("localhost", "127.0.0.1"):
        raise ValueError("Use HTTPS for hosted Storage")
    rows = [transfer(args.manifest.resolve().parent, row, base, secret, allowed) for row in entries]
    emit_sql(rows)


if __name__ == "__main__":
    main()
