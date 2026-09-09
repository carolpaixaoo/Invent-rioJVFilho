-- Execute este script inteiro no SQL Editor do seu projeto Supabase
-- (Painel do Supabase > SQL Editor > New query > colar > Run)

create extension if not exists "pgcrypto";

create table if not exists obras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  endereco text,
  responsavel text,
  data_inicio date,
  created_at timestamptz default now()
);

create table if not exists itens (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid references obras(id) on delete cascade,
  codigo text,
  nome text not null,
  categoria text,
  unidade text default 'un',
  quantidade numeric default 0,
  ponto_reposicao numeric default 0,
  local text,
  created_at timestamptz default now()
);

create table if not exists equipamentos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid references obras(id) on delete cascade,
  nome text not null,
  fornecedor text,
  data_inicio date,
  data_fim date not null,
  local text,
  valor_diaria numeric,
  observacao text,
  created_at timestamptz default now()
);

create table if not exists movimentacoes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references itens(id) on delete cascade,
  tipo text not null check (tipo in ('Entrada', 'Saída')),
  quantidade numeric not null,
  data date not null,
  responsavel text,
  observacao text,
  created_at timestamptz default now()
);

-- Segurança: só usuários logados (equipe) podem ler e escrever.
-- Ninguém de fora, sem login, consegue acessar os dados.
alter table obras enable row level security;
alter table itens enable row level security;
alter table equipamentos enable row level security;
alter table movimentacoes enable row level security;

-- "drop policy if exists" antes de cada "create policy" torna esse script seguro
-- para rodar mais de uma vez, sem dar erro de política duplicada.
drop policy if exists "equipe pode tudo em obras" on obras;
create policy "equipe pode tudo em obras" on obras for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "equipe pode tudo em itens" on itens;
create policy "equipe pode tudo em itens" on itens for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "equipe pode tudo em equipamentos" on equipamentos;
create policy "equipe pode tudo em equipamentos" on equipamentos for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "equipe pode tudo em movimentacoes" on movimentacoes;
create policy "equipe pode tudo em movimentacoes" on movimentacoes for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
