#!/usr/bin/env python3
"""Audit the bundled public data and emit repeatable, transactional PostgreSQL imports."""
import argparse
import collections
import hashlib
import json
import pathlib
import re
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / "apps/web/src/lib/assets/data"
SOURCE_HOST = "dnd-academy-v3.s3.ap-northeast-2.amazonaws.com"
SOURCE = "dnd-homepage-25a5533"


def read(name):
    return json.loads((DATA / f"{name}.json").read_text())


def ordinal(value):
    text = value.strip()
    if not text:
        return None
    if not re.fullmatch(r"[1-9]\d*기", text):
        raise ValueError(f"Unexpected cohort {text!r}")
    return int(text[:-1])


def object_key(url):
    value = urllib.parse.urlsplit(url)
    if value.scheme != "https" or value.netloc != SOURCE_HOST or not value.path or value.query or value.fragment:
        raise ValueError("Unexpected legacy source URL")
    return urllib.parse.unquote(value.path.lstrip("/"))


def audit(projects, organizers, reviews):
    by_project = {p["id"]: p for p in projects}
    for rows in (projects, organizers, reviews):
        assert len(rows) == len({row["id"] for row in rows})
        assert all(type(row["id"]) is int and row["id"] >= 0 for row in rows)
    assert all("email" not in row for row in reviews)
    missing = [r["id"] for r in reviews if r["projectId"] is None]
    unmatched = [r["id"] for r in reviews if r["projectId"] is not None and r["projectId"] not in by_project]
    if unmatched:
        raise ValueError(f"Unresolved project IDs in review rows {unmatched}")
    mismatches = [
        {"reviewId": r["id"], "projectId": r["projectId"], "reviewCohort": ordinal(r["flag"]),
         "projectCohort": ordinal(by_project[r["projectId"]]["flag"])}
        for r in reviews if r["projectId"] is not None and ordinal(r["flag"]) is not None
        and ordinal(r["flag"]) != ordinal(by_project[r["projectId"]]["flag"])
    ]
    refs = [(kind, url) for row in projects for kind, url in
            [("thumbnail", row["thumbnail"]), ("pdf", row["pdf"])] +
            [("gallery", image) for image in row.get("images", [])] if url]
    refs += [("organizer", row["thumbnail"]) for row in organizers if row.get("thumbnail")]
    keys = sorted({object_key(url) for _, url in refs})
    metrics = read("total_count_status")
    return {
        "projects": len(projects), "separateCumulativeMetrics": metrics,
        "organizers": len(organizers), "formerOrganizers": sum(row["isArchived"] for row in organizers),
        "reviews": len(reviews), "reviewsWithNoProject": missing,
        "reviewsWithNoCohort": [row["id"] for row in reviews if ordinal(row["flag"]) is None],
        "cohortMismatches": mismatches, "mediaReferences": len(refs),
        "referenceCounts": dict(collections.Counter(kind for kind, _ in refs)), "uniqueMedia": len(keys),
        "mediaExtensions": dict(collections.Counter(pathlib.Path(key).suffix.lower() for key in keys)),
    }, keys


def literal(value):
    if value is None:
        return "null"
    if isinstance(value, bool):
        return str(value).lower()
    if isinstance(value, int):
        return str(value)
    return "'" + value.replace("'", "''") + "'"


def values(*args):
    return ",".join(map(literal, args))


def links(row):
    for kind, value in row.items():
        for url in value if isinstance(value, list) else [value]:
            if url:
                yield kind, url


