-- ============================================================================
-- Leico — Schéma de base de données
-- ============================================================================
-- Cible : PostgreSQL 15 (Supabase)
-- Auth  : utilise auth.users géré par Supabase Auth (pas de table users custom)
--
-- Ce script est idempotent — il peut être rejoué pour reconstruire la BDD.
-- Pour réinitialiser entièrement, voir la section DROP en fin de fichier.
-- ============================================================================

-- ─── Tables ─────────────────────────────────────────────────────────────────

-- 1) Catégories (auto-référencée pour gérer les sous-catégories) -------------
create table if not exists public.category (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    slug        text not null unique,
    parent_id   uuid references public.category(id) on delete set null,
    created_at  timestamptz not null default now()
);

create index if not exists idx_category_parent on public.category(parent_id);

-- 2) Produits ----------------------------------------------------------------
create table if not exists public.product (
    id           uuid primary key default gen_random_uuid(),
    name         text not null,
    description  text,
    price        numeric(10, 2) not null check (price >= 0),
    image_url    text,
    category_id  uuid references public.category(id) on delete set null,
    is_active    boolean not null default true,
    created_at   timestamptz not null default now()
);

create index if not exists idx_product_category on public.product(category_id);
create index if not exists idx_product_active on public.product(is_active);

-- 3) Variantes produit (taille / couleur / stock) ----------------------------
create table if not exists public.product_variant (
    id          uuid primary key default gen_random_uuid(),
    product_id  uuid not null references public.product(id) on delete cascade,
    size        text,
    color       text,
    stock       integer not null default 0 check (stock >= 0),
    sku         text unique,
    created_at  timestamptz not null default now()
);

create index if not exists idx_variant_product on public.product_variant(product_id);

-- 4) Favoris -----------------------------------------------------------------
create table if not exists public.favorite (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    product_id  uuid not null references public.product(id) on delete cascade,
    created_at  timestamptz not null default now(),
    unique (user_id, product_id)
);

create index if not exists idx_favorite_user on public.favorite(user_id);

-- 5) Commandes ---------------------------------------------------------------
-- Note : "order" est un mot réservé SQL → toujours quoter le nom de la table.
create table if not exists public."order" (
    id                uuid primary key default gen_random_uuid(),
    user_id           uuid not null references auth.users(id) on delete cascade,
    total_amount      numeric(10, 2) not null check (total_amount >= 0),
    shipping_address  text not null,
    status            text not null default 'pending'
                      check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);

create index if not exists idx_order_user on public."order"(user_id);
create index if not exists idx_order_status on public."order"(status);

-- Trigger : mise à jour automatique de updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_order_updated_at on public."order";
create trigger trg_order_updated_at
before update on public."order"
for each row execute function public.set_updated_at();

-- 6) Lignes de commande ------------------------------------------------------
create table if not exists public.order_item (
    id          uuid primary key default gen_random_uuid(),
    order_id    uuid not null references public."order"(id) on delete cascade,
    variant_id  uuid not null references public.product_variant(id) on delete restrict,
    quantity    integer not null check (quantity > 0),
    unit_price  numeric(10, 2) not null check (unit_price >= 0)
);

create index if not exists idx_order_item_order on public.order_item(order_id);
create index if not exists idx_order_item_variant on public.order_item(variant_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

alter table public.category         enable row level security;
alter table public.product          enable row level security;
alter table public.product_variant  enable row level security;
alter table public.favorite         enable row level security;
alter table public."order"          enable row level security;
alter table public.order_item       enable row level security;

-- Catalogue : lecture publique ----------------------------------------------
drop policy if exists "category_public_read"  on public.category;
drop policy if exists "product_public_read"   on public.product;
drop policy if exists "variant_public_read"   on public.product_variant;

create policy "category_public_read"
on public.category for select using (true);

create policy "product_public_read"
on public.product for select using (true);

create policy "variant_public_read"
on public.product_variant for select using (true);

-- Favoris : un user ne voit / modifie que les siens -------------------------
drop policy if exists "favorite_select_own" on public.favorite;
drop policy if exists "favorite_insert_own" on public.favorite;
drop policy if exists "favorite_delete_own" on public.favorite;

create policy "favorite_select_own"
on public.favorite for select using (auth.uid() = user_id);

create policy "favorite_insert_own"
on public.favorite for insert with check (auth.uid() = user_id);

create policy "favorite_delete_own"
on public.favorite for delete using (auth.uid() = user_id);

-- Commandes : own rows only --------------------------------------------------
drop policy if exists "order_select_own" on public."order";
drop policy if exists "order_insert_own" on public."order";

create policy "order_select_own"
on public."order" for select using (auth.uid() = user_id);

create policy "order_insert_own"
on public."order" for insert with check (auth.uid() = user_id);

-- Lignes de commande : accès via la commande parente ------------------------
drop policy if exists "order_item_select_via_order" on public.order_item;
drop policy if exists "order_item_insert_via_order" on public.order_item;

create policy "order_item_select_via_order"
on public.order_item for select using (
    exists (
        select 1 from public."order" o
        where o.id = order_item.order_id and o.user_id = auth.uid()
    )
);

create policy "order_item_insert_via_order"
on public.order_item for insert with check (
    exists (
        select 1 from public."order" o
        where o.id = order_item.order_id and o.user_id = auth.uid()
    )
);

-- ============================================================================
-- Notes
-- ============================================================================
-- Écriture sur category / product / product_variant : effectuée via Supabase
-- Studio (clé service_role) côté admin. Pour ajouter un rôle "admin" applicatif
-- plus tard, créer des policies INSERT/UPDATE/DELETE basées sur un claim JWT
-- (par ex. auth.jwt() ->> 'role' = 'admin').
--
-- Pour réinitialiser entièrement la BDD :
--   drop table if exists public.order_item, public."order", public.favorite,
--                        public.product_variant, public.product, public.category
--   cascade;
