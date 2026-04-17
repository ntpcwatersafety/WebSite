-- =====================================================
-- 驗證 gallery 數據完整性
-- =====================================================

-- 1. 檢查 water_gallery_albums 表的數據
SELECT id, title, is_active, date FROM water_gallery_albums LIMIT 10;

-- 2. 檢查 water_gallery_photos 表的數據
SELECT id, album_id, image_url FROM water_gallery_photos LIMIT 10;

-- 3. 檢查相簿與照片的關聯
SELECT
  wga.id as album_id,
  wga.title as album_title,
  COUNT(wgp.id) as photo_count
FROM water_gallery_albums wga
LEFT JOIN water_gallery_photos wgp ON wga.id = wgp.album_id
GROUP BY wga.id, wga.title;

-- 4. 檢查是否有孤立的照片（album_id 不存在的照片）
SELECT wgp.id, wgp.album_id
FROM water_gallery_photos wgp
WHERE wgp.album_id NOT IN (SELECT id FROM water_gallery_albums);

-- 5. 檢查 type 欄位是否還存在（應該不存在）
SELECT COUNT(*) as type_column_exists
FROM information_schema.columns
WHERE table_name = 'water_gallery_albums' AND column_name = 'type';
