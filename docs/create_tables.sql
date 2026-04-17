-- =====================================================
-- 新北市水上安全協會網站 - 資料庫表結構
-- 將 water_gallery_albums 拆分為三個獨立表
-- =====================================================

-- =====================================================
-- 1. 報名資訊相簿表
-- =====================================================
CREATE TABLE water_activity_albums (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  date DATE,
  category TEXT DEFAULT '',
  sort_order INTEGER,
  cover_photo_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加更新時間戳觸發器
CREATE OR REPLACE FUNCTION update_water_activity_albums_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_water_activity_albums_updated_at
BEFORE UPDATE ON water_activity_albums
FOR EACH ROW
EXECUTE FUNCTION update_water_activity_albums_updated_at();

-- 報名資訊照片表
CREATE TABLE water_activity_photos (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL REFERENCES water_activity_albums(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 為 album_id 添加索引以提高查詢性能
CREATE INDEX idx_water_activity_photos_album_id ON water_activity_photos(album_id);

-- =====================================================
-- 2. 訓練成果相簿表
-- =====================================================
CREATE TABLE water_result_albums (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  date DATE,
  category TEXT DEFAULT '',
  sort_order INTEGER,
  cover_photo_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加更新時間戳觸發器
CREATE OR REPLACE FUNCTION update_water_result_albums_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_water_result_albums_updated_at
BEFORE UPDATE ON water_result_albums
FOR EACH ROW
EXECUTE FUNCTION update_water_result_albums_updated_at();

-- 訓練成果照片表
CREATE TABLE water_result_photos (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL REFERENCES water_result_albums(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 為 album_id 添加索引以提高查詢性能
CREATE INDEX idx_water_result_photos_album_id ON water_result_photos(album_id);

-- =====================================================
-- 3. 活動剪影相簿表（保持不變，但添加新欄位）
-- =====================================================
-- 如果 water_gallery_albums 表已存在，執行以下 ALTER 語句添加缺失的欄位
-- 如果表不存在，執行以下 CREATE 語句

CREATE TABLE IF NOT EXISTS water_gallery_albums (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  date DATE,
  category TEXT DEFAULT '',
  sort_order INTEGER,
  cover_photo_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 活動剪影照片表
CREATE TABLE IF NOT EXISTS water_gallery_photos (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL REFERENCES water_gallery_albums(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 為 album_id 添加索引
CREATE INDEX IF NOT EXISTS idx_water_gallery_photos_album_id ON water_gallery_photos(album_id);

-- =====================================================
-- 4. RLS (Row Level Security) 政策設定
-- =====================================================

-- 啟用 RLS
ALTER TABLE water_activity_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_activity_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_result_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_result_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_gallery_photos ENABLE ROW LEVEL SECURITY;

-- 報名資訊相簿：匿名用戶可讀取（is_active=true）
CREATE POLICY "allow_anon_read_activity_albums"
  ON water_activity_albums
  FOR SELECT
  USING (is_active = true);

-- 報名資訊相簿：認證用戶可執行所有操作
CREATE POLICY "allow_auth_all_activity_albums"
  ON water_activity_albums
  FOR ALL
  USING (auth.role() = 'authenticated');

-- 報名資訊照片：匿名用戶可讀取
CREATE POLICY "allow_anon_read_activity_photos"
  ON water_activity_photos
  FOR SELECT
  USING (true);

-- 報名資訊照片：認證用戶可執行所有操作
CREATE POLICY "allow_auth_all_activity_photos"
  ON water_activity_photos
  FOR ALL
  USING (auth.role() = 'authenticated');

-- 訓練成果相簿：匿名用戶可讀取（is_active=true）
CREATE POLICY "allow_anon_read_result_albums"
  ON water_result_albums
  FOR SELECT
  USING (is_active = true);

-- 訓練成果相簿：認證用戶可執行所有操作
CREATE POLICY "allow_auth_all_result_albums"
  ON water_result_albums
  FOR ALL
  USING (auth.role() = 'authenticated');

-- 訓練成果照片：匿名用戶可讀取
CREATE POLICY "allow_anon_read_result_photos"
  ON water_result_photos
  FOR SELECT
  USING (true);

-- 訓練成果照片：認證用戶可執行所有操作
CREATE POLICY "allow_auth_all_result_photos"
  ON water_result_photos
  FOR ALL
  USING (auth.role() = 'authenticated');

-- 活動剪影相簿：匿名用戶可讀取（is_active=true）
CREATE POLICY "allow_anon_read_gallery_albums"
  ON water_gallery_albums
  FOR SELECT
  USING (is_active = true);

-- 活動剪影相簿：認證用戶可執行所有操作
CREATE POLICY "allow_auth_all_gallery_albums"
  ON water_gallery_albums
  FOR ALL
  USING (auth.role() = 'authenticated');

-- 活動剪影照片：匿名用戶可讀取
CREATE POLICY "allow_anon_read_gallery_photos"
  ON water_gallery_photos
  FOR SELECT
  USING (true);

-- 活動剪影照片：認證用戶可執行所有操作
CREATE POLICY "allow_auth_all_gallery_photos"
  ON water_gallery_photos
  FOR ALL
  USING (auth.role() = 'authenticated');

-- =====================================================
-- 5. 資料遷移腳本（從舊表遷移數據）
-- =====================================================
-- 注意：只有在舊表 water_gallery_albums 存在且有 type 欄位時才執行

-- 遷移報名資訊（activities）
-- INSERT INTO water_activity_albums (id, title, description, is_active, date, category, sort_order, cover_photo_id, created_at, updated_at)
-- SELECT id, title, description, is_active, date, category, sort_order, cover_photo_id, created_at, updated_at
-- FROM water_gallery_albums
-- WHERE type = 'activities';

-- 遷移訓練成果（results）
-- INSERT INTO water_result_albums (id, title, description, is_active, date, category, sort_order, cover_photo_id, created_at, updated_at)
-- SELECT id, title, description, is_active, date, category, sort_order, cover_photo_id, created_at, updated_at
-- FROM water_gallery_albums
-- WHERE type = 'results';

-- 遷移報名資訊照片
-- INSERT INTO water_activity_photos (id, album_id, image_url, title, description, created_at)
-- SELECT wgp.id, wgp.album_id, wgp.image_url, wgp.title, wgp.description, wgp.created_at
-- FROM water_gallery_photos wgp
-- INNER JOIN water_gallery_albums wga ON wgp.album_id = wga.id
-- WHERE wga.type = 'activities';

-- 遷移訓練成果照片
-- INSERT INTO water_result_photos (id, album_id, image_url, title, description, created_at)
-- SELECT wgp.id, wgp.album_id, wgp.image_url, wgp.title, wgp.description, wgp.created_at
-- FROM water_gallery_photos wgp
-- INNER JOIN water_gallery_albums wga ON wgp.album_id = wga.id
-- WHERE wga.type = 'results';
