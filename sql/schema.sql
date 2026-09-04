-- ============================================================
-- Pizzas Viver Canoas — Sistema de Fidelidade
-- Rode este script inteiro em: Supabase > SQL Editor > New query
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Clientes ----------
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null,
  block text not null,
  apartment text not null,
  loyalty_points int not null default 0,
  reward_available boolean not null default false,
  total_pizzas int not null default 0,
  unique_token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_unique_token on customers(unique_token);
create unique index if not exists idx_customers_block_apartment on customers(block, apartment);

-- ---------- Histórico de fidelidade ----------
create table if not exists loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  type text not null check (type in ('purchase', 'reward_redeemed')),
  points int not null,
  balance_after int not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_loyalty_transactions_customer on loyalty_transactions(customer_id);

-- ---------- Sabores / produtos ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null,
  active boolean not null default true
);

-- ---------- Pedidos (registro informativo, não altera pontos) ----------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  items_json jsonb not null,
  reward_item text,
  total numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_customer on orders(customer_id);

-- ---------- Configurações do negócio (linha única) ----------
create table if not exists settings (
  id int primary key default 1,
  business_phone text not null default '5551999999999',
  pix_key text not null default '',
  constraint settings_single_row check (id = 1)
);

-- Compatibilidade com bancos criados antes da chave PIX.
alter table settings add column if not exists pix_key text not null default '';

-- ---------- Dados iniciais ----------
insert into settings (id, business_phone)
values (1, '5551999999999')
on conflict (id) do nothing;

insert into products (name, price)
select v.name, 35.00
from (values ('Calabresa'), ('Mussarela'), ('Mista')) as v(name)
where not exists (select 1 from products p where p.name = v.name);

-- ---------- Segurança ----------
-- RLS habilitado em todas as tabelas, SEM nenhuma policy criada.
-- Isso significa: só a service_role key (usada apenas no servidor da
-- aplicação) consegue ler ou escrever nessas tabelas. O navegador do
-- cliente e o do admin nunca falam direto com o banco — tudo passa
-- pelas rotas da aplicação Next.js.
alter table customers enable row level security;
alter table loyalty_transactions enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table settings enable row level security;
