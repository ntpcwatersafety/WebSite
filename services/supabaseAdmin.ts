import { supabase } from './supabaseClient';
import { GalleryItem, NewsItem, MediaItem, AwardItem, ThankYouItem } from '../types';

// ==================== 系統設定 ====================

export const updateAdminPassword = async (password: string) => {
  const { error } = await supabase
    .from('water_site_settings')
    .upsert({ key: 'adminPassword', value: password })
    .eq('key', 'adminPassword');
  if (error) throw error;
};

// ==================== 協會簡介 ====================

export const updateIntroContent = async (html: string) => {
  const { error } = await supabase
    .from('water_site_settings')
    .upsert({ key: 'introContent', value: html })
    .eq('key', 'introContent');
  if (error) throw error;
};

// ==================== 最新消息 ====================

export const createNewsItem = async (item: Omit<NewsItem, 'id'>) => {
  const id = `homeNews-${Date.now()}`;
  const { error } = await supabase
    .from('water_home_news')
    .insert({
      id,
      date: item.date,
      title: item.title,
      description: item.description || '',
      link: item.link || '',
      is_new: item.isNew || false,
      is_pinned: item.isPinned || false,
    });
  if (error) throw error;
  return id;
};

export const updateNewsItem = async (id: string, changes: Partial<NewsItem>) => {
  const updateData: Record<string, any> = {};
  if (changes.date) updateData.date = changes.date;
  if (changes.title) updateData.title = changes.title;
  if (changes.description !== undefined) updateData.description = changes.description;
  if (changes.link !== undefined) updateData.link = changes.link;
  if (changes.isNew !== undefined) updateData.is_new = changes.isNew;
  if (changes.isPinned !== undefined) updateData.is_pinned = changes.isPinned;

  const { error } = await supabase
    .from('water_home_news')
    .update(updateData)
    .eq('id', id);
  if (error) throw error;
};

