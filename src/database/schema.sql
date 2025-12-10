-- ==============================================
-- 📦 PECUÁRIA PRO — SCHEMA OFICIAL DO BANCO
-- Supabase (PostgreSQL)
-- ==============================================

-- ================================
-- 1) USERS
-- ================================
drop table if exists users cascade;

create table users (
    id bigint generated always as identity primary key,
    phone text not null unique,
    name text,
    last_interaction timestamp default now(),
    data jsonb default '{}'::jsonb
);

create index users_phone_idx on users(phone);


-- ================================
-- 2) ANIMALS
-- ================================
drop table if exists animals cascade;

create table animals (
    id bigint generated always as identity primary key,
    phone text not null,
    nome text,
    raca text,
    peso numeric,
    idade text,
    notas text,
    created_at timestamp default now()
);

create index animals_phone_idx on animals(phone);


-- ================================
-- 3) LOTES
-- ================================
drop table if exists lots cascade;

create table lots (
    id bigint generated always as identity primary key,
    phone text not null,
    nome text not null,
    created_at timestamp default now()
);

create index lots_phone_idx on lots(phone);


-- ================================
-- 4) LOTE_ANIMALS (relacionamento N:N)
-- ================================
drop table if exists lote_animals cascade;

create table lote_animals (
    id bigint generated always as identity primary key,
    lote_id bigint not null references lots(id) on delete cascade,
    animal_id bigint not null references animals(id) on delete cascade,
    created_at timestamp default now()
);

create index lote_animals_lote_idx on lote_animals(lote_id);
create index lote_animals_animal_idx on lote_animals(animal_id);


-- ================================
-- 5) DIAGNOSTICS
-- ================================
drop table if exists diagnostics cascade;

create table diagnostics (
    id bigint generated always as identity primary key,
    phone text not null,
    message text not null,
    response text,
    created_at timestamp default now()
);

create index diagnostics_phone_idx on diagnostics(phone);


-- ================================
-- 6) CONVERSATIONS
-- ================================
drop table if exists conversations cascade;

create table conversations (
    id bigint generated always as identity primary key,
    phone text not null,
    role text not null,       -- 'user' ou 'assistant'
    message text not null,
    created_at timestamp default now()
);

create index conversations_phone_idx on conversations(phone);


-- ================================
-- 7) UTILITÁRIOS (Funções internas)
-- ================================
create or replace function get_tables()
returns table (table_name text)
language sql
security definer
as $$
    select tablename
    from public.tables_view;
$$;


create or replace function get_columns(table_name text)
returns table (column_name text, data_type text)
language sql
security definer
as $$
    select column_name, data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = get_columns.table_name;
$$;
