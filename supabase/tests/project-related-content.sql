\set ON_ERROR_STOP on
begin;
do $test$
declare
  same_cohort bigint;
  other_cohort bigint;
  card_revision bigint;
  first_skill bigint;
  second_skill bigint;
  data jsonb;
begin
  insert into public.cohorts(ordinal) values (9981) returning id into same_cohort;
  insert into public.cohorts(ordinal) values (9982) returning id into other_cohort;
  insert into public.projects(id) values (0), (9981), (9982), (9983), (9984);
  insert into public.project_revisions(parent_id,version,state,name,title,description,cohort_id)
  values
    (0,1,'published','selected','selected title','selected body',same_cohort),
    (9981,1,'published','same cohort','card title','detail body',same_cohort),
    (9982,1,'published','other cohort','other title','other body',other_cohort),
    (9983,1,'draft','draft','draft title','draft body',same_cohort),
    (9984,1,'published','no thumbnail','card title','detail body',same_cohort);
  select id into strict card_revision from public.project_revisions where parent_id=9981;
  insert into public.skills(label) values ('Fixture A') returning id into first_skill;
  insert into public.skills(label) values ('Fixture B') returning id into second_skill;
  insert into public.project_revision_skills(revision_id,skill_id,ordinal)
    values (card_revision,second_skill,0),(card_revision,first_skill,1);

  insert into public.reviews(id) values (9981),(9982),(9983),(9984),(9985);
  insert into public.review_revisions(parent_id,version,state,name,position,body,cohort_id,project_id)
  values
    (9981,1,'published','same','개발','published',same_cohort,0),
    (9982,1,'published','mismatched cohort','개발','preserved',other_cohort,0),
    (9983,1,'published','other project','개발','ignored',other_cohort,9982),
    (9984,1,'draft','draft','개발','ignored',same_cohort,0),
    (9985,1,'published','no cohort','개발','preserved',null,0);

  data := public.published_project_related(0);
  assert (select array_agg((card->>'id')::integer order by ord)
    from jsonb_array_elements(data->'projects') with ordinality as entries(card,ord)) = array[9981,9984];
  assert data#>'{projects,0,skill}' = '["Fixture B","Fixture A"]'::jsonb;
  assert not ((data#>'{projects,0}') ? 'description');
  assert (select array_agg((review->>'id')::integer order by ord)
    from jsonb_array_elements(data->'reviews') with ordinality as entries(review,ord)) = array[9982,9981,9985];
  assert public.published_project_related(9983) is null;
  assert public.published_project_related(1101) is null;
  assert public.published_project_related(9982)->'projects' = '[]'::jsonb;

  update public.project_revisions set state='published' where parent_id=9983;
  update public.review_revisions set state='archived' where parent_id=9981;
  assert jsonb_array_length(public.published_project_related(0)->'projects') = 3;
  assert jsonb_array_length(public.published_project_related(0)->'reviews') = 2;
  assert not has_function_privilege('anon','public.published_project_related(integer)','EXECUTE');
  assert not has_function_privilege('authenticated','public.published_project_related(integer)','EXECUTE');
  assert has_function_privilege('service_role','public.published_project_related(integer)','EXECUTE');
end $test$;
rollback;