def emit_import(projects, organizers, reviews):
    print("begin;\nset local standard_conforming_strings=on;")
    print("lock table public.projects,public.organizers,public.reviews in share row exclusive mode;")
    print("do $migration$ declare revision bigint; begin")
    ordinals = {ordinal(row["flag"]) for row in projects + reviews} | {16}
    for item in sorted(ordinals - {None}):
        print(f"insert into public.cohorts(ordinal) values ({item}) on conflict do nothing;")
    for kind, rows in (("project", projects), ("organizer", organizers), ("review", reviews)):
        for row in rows:
            record_id = row["id"]
            row_hash = hashlib.sha256(json.dumps(row, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
            identity = values(SOURCE, kind, record_id, row_hash)
            print(f"if not exists (select 1 from public.cms_imported_rows where (source,kind,record_id) = ({values(SOURCE,kind,record_id)})) then")
            print(f"insert into public.{kind}s(id) values ({record_id});")
            if kind == "project":
                cohort = f"(select id from public.cohorts where ordinal={ordinal(row['flag'])})"
                print("insert into public.project_revisions(parent_id,version,state,name,title,description,cohort_id,legacy_thumbnail,legacy_pdf)")
                print(f"values ({values(record_id,1,'published',row['name'],row['title'],row['desc'])},{cohort},{values(row['thumbnail'] or None,row['pdf'] or None)}) returning id into revision;")
                for index, url in enumerate(row.get("images", [])):
                    print(f"insert into public.project_revision_images(revision_id,ordinal,legacy_url) values (revision,{values(index,url)});")
                skills = row["skill"]
            elif kind == "organizer":
                print("insert into public.organizer_revisions(parent_id,version,state,name,author,position,introduction,mbti,emoji,is_archived,legacy_thumbnail)")
                print(f"values ({values(record_id,1,'published',row['name'],row['author'],row['dndPosition'],row['oneLineIntroduction'],row['mbti'],row.get('emoji'),row['isArchived'],row.get('thumbnail'))}) returning id into revision;")
                questions = row["questions"]
                details = {
                    **row["career"], "role": [questions["whatIsYourRoleInDnd"]],
                    "recommendation": [questions["whyDoYouRecommendDnd"]], "interests": [questions["whatIsYourInterests"]],
                    "share": questions["whatYouWantToShare"],
                }
                for category, entries in details.items():
                    for index, entry in enumerate(entries):
                        print(f"insert into public.organizer_revision_details values (revision,{values(category,index,entry)});")
                skills = row["technicalStack"]
            else:
                number = ordinal(row["flag"])
                cohort = f"(select id from public.cohorts where ordinal={number})" if number else "null"
                print("insert into public.review_revisions(parent_id,version,state,name,position,body,cohort_id,project_id,original_project_name)")
                print(f"values ({values(record_id,1,'published',row['name'],row['position'],row['review'])},{cohort},{values(row['projectId'],row['project'])}) returning id into revision;")
                skills = []
            for index, (category, url) in enumerate(links(row.get("projectLinks", row.get("links", {})))):
                print(f"insert into public.{kind}_revision_links values (revision,{values(index,category,url)});")
            for index, skill in enumerate(dict.fromkeys(skills)):
                print(f"insert into public.skills(label) values ({literal(skill)}) on conflict do nothing;")
                print(f"insert into public.{kind}_revision_skills select revision,id,{index} from public.skills where label={literal(skill)};")
            print(f"insert into public.cms_imported_rows(source,kind,record_id,source_sha256) values ({identity});")
            print("end if;")
        # ALTER SEQUENCE RESTART participates in rollback and never rewinds a live sequence.
        table = kind + "s"
        sequence = table + "_id_seq"
        print(f"execute format('alter sequence public.{sequence} restart with %s', greatest(")
        print(f"(select coalesce(max(id)+1,1) from public.{table}),")
        print(f"(select last_value + case when is_called then 1 else 0 end from public.{sequence})));")
    print("end $migration$;\ncommit;")


def emit_verification(report):
    expected = {kind: report[kind + "s"] for kind in ("project", "organizer", "review")}
    print("begin read only;")
    print(f"select kind,count(*) from public.cms_imported_rows where source={literal(SOURCE)} group by kind order by kind;")
    print("select 'project' as kind,count(*) from public.project_revisions where state='published' union all")
    print("select 'organizer',count(*) from public.organizer_revisions where state='published' union all")
    print("select 'review',count(*) from public.review_revisions where state='published';")
    print("select r.parent_id as review_id,r.project_id,c.ordinal as review_cohort,p.ordinal as project_cohort")
    print("from public.review_revisions r join public.project_revisions pr on pr.parent_id=r.project_id and pr.state='published'")
    print("join public.cohorts c on c.id=r.cohort_id join public.cohorts p on p.id=pr.cohort_id")
    print("where r.state='published' and c.ordinal<>p.ordinal order by r.parent_id;")
    print("select count(*) filter(where project_id is null) as unlinked_reviews,count(*) filter(where cohort_id is null) as unknown_cohort")
    print("from public.review_revisions where state='published';")
    print("do $$ begin")
    for kind, count in expected.items():
        print(f"if (select count(*) from public.cms_imported_rows where source={literal(SOURCE)} and kind={literal(kind)}) <> {count}")
        print(f"then raise exception 'Unexpected {kind} import count'; end if;")
    print("end $$;\ncommit;")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("dry-run", "sql", "verify", "media-keys"))
    args = parser.parse_args()
    projects, organizers, reviews = (read(name) for name in ("projects", "organizers", "reviews"))
    report, keys = audit(projects, organizers, reviews)
    if args.mode == "dry-run":
        print(json.dumps(report, ensure_ascii=False, indent=2))
    elif args.mode == "sql":
        emit_import(projects, organizers, reviews)
    elif args.mode == "verify":
        emit_verification(report)
    else:
        print(json.dumps(keys, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
