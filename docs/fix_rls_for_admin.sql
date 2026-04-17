-- =====================================================
-- 修正 RLS：後台使用本地認證，所有寫入操作以匿名身份執行
-- 需要將所有後台會寫入的表，開放匿名用戶的寫入權限
-- =====================================================

-- water_site_settings（協會簡介、密碼）
DROP POLICY IF EXISTS "allow_auth_all_site_settings" ON water_site_settings;
CREATE POLICY "allow_anon_all_site_settings"
  ON water_site_settings FOR ALL USING (true) WITH CHECK (true);

-- water_home_news（最新消息）
DROP POLICY IF EXISTS "allow_auth_all_home_news" ON water_home_news;
CREATE POLICY "allow_anon_all_home_news"
  ON water_home_news FOR ALL USING (true) WITH CHECK (true);

-- water_media_reports（媒體報導）
DROP POLICY IF EXISTS "allow_auth_all_media_reports" ON water_media_reports;
CREATE POLICY "allow_anon_all_media_reports"
  ON water_media_reports FOR ALL USING (true) WITH CHECK (true);

-- water_awards（獲獎紀錄）
DROP POLICY IF EXISTS "allow_auth_all_awards" ON water_awards;
CREATE POLICY "allow_anon_all_awards"
  ON water_awards FOR ALL USING (true) WITH CHECK (true);

-- water_thank_you_items（感恩有您）
DROP POLICY IF EXISTS "allow_auth_all_thank_you_items" ON water_thank_you_items;
CREATE POLICY "allow_anon_all_thank_you_items"
  ON water_thank_you_items FOR ALL USING (true) WITH CHECK (true);

-- water_activity_albums（報名資訊相簿）
DROP POLICY IF EXISTS "allow_auth_all_activity_albums" ON water_activity_albums;
CREATE POLICY "allow_anon_all_activity_albums"
  ON water_activity_albums FOR ALL USING (true) WITH CHECK (true);

-- water_activity_photos（報名資訊照片）
DROP POLICY IF EXISTS "allow_auth_all_activity_photos" ON water_activity_photos;
CREATE POLICY "allow_anon_all_activity_photos"
  ON water_activity_photos FOR ALL USING (true) WITH CHECK (true);

-- water_result_albums（訓練成果相簿）
DROP POLICY IF EXISTS "allow_auth_all_result_albums" ON water_result_albums;
CREATE POLICY "allow_anon_all_result_albums"
  ON water_result_albums FOR ALL USING (true) WITH CHECK (true);

-- water_result_photos（訓練成果照片）
DROP POLICY IF EXISTS "allow_auth_all_result_photos" ON water_result_photos;
CREATE POLICY "allow_anon_all_result_photos"
  ON water_result_photos FOR ALL USING (true) WITH CHECK (true);

-- water_gallery_albums（活動剪影相簿）
DROP POLICY IF EXISTS "allow_auth_all_gallery_albums" ON water_gallery_albums;
CREATE POLICY "allow_anon_all_gallery_albums"
  ON water_gallery_albums FOR ALL USING (true) WITH CHECK (true);

-- water_gallery_photos（活動剪影照片）
DROP POLICY IF EXISTS "allow_auth_all_gallery_photos" ON water_gallery_photos;
CREATE POLICY "allow_anon_all_gallery_photos"
  ON water_gallery_photos FOR ALL USING (true) WITH CHECK (true);
