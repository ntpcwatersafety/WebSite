-- =====================================================
-- 數據遷移腳本 V2：修復表名衝突的遷移方案
-- =====================================================
-- 如果遷移 V1 失敗（因為新舊表同名衝突），執行此腳本

-- 步驟 1: 備份舊表為臨時表（如果還沒有的話）
-- 注意：此步驟只在舊表還存在 type 欄位且新表已建立時執行

-- 步驟 2: 從舊表遷移 gallery 類型的相簿數據到新表
-- 假設新的 water_gallery_albums 表是空的或者只包含新建立的數據
-- 而舊的 water_gallery_albums 表有 type 欄位

-- 先檢查新表中是否已有 gallery 類型的數據
-- SELECT COUNT(*) FROM water_gallery_albums;

-- 如果新表為空，直接從舊表插入 gallery 類型的數據：
-- 但由於新舊表同名，需要用別名
-- 在 Supabase 中，應該直接執行以下查詢：

-- 查詢舊 water_gallery_albums 表中所有 gallery 類型的相簿
-- (假設老表結構包含 type 欄位)
SELECT id, title, description, is_active, date, category, sort_order, cover_photo_id, created_at, updated_at
FROM water_gallery_albums
WHERE type = 'gallery'
LIMIT 10;

-- 如果上述查詢返回結果，執行以下插入語句：
-- 注意：由於表名衝突，可能需要在 Supabase UI 中手動執行，或使用備份表名

-- 解決方案：
-- 1. 在 Supabase 中，舊表可能已被新表覆蓋
-- 2. 檢查是否有備份表或者能從版本控制中恢復舊數據
-- 3. 或者直接在 Supabase UI 的 SQL 編輯器中查看 water_gallery_albums 的結構

-- 建議的操作步驟：
-- 1. 在 Supabase SQL 編輯器中執行：DESCRIBE water_gallery_albums; 或 \d water_gallery_albums
-- 2. 檢查表是否有 type 欄位
-- 3. 如果有 type 欄位，執行以下查詢查看數據：
--    SELECT COUNT(*) as total, COUNT(CASE WHEN type='gallery' THEN 1 END) as gallery_count FROM water_gallery_albums;
-- 4. 根據結果決定是否需要手動遷移數據
