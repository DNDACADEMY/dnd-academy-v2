\set ON_ERROR_STOP on
begin;

do $$
declare
  actor uuid := gen_random_uuid();
  credential text := repeat('a',64);
  selected uuid;
  baseline jsonb := '{"name":"운영진 테스트","description":"공개 소개","position":"개발","isArchived":false,
    "author":"필명","mbti":"ISTP","skills":["React"],"links":[],"legacyThumbnail":"https://assets.example.org/organizer.webp",
    "details":[{"kind":"now","body":"현재 경력"},{"kind":"previous","body":"이전 경력"},
      {"kind":"role","body":"기존 업무"},{"kind":"recommendation","body":"추천 이유"},
      {"kind":"interests","body":"기존 관심사"},{"kind":"share","body":"/published.webp"}]}';
  request jsonb := '{"name":"운영진 테스트","description":"공개 소개","skills":["React"],"links":[]}';
  updated jsonb := '{"mbti":"","now":["수정한 경력"],"previous":[],"role":"수정한 업무","recommendation":"","interests":""}';
  result jsonb;
  organizer integer;
  live_revision bigint;
  editor_revision bigint;
  editor_edit integer;
  publication jsonb;
  restored jsonb;
  item jsonb;
begin
  insert into auth.users(id) values (actor);
  insert into public.admin_accounts(user_id) values (actor);
  insert into public.admin_permissions(user_id, permission) values (actor,'content');
  result := public.write_content(actor,'organizer',null,null,null,'save',baseline);
  organizer := (result->>'id')::integer;
  perform public.write_content(actor,'organizer',organizer,(result->>'revisionId')::bigint,
    (result->>'editNumber')::integer,'publish','{}');
  result := public.admin_submission_action(actor,'issue',jsonb_build_object('kind','organizer','targetId',organizer,
    'label','운영진 테스트','expiresAt',clock_timestamp()+interval '1 day','tokenHash',credential,'archived',false,'position','개발'));
  selected := (result->>'id')::uuid;

  result := public.read_submission(selected,credential);
  assert result#>>'{input,organizerProfile,mbti}'='ISTP';
  assert result#>>'{input,organizerProfile,now,0}'='현재 경력';
  assert result#>>'{input,organizerProfile,role}'='기존 업무';
  assert result#>>'{organizerPreview,legacyThumbnail}'='https://assets.example.org/organizer.webp';
  assert result#>>'{organizerPreview,shares,0}'='/published.webp';
  assert not (result->'input' ? 'author');
  assert not has_table_privilege('anon','public.content_submission_organizer_details','select');

  result := public.save_submission(selected,credential,0,request || jsonb_build_object('organizerProfile',updated),false);
  assert result#>'{input,organizerProfile}'=updated;
  -- An older browser tab can submit the old payload without erasing saved profile details.
  result := public.save_submission(selected,credential,1,request,true);
  assert result#>'{input,organizerProfile}'=updated;
  result := public.admin_submission_review(actor,array[selected]);
  assert result#>'{0,submission,input,organizerProfile}'=updated;
  assert result#>>'{0,current,mbti}'='ISTP';

  live_revision := (result#>>'{0,current,revisionId}')::bigint;
  result := public.write_content(actor,'organizer',organizer,live_revision,
    (result#>>'{0,current,editNumber}')::integer,'save',baseline || '{"description":"관리자 초안"}');
  editor_revision := (result->>'revisionId')::bigint;
  editor_edit := (result->>'editNumber')::integer;
  publication := baseline || '{"mbti":"","details":[{"kind":"now","body":"수정한 경력"},
    {"kind":"role","body":"수정한 업무"},{"kind":"share","body":"/published.webp"}]}';
  restored := publication || '{"description":"관리자 초안"}';
  item := jsonb_build_object('linkId',selected,'kind','organizer','expectedLive',live_revision,
    'expectedRevision',editor_revision,'expectedEdit',editor_edit,'input',publication,'restoreDraft',restored);

  -- The administrator edits the draft after approval has been prepared.
  result := public.write_content(actor,'organizer',organizer,editor_revision,editor_edit,'save',
    baseline || '{"description":"다시 수정한 관리자 초안"}');
  begin
    perform public.publish_submission_batch(actor,jsonb_build_array(item),'{}');
    raise exception 'stale approval overwrote a concurrent draft edit';
  exception when serialization_failure then null;
  end;
  assert (select p->>'mbti' from public.published_content('organizer',organizer) p)='ISTP';
  assert (select d->>'description' from public.editable_content(actor,'organizer',organizer) d)='다시 수정한 관리자 초안';

  item := item || jsonb_build_object('expectedRevision',(result->>'revisionId')::bigint,
    'expectedEdit',(result->>'editNumber')::integer,
    'restoreDraft',publication || '{"description":"다시 수정한 관리자 초안"}');
  perform public.publish_submission_batch(actor,jsonb_build_array(item),'{}');
  select p into result from public.published_content('organizer',organizer) p;
  assert result->>'description'='공개 소개';
  assert result->>'mbti'='';
  assert result->'details' @> '[{"kind":"role","body":"수정한 업무"},{"kind":"share","body":"/published.webp"}]';
  select d into result from public.editable_content(actor,'organizer',organizer) d;
  assert result->>'state'='draft';
  assert result->>'description'='다시 수정한 관리자 초안';
  assert result->'details' @> '[{"kind":"role","body":"수정한 업무"}]';
end
$$;

rollback;
