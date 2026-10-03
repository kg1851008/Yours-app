-- YOURS database schema for Supabase.
-- Already applied to the yours. project (bbziozglnpamfvepnxfp). To set up another project, run it once in
-- the Supabase dashboard: SQL Editor > New query > paste this file > Run.
-- Safe to re-run: it only creates what is missing and replaces policies.
-- Every table has row-level security, so the public (anon) key in the app can only reach
-- what each signed-in member is allowed to see.

-- Public profile: just a display name. Created automatically at signup.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default 'Member' check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

-- Her whole app state (plan, logs, diary, settings) as one JSON document, synced across devices.
-- Progress photos are NOT in here; they are backed up separately, encrypted on her device.
create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated bigint not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  author_name text not null check (char_length(author_name) between 1 and 60),
  text text not null check (char_length(text) between 1 and 600),
  tag text not null default 'Win' check (tag in ('Win', 'Question', 'Tip')),
  phase text check (char_length(phase) <= 20),
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  author_name text not null check (char_length(author_name) between 1 and 60),
  text text not null check (char_length(text) between 1 and 300),
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  primary key (post_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  to_id uuid not null references auth.users (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now(),
  check (from_id <> to_id)
);

-- Reports go to you (the app owner) to review in the dashboard. Members cannot read them.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  post_id uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  message_id uuid references public.messages (id) on delete cascade,
  reason text check (char_length(reason) <= 300),
  created_at timestamptz not null default now()
);

create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists comments_post_idx on public.comments (post_id, created_at);
create index if not exists messages_from_idx on public.messages (from_id, created_at);
create index if not exists messages_to_idx on public.messages (to_id, created_at);
create index if not exists posts_user_idx on public.posts (user_id);
create index if not exists comments_user_idx on public.comments (user_id);
create index if not exists likes_user_idx on public.likes (user_id);
create index if not exists reports_reporter_idx on public.reports (reporter_id);
create index if not exists reports_post_idx on public.reports (post_id);
create index if not exists reports_comment_idx on public.reports (comment_id);
create index if not exists reports_message_idx on public.reports (message_id);

alter table public.profiles enable row level security;
alter table public.user_data enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;

-- profiles: members can see names; each edits only her own.
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- user_data: private to its owner.
drop policy if exists "user_data own" on public.user_data;
create policy "user_data own" on public.user_data for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- posts, comments, likes: any signed-in member reads; you write and delete only your own.
drop policy if exists "posts read" on public.posts;
create policy "posts read" on public.posts for select to authenticated using (true);
drop policy if exists "posts insert own" on public.posts;
create policy "posts insert own" on public.posts for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "posts delete own" on public.posts;
create policy "posts delete own" on public.posts for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "comments read" on public.comments;
create policy "comments read" on public.comments for select to authenticated using (true);
drop policy if exists "comments insert own" on public.comments;
create policy "comments insert own" on public.comments for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "comments delete own" on public.comments;
create policy "comments delete own" on public.comments for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "likes read" on public.likes;
create policy "likes read" on public.likes for select to authenticated using (true);
drop policy if exists "likes insert own" on public.likes;
create policy "likes insert own" on public.likes for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "likes delete own" on public.likes;
create policy "likes delete own" on public.likes for delete to authenticated using (user_id = (select auth.uid()));

-- messages: only the sender and the recipient can read; you can only send as yourself.
drop policy if exists "messages read own" on public.messages;
create policy "messages read own" on public.messages for select to authenticated using (from_id = auth.uid() or to_id = (select auth.uid()));
drop policy if exists "messages send own" on public.messages;
create policy "messages send own" on public.messages for insert to authenticated with check (from_id = (select auth.uid()));

-- reports: insert only.
drop policy if exists "reports insert own" on public.reports;
create policy "reports insert own" on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));

-- Create a profile automatically when someone signs up (name from signup metadata).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'Member'), 60))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Posts and comments always carry the author's real id and current profile name, whatever the client sends.
create or replace function public.stamp_author() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  select p.name into new.author_name from public.profiles p where p.id = auth.uid();
  if new.author_name is null then new.author_name := 'Member'; end if;
  return new;
end;
$$;
drop trigger if exists posts_stamp_author on public.posts;
create trigger posts_stamp_author before insert on public.posts for each row execute function public.stamp_author();
drop trigger if exists comments_stamp_author on public.comments;
create trigger comments_stamp_author before insert on public.comments for each row execute function public.stamp_author();
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.stamp_author() from public, anon, authenticated;

-- Lets a member delete her own account and everything in it (rows cascade from auth.users).
-- The app removes her backed-up photo files through the Storage API first.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Encrypted progress-photo backup. Files are encrypted on her device before upload with a key
-- derived from her backup passphrase, which never leaves the device. Each member's files live
-- in a folder named after her user id, and only she can read or write it.
insert into storage.buckets (id, name, public, file_size_limit)
values ('vault', 'vault', false, 3145728)
on conflict (id) do update set public = false, file_size_limit = 3145728;

drop policy if exists "vault own read" on storage.objects;
create policy "vault own read" on storage.objects for select to authenticated using (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "vault own insert" on storage.objects;
create policy "vault own insert" on storage.objects for insert to authenticated with check (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "vault own update" on storage.objects;
create policy "vault own update" on storage.objects for update to authenticated using (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "vault own delete" on storage.objects;
create policy "vault own delete" on storage.objects for delete to authenticated using (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Live updates for the community feed and messages (realtime still respects the policies above).
do $$
begin
  begin alter publication supabase_realtime add table public.posts; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.comments; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.likes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end;
end $$;

-- Memberships (Stripe). Written only by the server (api/stripe-webhook.js) with the secret key; members read their own row.
-- status 'comp' grants free access by hand.
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  customer_id text unique,
  subscription_id text,
  status text not null default 'none',
  plan text,
  trial_used boolean not null default false,
  trial_end timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions read own" on public.subscriptions;
create policy "subscriptions read own" on public.subscriptions for select to authenticated using (user_id = (select auth.uid()));

-- Proof of agreement to the Terms of Service and Health & Safety Waiver (see public/legal.js).
-- The server stamps who and when; members can add and read their own rows, never change or delete them.
create table if not exists public.consents (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  terms_version text not null check (char_length(terms_version) <= 40),
  documents text not null default 'terms,waiver,age18' check (char_length(documents) <= 100),
  user_agent text check (char_length(user_agent) <= 400),
  accepted_at timestamptz not null default now()
);
create index if not exists consents_user_idx on public.consents (user_id, accepted_at desc);
alter table public.consents enable row level security;
drop policy if exists "consents insert own" on public.consents;
create policy "consents insert own" on public.consents for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "consents read own" on public.consents;
create policy "consents read own" on public.consents for select to authenticated using (user_id = (select auth.uid()));
create or replace function public.stamp_consent() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  new.accepted_at := now();
  return new;
end;
$$;
drop trigger if exists consents_stamp on public.consents;
create trigger consents_stamp before insert on public.consents for each row execute function public.stamp_consent();
revoke all on function public.stamp_consent() from public, anon, authenticated;
