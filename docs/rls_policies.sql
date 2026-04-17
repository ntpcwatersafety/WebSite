-- =====================================================
-- RLS 政策：允許匿名用戶讀取前台內容
-- =====================================================

-- 最新消息表
ALTER TABLE water_home_news ENABLE ROW LEVEL SECURITY;

-- 允許匿名用戶讀取最新消息
CREATE POLICY "allow_anon_read_home_news"
  ON water_home_news
  FOR SELECT
  USING (true);

-- 允許認證用戶執行所有操作
CREATE POLICY "allow_auth_all_home_news"
  ON water_home_news
  FOR ALL
  USING (auth.role() = 'authenticated');

-- =====================================================
-- 網站設定表
-- =====================================================
ALTER TABLE water_site_settings ENABLE ROW LEVEL SECURITY;

-- 允許匿名用戶讀取網站設定
CREATE POLICY "allow_anon_read_site_settings"
  ON water_site_settings
  FOR SELECT
  USING (true);

-- 允許認證用戶執行所有操作
CREATE POLICY "allow_auth_all_site_settings"
  ON water_site_settings
  FOR ALL
  USING (auth.role() = 'authenticated');

-- =====================================================
-- 媒體報導表
-- =====================================================
ALTER TABLE water_media_reports ENABLE ROW LEVEL SECURITY;

-- 允許匿名用戶讀取媒體報導
CREATE POLICY "allow_anon_read_media_reports"
  ON water_media_reports
  FOR SELECT
  USING (true);

-- 允許認證用戶執行所有操作
CREATE POLICY "allow_auth_all_media_reports"
  ON water_media_reports
  FOR ALL
  USING (auth.role() = 'authenticated');

-- =====================================================
-- 獲獎紀錄表
-- =====================================================
ALTER TABLE water_awards ENABLE ROW LEVEL SECURITY;

-- 允許匿名用戶讀取獲獎紀錄
CREATE POLICY "allow_anon_read_awards"
  ON water_awards
  FOR SELECT
  USING (true);

-- 允許認證用戶執行所有操作
CREATE POLICY "allow_auth_all_awards"
  ON water_awards
  FOR ALL
  USING (auth.role() = 'authenticated');

-- =====================================================
-- 感恩有您表
-- =====================================================
ALTER TABLE water_thank_you_items ENABLE ROW LEVEL SECURITY;

-- 允許匿名用戶讀取感恩有您
CREATE POLICY "allow_anon_read_thank_you_items"
  ON water_thank_you_items
  FOR SELECT
  USING (true);

-- 允許認證用戶執行所有操作
CREATE POLICY "allow_auth_all_thank_you_items"
  ON water_thank_you_items
  FOR ALL
  USING (auth.role() = 'authenticated');
