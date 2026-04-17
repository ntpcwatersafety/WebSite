-- =====================================================
-- 清理腳本：刪除舊表中的 activities 和 results 數據，保留 gallery
-- =====================================================

-- 步驟 1: 刪除 activities 和 results 類型的相簿及其照片
DELETE FROM water_gallery_photos
WHERE album_id IN (
  SELECT id FROM water_gallery_albums
  WHERE type IN ('activities', 'results')
);

DELETE FROM water_gallery_albums
WHERE type IN ('activities', 'results');

-- 步驟 2: 刪除 type 欄位（如果存在）
-- 注意：在 Supabase 中，可能需要通過 Table Editor 手動刪除欄位
-- 或者執行以下 ALTER 語句（需要 PostgreSQL 權限）
-- ALTER TABLE water_gallery_albums DROP COLUMN type;

-- 步驟 3: 驗證刪除結果
SELECT type, COUNT(*) as count FROM water_gallery_albums GROUP BY type;
-- 應該只顯示 gallery 和 NULL（如果 type 欄位已刪除）

-- 驗證 gallery 數據仍存在
SELECT COUNT(*) as gallery_albums FROM water_gallery_albums WHERE type = 'gallery' OR type IS NULL;
SELECT COUNT(*) as gallery_photos FROM water_gallery_photos;
