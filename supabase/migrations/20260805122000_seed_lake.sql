-- Seed Lake St. Clair (boundary left null until surveyed GeoJSON is reviewed)
insert into public.lakes (slug, name, timezone, status)
values ('lake-st-clair', 'Lake St. Clair', 'America/Detroit', 'active')
on conflict (slug) do update set name = excluded.name;
