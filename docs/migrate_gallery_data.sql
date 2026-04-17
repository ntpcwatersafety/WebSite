-- =====================================================
-- 數據遷移腳本：將舊 water_gallery_albums 分離到三個新表
-- =====================================================
-- 說明：如果舊的 water_gallery_albums 表有 type 欄位，執行此腳本進行數據遷移

-- 1. 遷移報名資訊（activities）到新表
INSERT INTO water_activity_albums (id, title, description, is_active, date, category, sort_order, cover_photo_id, created_at, updated_at)
SELECT id, title, description, is_active, date, category, sort_order, cover_photo_id, created_at, updated_at
FROM water_gallery_albums
WHERE type = 'activities'
ON CONFLICT (id) DO NOTHING;

-- 2. 遷移訓練成果（results）到新表
INSERT INTO water_result_albums (id, title, description, is_active, date, category, sort_order, cover_photo_id, created_at, updated_at)
SELECT id, title, description, is_active, date, category, sort_order, cover_photo_id, created_at, updated_at
FROM water_gallery_albums
WHERE type = 'results'
ON CONFLICT (id) DO NOTHING;

-- 3. 保留或複製純 gallery 類型的數據到新 water_gallery_albums（避免重複）
INSERT INTO water_gallery_albums (id, title, description, is_active, date, category, sort_order, cover_photo_id, created_at, updated_at)
SELECT id, title, description, is_active, date, category, sort_order, cover_photo_id, created_at, updated_at
FROM water_gallery_albums wga_old
WHERE type = 'gallery'
  AND id NOT IN (SELECT id FROM water_gallery_albums wga_new WHERE wga_new.id = wga_old.id)
ON CONFLICT (id) DO NOTHING;

-- 4. 遷移報名資訊照片
INSERT INTO water_activity_photos (id, album_id, image_url, title, description, created_at)
SELECT wgp.id, wgp.album_id, wgp.image_url, wgp.title, wgp.description, wgp.created_at
FROM water_gallery_photos wgp
INNER JOIN water_gallery_albums wga ON wgp.album_id = wga.id
WHERE wga.type = 'activities'
ON CONFLICT (id) DO NOTHING;

-- 5. 遷移訓練成果照片
INSERT INTO water_result_photos (id, album_id, image_url, title, description, created_at)
SELECT wgp.id, wgp.album_id, wgp.image_url, wgp.title, wgp.description, wgp.created_at
FROM water_gallery_photos wgp
INNER JOIN water_gallery_albums wga ON wgp.album_id = wga.id
WHERE wga.type = 'results'
ON CONFLICT (id) DO NOTHING;

-- 6. 遷移純 gallery 類型的照片到新表（避免重複）
INSERT INTO water_gallery_photos (id, album_id, image_url, title, description, created_at)
SELECT wgp.id, wgp.album_id, wgp.image_url, wgp.title, wgp.description, wgp.created_at
FROM water_gallery_photos wgp
INNER JOIN water_gallery_albums wga ON wgp.album_id = wga.id
WHERE wga.type = 'gallery'
  AND wgp.id NOT IN (SELECT id FROM water_gallery_photos wgp_new WHERE wgp_new.id = wgp.id)
ON CONFLICT (id) DO NOTHING;
