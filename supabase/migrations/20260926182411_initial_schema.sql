begin;

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  type text not null check (type in ('checking', 'savings', 'cash', 'credit', 'other')),
  currency text not null default 'USD' check (currency = 'USD'),
  opening_balance_cents bigint not null default 0 check (opening_balance_cents between -9000000000000 and 9000000000000),
  opening_date date not null,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  kind text not null check (kind in ('income', 'expense')),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id, kind)
);
create unique index categories_name_unique on public.categories (user_id, kind, lower(btrim(name)));

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null,
  request_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, request_id),
  unique (user_id, account_id, id),
  foreign key (user_id, account_id) references public.accounts(user_id, id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account_id uuid not null,
  destination_account_id uuid,
  category_id uuid,
  kind text not null check (kind in ('income', 'expense', 'transfer')),
  amount_cents bigint not null check (amount_cents between 1 and 9000000000000),
  transaction_date date not null,
  description text not null default '' check (char_length(description) <= 500),
  import_batch_id uuid,
  import_row_number integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Composite keys enforce ownership even when a caller supplies another user's ID.
  foreign key (user_id, account_id) references public.accounts(user_id, id),
  foreign key (user_id, destination_account_id) references public.accounts(user_id, id),
  foreign key (user_id, category_id, kind) references public.categories(user_id, id, kind),
  foreign key (user_id, account_id, import_batch_id) references public.import_batches(user_id, account_id, id),
  -- One transfer row moves money between two accounts atomically without counting as income or spending.
  check (
    (kind = 'transfer' and destination_account_id is not null and destination_account_id <> account_id and category_id is null)
    or (kind in ('income', 'expense') and destination_account_id is null and category_id is not null)
  ),
  check (
    (import_batch_id is null and import_row_number is null)
    or (import_batch_id is not null and import_row_number is not null and import_row_number > 0)
  ),
  -- Retries cannot repeat a batch row; identical real-world transactions remain allowed.
  unique (import_batch_id, import_row_number)
);
create index transactions_date_idx on public.transactions (user_id, transaction_date desc, id);
create index transactions_account_idx on public.transactions (user_id, account_id, transaction_date);
create index transactions_destination_idx on public.transactions (user_id, destination_account_id) where destination_account_id is not null;
create index transactions_category_idx on public.transactions (user_id, category_id, kind);
create index transactions_batch_idx on public.transactions (user_id, account_id, import_batch_id) where import_batch_id is not null;

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid not null,
  category_kind text not null default 'expense' check (category_kind = 'expense'),
  month date not null check (extract(day from month) = 1),
  amount_cents bigint not null check (amount_cents between 1 and 9000000000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (user_id, category_id, category_kind) references public.categories(user_id, id, kind),
  unique (user_id, category_id, month)
);

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Authentication alone is not authorization: every operation must match the owner.
do $$
declare table_name text;
begin
  foreach table_name in array array['accounts', 'categories', 'transactions', 'budgets', 'import_batches'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format(
      'create policy owner_access on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name
    );
    if table_name <> 'import_batches' then
      execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
    end if;
  end loop;
end;
$$;

commit;
