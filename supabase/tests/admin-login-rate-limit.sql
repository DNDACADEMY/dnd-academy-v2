\set ON_ERROR_STOP on
begin;

do $$
declare
  network text := repeat('a',64);
  pair text := repeat('b',64);
  account text := repeat('c',64);
begin
  for attempt in 1..5 loop
    assert public.reserve_admin_login(network,pair,account);
  end loop;
  assert not public.reserve_admin_login(network,pair,account);
  assert (select hits from public.admin_login_rate_limits where scope='account' and digest=account)=5;

  -- Varying the submitted email still consumes the same network limit.
  for attempt in 7..20 loop
    assert public.reserve_admin_login(network,lpad(to_hex(attempt),64,'0'),lpad(to_hex(attempt+100),64,'0'));
  end loop;
  assert not public.reserve_admin_login(network,repeat('d',64),repeat('e',64));
  assert not exists (select 1 from public.admin_login_rate_limits where digest=repeat('e',64));

  -- Rotating the source network does not reset the shared account counter.
  for attempt in 1..10 loop
    assert public.reserve_admin_login(lpad(to_hex(attempt+200),64,'0'),lpad(to_hex(attempt+300),64,'0'),account);
  end loop;
  assert not public.reserve_admin_login(repeat('f',64),repeat('1',64),account);

  update public.admin_login_rate_limits set expires_at=clock_timestamp()-interval '1 second';
  assert public.reserve_admin_login(network,pair,account);
  assert (select hits from public.admin_login_rate_limits where scope='account' and digest=account)=1;
  assert (select count(*) from public.admin_login_rate_limits)=3;

  -- Without a trusted network address the account limit still applies.
  assert public.reserve_admin_login(null,null,repeat('9',64));
  assert (select count(*) from public.admin_login_rate_limits)=4;
  assert not has_table_privilege('anon','public.admin_login_rate_limits','select');
  assert not has_function_privilege('authenticated','public.reserve_admin_login(text,text,text)','execute');
  assert has_function_privilege('service_role','public.reserve_admin_login(text,text,text)','execute');
end
$$;

rollback;
