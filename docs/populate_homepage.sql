-- =====================================================
-- 初始化首頁內容（可選）
-- =====================================================
-- 說明：如果前台首頁沒有顯示內容，可執行本 SQL 來初始化樣本數據

-- 1. 添加協會簡介（如果 water_site_settings 表中沒有 introContent）
-- 執行前請確保 water_site_settings 表存在
INSERT INTO water_site_settings (key, value)
VALUES ('introContent', '<p>新北市水上安全協會致力於推廣水上安全教育，提供專業的救生訓練課程，培養具備水上安全技能的人才。</p>')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. 添加樣本最新消息（執行前請先檢查 water_home_news 是否已有數據）
-- 如已有數據，可跳過此步驟
INSERT INTO water_home_news (title, description, date, link, is_new, is_pinned)
VALUES
  ('2025年救生員訓練班開始報名', '專業救生員訓練課程現已開放報名，名額有限，歡迎洽詢。', CURRENT_DATE, '/activities', true, true),
  ('協會榮獲水上安全推廣獎', '感謝各界支持，本協會榮獲今年水上安全推廣獎。', CURRENT_DATE - INTERVAL '7 days', '/awards', true, false)
ON CONFLICT DO NOTHING;
