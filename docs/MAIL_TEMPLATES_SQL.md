# mail_templates / mail_logs 資料表

用於「後台信件樣版」與「報名資料寄信」功能。

✅ **設定狀態：已完成（2026-06-30）**。以下 SQL 僅供未來重建資料表或排查問題時參考，目前不需要重做。

請先在 Supabase SQL Editor 執行以下語法：

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

## EmailJS 樣版設定（重要：免費方案僅 2 個樣版額度）

✅ **設定狀態：已完成（2026-06-30）**。以下步驟僅供未來重設或排查問題時參考，目前不需要重做。

EmailJS 免費方案只能有 1 個 Email Service + 2 個樣版，本站已用滿（Contact Us、Password Reset），無法再新增第 3 個樣版。

因此後台「信件樣版」寄信功能改為**與「Password Reset」共用同一個 EmailJS Template**（`RESET_TEMPLATE_ID`），不需要新增樣版。請至 [EmailJS Dashboard](https://dashboard.emailjs.com/) → Email Templates → 編輯既有的「Password Reset」樣版，把內容改成通用格式：

**Subject 欄位改為：**
```
{{subject}}
```

**Content 區塊改為（HTML 模式）：**
```
{{message}}
```

**To Email 欄位維持：** `{{to_email}}`

改完之後：
- 密碼重設信會由 `services/cms.ts` 的 `sendPasswordResetEmail()` 組好完整文字（含重設連結）放進 `message` 變數寄出，外觀與原本類似。
- 後台信件樣版寄信也透過同一個樣版，把樣版管理頁設定的主旨/內文放進 `subject`／`message` 寄出。

`services/cms.ts` 不需要再額外設定 Template ID，兩個功能都使用既有的 `RESET_TEMPLATE_ID`。

⚠️ **注意：** EmailJS 的 Email Service（`service_hksfuel`）目前連接的是 Gmail 帳號 `ntpcwatersafety@gmail.com`。若此帳號已被 Yahoo 等信箱判定為濫發來源並封鎖，透過 EmailJS 寄到 `@yahoo.com.tw`、`@yahoo.com` 等信箱仍可能被擋，這與樣版數量無關，需要另外處理寄件信箱的寄送信譽問題（例如改用有 SPF/DKIM 網域驗證的寄信服務）。
