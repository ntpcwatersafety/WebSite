# 會員資料表 SQL

在 Supabase SQL Editor 執行以下語法建立會員資料表。

## 建立資料表

```sql
CREATE TABLE IF NOT EXISTS water_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address_county TEXT,
  address_district TEXT,
  address_detail TEXT,
  id_number TEXT,
  birth_date TEXT,
  identity TEXT,
  coach_cert_year TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  souvenir_received BOOLEAN DEFAULT FALSE,
  souvenir_receive_date TEXT,
  reset_token TEXT,
  reset_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 開放匿名讀寫政策（與其他資料表一致）

```sql
ALTER TABLE water_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_anon_all_members" ON water_members
  FOR ALL TO anon USING (true) WITH CHECK (true);
```

## EmailJS 密碼重設 Template 設定

請在 [EmailJS Dashboard](https://dashboard.emailjs.com/) 建立一個新的 Email Template：

**Template 變數：**
- `{{to_name}}` - 會員姓名
- `{{to_email}}` - 會員 Email（收件人）
- `{{reset_link}}` - 密碼重設連結

**建議 Template 內容（HTML）：**
```html
<h2>新北市水上安全協會 - 密碼重設</h2>
<p>親愛的 {{to_name}} 您好，</p>
<p>我們收到您的密碼重設請求。請點擊以下連結重設密碼（連結將在 1 小時後失效）：</p>
<p><a href="{{reset_link}}">{{reset_link}}</a></p>
<p>如果您沒有請求重設密碼，請忽略此郵件。</p>
<p>新北市水上安全協會</p>
```

**To Email 設定：** `{{to_email}}`

取得 Template ID 後，請在 `services/cms.ts` 中更新：
```ts
export const EMAILJS_RESET_TEMPLATE_ID = 'template_xxxxxxx'; // 改成你的 template ID
```