export const deleteNewsItem = async (id: string) => {
  const { error } = await supabase
    .from('water_home_news')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ==================== 相簿管理 ====================

/**
 * 取得表名對應關係
 */
const getAlbumTableName = (type: 'activities' | 'results' | 'gallery'): string => {
  const tableMap: Record<string, string> = {
    activities: 'water_activity_albums',
    results: 'water_result_albums',
    gallery: 'water_gallery_albums',
  };
  return tableMap[type];
};

const getPhotoTableName = (type: 'activities' | 'results' | 'gallery'): string => {
  const tableMap: Record<string, string> = {
    activities: 'water_activity_photos',
    results: 'water_result_photos',
    gallery: 'water_gallery_photos',
  };
  return tableMap[type];
};

export const createAlbum = async (
  type: 'activities' | 'results' | 'gallery',
  item: Omit<GalleryItem, 'id' | 'photos'>
) => {
  const id = `${type}Album-${Date.now()}`;
  const tableName = getAlbumTableName(type);

  const { error } = await supabase
    .from(tableName)
    .insert({
      id,
      title: item.title,
      description: item.description || '',
      is_active: item.isActive !== false,
      date: item.date || null,
      category: item.category || '',
      sort_order: item.sortOrder || null,
      cover_photo_id: item.coverPhotoId || null,
    });
  if (error) throw error;
  return id;
};

export const updateAlbum = async (
  type: 'activities' | 'results' | 'gallery',
  id: string,
  changes: Partial<GalleryItem>
) => {
  const tableName = getAlbumTableName(type);
  const updateData: Record<string, any> = {};
  if (changes.title) updateData.title = changes.title;
  if (changes.description !== undefined) updateData.description = changes.description;
  if (changes.isActive !== undefined) updateData.is_active = changes.isActive;
  if (changes.date !== undefined) updateData.date = changes.date;
  if (changes.category !== undefined) updateData.category = changes.category;
  if (changes.sortOrder !== undefined) updateData.sort_order = changes.sortOrder;
  if (changes.coverPhotoId !== undefined) updateData.cover_photo_id = changes.coverPhotoId;

  const { error } = await supabase
    .from(tableName)
    .update(updateData)
    .eq('id', id);
  if (error) throw error;
};

export const deleteAlbum = async (type: 'activities' | 'results' | 'gallery', id: string) => {
  const tableName = getAlbumTableName(type);
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const uploadAlbumPhoto = async (
  type: 'activities' | 'results' | 'gallery',
  albumId: string,
  file: File,
  title: string = ''
) => {
  // 上傳圖片到 Supabase Storage
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('gallery-images')
    .upload(filePath, file);
  if (uploadError) throw uploadError;

  // 取得公開 URL
  const { data } = supabase.storage.from('gallery-images').getPublicUrl(filePath);
  const imageUrl = data.publicUrl;

  // 新增照片記錄
  const photoTableName = getPhotoTableName(type);
  const photoId = `${albumId}-photo-${Date.now()}`;
  const { error: insertError } = await supabase
    .from(photoTableName)
    .insert({
      id: photoId,
      album_id: albumId,
      image_url: imageUrl,
      title: title || '',
      description: '',
    });
  if (insertError) throw insertError;

  return { photoId, imageUrl };
};

export const deleteAlbumPhoto = async (
  type: 'activities' | 'results' | 'gallery',
  photoId: string
) => {
  const photoTableName = getPhotoTableName(type);

  // 取得照片資訊
  const { data: photo, error: fetchError } = await supabase
    .from(photoTableName)
    .select('image_url')
    .eq('id', photoId)
    .single();
  if (fetchError) throw fetchError;

  // 從 Storage 刪除
  if (photo?.image_url) {
    const filePath = photo.image_url.split('/').pop();
    if (filePath) {
      await supabase.storage.from('gallery-images').remove([filePath]);
    }
  }

  // 刪除資料庫記錄
  const { error: deleteError } = await supabase
    .from(photoTableName)
    .delete()
    .eq('id', photoId);
  if (deleteError) throw deleteError;
};

export const setCoverPhoto = async (
  type: 'activities' | 'results' | 'gallery',
  albumId: string,
  photoId: string | null
) => {
  const tableName = getAlbumTableName(type);
  const { error } = await supabase
    .from(tableName)
    .update({ cover_photo_id: photoId })
    .eq('id', albumId);
  if (error) throw error;
};

// ==================== 媒體報導 ====================

export const createMediaReport = async (item: Omit<MediaItem, 'id'>) => {
  const id = `mediaReport-${Date.now()}`;
  const { error } = await supabase
    .from('water_media_reports')
    .insert({
      id,
      date: item.date,
      title: item.title,
      source: item.source || '',
      link: item.link || '',
      type: item.type,
    });
  if (error) throw error;
  return id;
};

export const updateMediaReport = async (id: string, changes: Partial<MediaItem>) => {
  const updateData: Record<string, any> = {};
  if (changes.date) updateData.date = changes.date;
  if (changes.title) updateData.title = changes.title;
  if (changes.source !== undefined) updateData.source = changes.source;
  if (changes.link !== undefined) updateData.link = changes.link;
  if (changes.type) updateData.type = changes.type;

  const { error } = await supabase
    .from('water_media_reports')
    .update(updateData)
    .eq('id', id);
  if (error) throw error;
};

export const deleteMediaReport = async (id: string) => {
  const { error } = await supabase
    .from('water_media_reports')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ==================== 獲獎紀錄 ====================

export const createAward = async (item: Omit<AwardItem, 'id'>) => {
  const id = `award-${Date.now()}`;
  const { error } = await supabase
    .from('water_awards')
    .insert({
      id,
      year: item.year,
      title: item.title,
      description: item.description || '',
      icon: item.icon || '',
    });
  if (error) throw error;
  return id;
};

export const updateAward = async (id: string, changes: Partial<AwardItem>) => {
  const updateData: Record<string, any> = {};
  if (changes.year) updateData.year = changes.year;
  if (changes.title) updateData.title = changes.title;
  if (changes.description !== undefined) updateData.description = changes.description;
  if (changes.icon !== undefined) updateData.icon = changes.icon;

  const { error } = await supabase
    .from('water_awards')
    .update(updateData)
    .eq('id', id);
  if (error) throw error;
};

export const deleteAward = async (id: string) => {
  const { error } = await supabase
    .from('water_awards')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ==================== 感恩有您 ====================

export const createThankYouItem = async (item: Omit<ThankYouItem, 'id'>) => {
  const id = `thankYouItem-${Date.now()}`;
  const { error } = await supabase
    .from('water_thank_you_items')
    .insert({
      id,
      name: item.name,
      year: item.year || '',
      sort_order: item.sortOrder || null,
      description: item.description || '',
    });
  if (error) throw error;
  return id;
};

export const updateThankYouItem = async (id: string, changes: Partial<ThankYouItem>) => {
  const updateData: Record<string, any> = {};
  if (changes.name) updateData.name = changes.name;
  if (changes.year !== undefined) updateData.year = changes.year;
  if (changes.sortOrder !== undefined) updateData.sort_order = changes.sortOrder;
  if (changes.description !== undefined) updateData.description = changes.description;

  const { error } = await supabase
    .from('water_thank_you_items')
    .update(updateData)
    .eq('id', id);
  if (error) throw error;
};

export const deleteThankYouItem = async (id: string) => {
  const { error } = await supabase
    .from('water_thank_you_items')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ==================== TinyMCE 圖片上傳 ====================

export const uploadEditorImage = async (file: File): Promise<string> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const filePath = `${year}/${month}/${fileName}`;

  const { error } = await supabase.storage
    .from('editor-images')
    .upload(filePath, file);
  if (error) throw error;

  const { data } = supabase.storage.from('editor-images').getPublicUrl(filePath);
  return data.publicUrl;
};
