create table public.admin_login_rate_limits (
  scope text not null check (scope in ('network','network_account','account')),
  digest text not null check (digest ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  hits smallint not null check (hits between 1 and 20),
  primary key (scope,digest)
);
create index admin_login_rate_limits_expiry on public.admin_login_rate_limits(expires_at);

alter table public.admin_login_rate_limits enable row level security;
revoke all on public.admin_login_rate_limits from public,anon,authenticated;
grant select,insert,update,delete on public.admin_login_rate_limits to service_role;

create function public.reserve_admin_login(network_digest text, pair_digest text, account_digest text)
returns boolean
language plpgsql set search_path = '' as $$
declare
  attempted_at timestamptz := clock_timestamp();
  bucket record;
begin
  if account_digest is null or (network_digest is null) <> (pair_digest is null) then
    raise invalid_parameter_value;
  end if;

  -- Consume buckets in a fixed order. Rejected network attempts cannot exhaust the account bucket.
  for bucket in
    select b.scope,b.digest,b.quota
    from (values (1,'network',network_digest,20), (2,'network_account',pair_digest,5),
      (3,'account',account_digest,15)) b(sequence,scope,digest,quota)
    where b.digest is not null order by b.sequence
  loop
    insert into public.admin_login_rate_limits as rate (scope,digest,expires_at,hits)
    values (bucket.scope,bucket.digest,attempted_at+interval '15 minutes',1)
    on conflict (scope,digest) do update
      set hits=case when rate.expires_at<=attempted_at then 1 else rate.hits+1 end,
        expires_at=case when rate.expires_at<=attempted_at then excluded.expires_at else rate.expires_at end
      where rate.expires_at<=attempted_at or rate.hits<bucket.quota;
    if not found then return false; end if;
  end loop;

  delete from public.admin_login_rate_limits rate
  using (
    select scope,digest from public.admin_login_rate_limits
    where expires_at<=attempted_at order by expires_at limit 64 for update skip locked
  ) expired
  where rate.scope=expired.scope and rate.digest=expired.digest;
  return true;
end
$$;

revoke execute on function public.reserve_admin_login(text,text,text) from public,anon,authenticated;
grant execute on function public.reserve_admin_login(text,text,text) to service_role;
