# mail_templates / mail_logs 資料表

用於「後台信件樣版」與「報名資料寄信」功能。請先在 Supabase SQL Editor 執行以下語法：

```sql
create table if not exists public.mail_templates (
  id text primary key default ('mailTemplate-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  subject text not null,
  content text not null
);

create index if not exists idx_mail_templates_created_at on public.mail_templates (created_at desc);

alter table public.mail_templates enable row level security;

drop policy if exists "mail templates select" on public.mail_templates;
create policy "mail templates select" on public.mail_templates for select using (true);

drop policy if exists "mail templates insert" on public.mail_templates;
create policy "mail templates insert" on public.mail_templates for insert with check (true);

drop policy if exists "mail templates update" on public.mail_templates;
create policy "mail templates update" on public.mail_templates for update using (true) with check (true);

drop policy if exists "mail templates delete" on public.mail_templates;
create policy "mail templates delete" on public.mail_templates for delete using (true);

create table if not exists public.mail_logs (
  id text primary key default ('mailLog-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  created_at timestamptz not null default now(),
  activity_id text,
  activity_title text,
  template_id text,
  template_name text,
  to_email text not null,
  to_name text,
  subject text not null,
  content text not null,
  status text not null check (status in ('success', 'failed')),
  error_message text
);

create index if not exists idx_mail_logs_created_at on public.mail_logs (created_at desc);
create index if not exists idx_mail_logs_activity_id on public.mail_logs (activity_id);

alter table public.mail_logs enable row level security;

drop policy if exists "mail logs select" on public.mail_logs;
create policy "mail logs select" on public.mail_logs for select using (true);

drop policy if exists "mail logs insert" on public.mail_logs;
create policy "mail logs insert" on public.mail_logs for insert with check (true);
```

注意：同其他後台資料表一樣，目前後台採前端登入(localStorage)機制，無 Supabase Auth，因此 policy 全部開放。

## EmailJS 自訂樣版設定

後台「信件樣版」的主旨/內文是由我們自己的資料表管理，寄送時透過同一個 EmailJS Template 轉發，因此需要在 [EmailJS Dashboard](https://dashboard.emailjs.com/) 另外建立一個「通用樣版」：

**Template 變數：**
- `{{to_email}}` — 收件者 Email（請設定在 Template 的 "To Email" 欄位）
- `{{to_name}}` — 收件者姓名
- `{{subject}}` — 信件主旨（請設定在 Template 的 "Subject" 欄位）
- `{{message}}` — 信件內文（建議 Content 區塊只放這一個變數）

**建議 Template 內容：**

Subject 欄位填：
```
{{subject}}
```

Content 區塊填：
```
{{message}}
```

取得 Template ID 後，請在 `services/cms.ts` 中更新 `EMAILJS_CONFIG` 的 `CUSTOM_TEMPLATE_ID`：

```ts
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_hksfuel',
  TEMPLATE_ID: 'template_ruioo1o',
  RESET_TEMPLATE_ID: 'template_xxxxxxx',
  CUSTOM_TEMPLATE_ID: 'template_xxxxxxx', // ← 改成你的自訂樣版 template ID
  PUBLIC_KEY: 'iHpUlqEoLptEllvz-'
};
```

在設定好之前，後台寄信功能會顯示錯誤提示「尚未設定 EmailJS 自訂樣版」。
