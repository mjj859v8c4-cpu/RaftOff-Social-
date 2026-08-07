-- Schedule check-in expiration every 5 minutes via pg_cron (DB RPC, no HTTP secrets).
create extension if not exists pg_cron with schema pg_catalog;

do $$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'expire-check-ins';
exception
  when undefined_table then
    null;
  when others then
    null;
end $$;

select cron.schedule(
  'expire-check-ins',
  '*/5 * * * *',
  $$select public.expire_check_ins();$$
);
