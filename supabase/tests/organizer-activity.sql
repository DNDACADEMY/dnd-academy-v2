\set ON_ERROR_STOP on
begin;
do $test$
declare
  actor uuid := gen_random_uuid();
  member jsonb;
  fixture jsonb := jsonb_build_object('name','Organizer activity fixture','author','fixture',
    'position','개발','description','Profile description','mbti','','isArchived',false,
    'links','[]'::jsonb,'details','[]'::jsonb,'skills',jsonb_build_array('Organizer fixture skill'));
  member_id integer;
  revision bigint;
  edit integer;
  directory jsonb;
begin
  insert into auth.users(id) values (actor);
  insert into public.admin_accounts(user_id) values (actor);
  insert into public.admin_permissions values (actor,'content');

  member := public.write_content(actor,'organizer',null,null,null,'save',fixture);
  member_id := (member->>'id')::integer;
  revision := (member->>'revisionId')::bigint;
  edit := (member->>'editNumber')::integer;
  assert public.content_workspace(actor,'organizer',member_id)->'rows'
    @> jsonb_build_array(jsonb_build_object('id',member_id,'isArchived',false,'state','draft'));
  assert not (public.published_organizer_directory()->'active' @> jsonb_build_array(jsonb_build_object('id',member_id)));

  perform public.write_content(actor,'organizer',member_id,revision,edit,'publish','{}');
  directory := public.published_organizer_directory();
  assert directory->'active' @> jsonb_build_array(jsonb_build_object('id',member_id,
    'technicalStack',jsonb_build_array('Organizer fixture skill')));
  assert not (directory->'former' @> jsonb_build_array(jsonb_build_object('id',member_id)));

  member := public.write_content(actor,'organizer',member_id,revision,edit,'save',fixture || '{"isArchived":true}');
  assert public.content_workspace(actor,'organizer',member_id)->'rows'
    @> jsonb_build_array(jsonb_build_object('id',member_id,'isArchived',false,'state','draft'));
  assert (public.content_workspace(actor,'organizer',member_id)#>>'{initial,isArchived}')::boolean;
  directory := public.published_organizer_directory();
  assert directory->'active' @> jsonb_build_array(jsonb_build_object('id',member_id));
  assert not (directory->'former' @> jsonb_build_array(jsonb_build_object('id',member_id)));

  revision := (member->>'revisionId')::bigint;
  edit := (member->>'editNumber')::integer;
  perform public.write_content(actor,'organizer',member_id,revision,edit,'publish','{}');
  directory := public.published_organizer_directory();
  assert not (directory->'active' @> jsonb_build_array(jsonb_build_object('id',member_id)));
  assert (select row from jsonb_array_elements(directory->'former') row where row->>'id'=member_id::text)
    = jsonb_build_object('id',member_id,'name','Organizer activity fixture');
  assert public.content_workspace(actor,'organizer',member_id)->'rows'
    @> jsonb_build_array(jsonb_build_object('id',member_id,'isArchived',true,'state','published'));
  assert (select item->>'description' from public.published_content('organizer',member_id) item)
    = 'Profile description';

  perform public.write_content(actor,'organizer',member_id,revision,edit,'unpublish','{}');
  assert not (public.published_organizer_directory()->'former' @> jsonb_build_array(jsonb_build_object('id',member_id)));
  assert not has_function_privilege('anon','public.published_organizer_directory()','execute');
  assert not has_function_privilege('authenticated','public.published_organizer_directory()','execute');
  assert has_function_privilege('service_role','public.published_organizer_directory()','execute');
end $test$;
rollback;
