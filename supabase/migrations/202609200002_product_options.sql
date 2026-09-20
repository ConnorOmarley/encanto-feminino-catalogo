-- Apply after 202609200001_catalog.sql. Existing products keep their current status.
create or replace function public.valid_product_variants(items jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  item jsonb;
  seen_ids text[] := '{}';
  seen_pairs text[] := '{}';
  pair text;
begin
  if jsonb_typeof(items) is distinct from 'array' then return false; end if;
  if jsonb_array_length(items) > 100 then return false; end if;
  for item in select value from jsonb_array_elements(items) loop
    if jsonb_typeof(item) is distinct from 'object'
      or jsonb_typeof(item->'id') is distinct from 'string'
      or jsonb_typeof(item->'size') is distinct from 'string'
      or jsonb_typeof(item->'color') is distinct from 'string'
      or jsonb_typeof(item->'availability') is distinct from 'string'
      then return false; end if;
    if length(btrim(item->>'id')) = 0
      or length(item->>'id') > 100
      or length(item->>'size') > 40
      or length(item->>'color') > 60
      or (length(btrim(item->>'size')) = 0 and length(btrim(item->>'color')) = 0)
      or (item->>'availability') not in ('disponivel','encomenda','indisponivel')
      then return false; end if;
    pair := jsonb_build_array(lower(btrim(item->>'size')), lower(btrim(item->>'color')))::text;
    if (item->>'id') = any(seen_ids) or pair = any(seen_pairs) then return false; end if;
    seen_ids := array_append(seen_ids, item->>'id');
    seen_pairs := array_append(seen_pairs, pair);
  end loop;
  return true;
end;
$$;

create or replace function public.valid_product_images(items text[])
returns boolean language sql immutable set search_path = '' as $$
  select cardinality(items) <= 7 and not exists (
    select 1 from unnest(items) as image
    where image is null or image !~ '^(https://|/catalog/)'
  );
$$;

alter table public.products
  add column images text[] not null default '{}' check (public.valid_product_images(images)),
  add column variants jsonb not null default '[]' check (public.valid_product_variants(variants)),
  add column lead_time text not null default '' check (length(lead_time) <= 160);

-- Ensure every client sees the same aggregate status, including edits outside the panel.
create or replace function public.sync_product_options()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not public.valid_product_variants(new.variants) then
    raise exception 'Invalid product variants' using errcode = '23514';
  end if;
  if jsonb_array_length(new.variants) > 0 then
    new.availability := case
      when exists (select 1 from jsonb_array_elements(new.variants) v where v->>'availability' = 'disponivel') then 'disponivel'
      when exists (select 1 from jsonb_array_elements(new.variants) v where v->>'availability' = 'encomenda') then 'encomenda'
      else 'indisponivel' end;
    select coalesce(array_agg(distinct btrim(v->>'size')) filter (where btrim(v->>'size') <> ''), '{}'::text[])
      into new.sizes from jsonb_array_elements(new.variants) v;
    select coalesce(array_agg(distinct btrim(v->>'color')) filter (where btrim(v->>'color') <> ''), '{}'::text[])
      into new.colors from jsonb_array_elements(new.variants) v;
  end if;
  return new;
end;
$$;

create trigger products_sync_options before insert or update on public.products
for each row execute function public.sync_product_options();
