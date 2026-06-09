# activity_registrations 資料表

請先在 Supabase SQL Editor 執行以下語法：

```sql
create table if not exists public.activity_registrations (
  id text primary key default ('activityRegistration-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  created_at timestamptz not null default now(),
  activity_id text not null,
  activity_title text not null,
  name text not null,
  email text not null,
  gender text not null check (gender in ('male', 'female')),
  birth_date text not null,
  identity text not null check (identity in ('member', 'memberFamily', 'newMember', 'nonMember')),
  phone text not null,
  emergency_contact_name text not null,
  emergency_contact_phone text not null,
  referral_source text not null check (referral_source in ('member', 'friend', 'flyer', 'officialSite', 'beclass', 'other')),
  referral_source_other text,
  notes text
);

create index if not exists idx_activity_registrations_created_at on public.activity_registrations (created_at desc);
create index if not exists idx_activity_registrations_activity_id on public.activity_registrations (activity_id);

alter table public.activity_registrations enable row level security;

-- 前台寫入：允許匿名新增
drop policy if exists "activity registrations insert" on public.activity_registrations;
create policy "activity registrations insert"
on public.activity_registrations
for insert
with check (true);

-- 後台讀取：目前站台後台採前端登入(localStorage)機制，無 Supabase auth user。
-- 因此需開放 select 才能讀取；若你後續改成 Supabase Auth，請改成角色限定 policy。
drop policy if exists "activity registrations select" on public.activity_registrations;
create policy "activity registrations select"
on public.activity_registrations
for select
using (true);
```

注意：
- 目前後台沒有 Supabase JWT 角色管控，`select` policy 開放代表知道 API key 者可讀取。
- 若要提高安全性，建議下一步把後台登入改為 Supabase Auth + 角色控管，再收斂 select policy。
