-- Configurações da marca editáveis pela dona no painel (/admin). Linha única.
create table public.brand_settings (
  id int primary key default 1 check (id = 1),
  name text not null check (length(trim(name)) between 1 and 60),
  whatsapp text not null default '' check (whatsapp ~ '^\+?[0-9]{10,15}$'),
  instagram text not null default '' check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  logo text not null default '' check (logo ~ '^(https://|/catalog/)'),
  updated_at timestamptz not null default now()
);

insert into public.brand_settings (id, name, whatsapp, instagram, logo)
values (1, 'Encanto Feminino', '5511999999999', 'encantofeminino.demo', '/catalog/logo.png');

alter table public.brand_settings enable row level security;
revoke all on public.brand_settings from anon, authenticated;
grant select on public.brand_settings to anon, authenticated;
grant insert, update on public.brand_settings to authenticated;

create policy "Visitors read brand settings" on public.brand_settings
  for select to anon, authenticated using (true);

create policy "Admins manage brand settings" on public.brand_settings
  for all to authenticated
  using (exists (select 1 from public.catalog_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.catalog_admins where user_id = (select auth.uid())));