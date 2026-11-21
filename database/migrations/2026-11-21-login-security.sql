-- Additive migration. Does not change PINs, roles, existing sessions or business records.
-- The server applies the equivalent statements atomically, once per security schema version.
begin;
alter table users add column if not exists session_version integer not null default 0;
create table if not exists auth_login_limits (
  key_hash text primary key,
  attempts integer not null,
  expires_at timestamptz not null
);
create index if not exists idx_auth_login_limits_expiry on auth_login_limits(expires_at);
insert into app_meta (key, value, updated_at)
values ('security_schema_version', '2026-11-21-login-security-v1', current_timestamp)
on conflict(key) do update set value = excluded.value, updated_at = excluded.updated_at;
commit;
