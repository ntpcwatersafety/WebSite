import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { GalleryItem } from '../../types';
import { getGalleryItems } from '../../services/cmsLoader';
import {
  createAlbum,
  updateAlbum,
  deleteAlbum,
  uploadAlbumPhoto,
  deleteAlbumPhoto,
} from '../../services/supabaseAdmin';

interface AdminGalleryProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AdminGallery: React.FC<AdminGalleryProps> = ({ onShowToast }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const data = await getGalleryItems();
      setItems(data);
    } catch (error) {
      onShowToast('載入相簿失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlbum = async () => {
    try {
      const newAlbum: Omit<GalleryItem, 'id' | 'photos'> = {
        title: '新相簿',
        description: '',
        isActive: true,
        date: new Date().toISOString().split('T')[0],
        category: '',
        sortOrder: items.length + 1,
        coverPhotoId: null,
      };
      await createAlbum('gallery', newAlbum);
      onShowToast('相簿已新增', 'success');
      loadGallery();
    } catch (error) {
      onShowToast('新增失敗', 'error');
    }
  };

  const handleUpdateAlbum = async (id: string, updates: Partial<GalleryItem>) => {
    try {
      await updateAlbum('gallery', id, updates);
      onShowToast('相簿已更新', 'success');
      loadGallery();
    } catch (error) {
      onShowToast('更新失敗', 'error');
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!confirm('確定要刪除此相簿嗎？相關照片也會被刪除。')) return;
    try {
      await deleteAlbum('gallery', id);
      onShowToast('相簿已刪除', 'success');
      loadGallery();
    } catch (error) {
      onShowToast('刪除失敗', 'error');
    }
  };

  const handleUploadPhoto = async (albumId: string, file: File) => {
    setUploading(albumId);
    try {
      await uploadAlbumPhoto('gallery', albumId, file);
      onShowToast('照片已上傳', 'success');
      loadGallery();
    } catch (error) {
      onShowToast('上傳失敗', 'error');
    } finally {
      setUploading(null);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('確定要刪除此照片嗎？')) return;
    try {
      await deleteAlbumPhoto('gallery', photoId);
      onShowToast('照片已刪除', 'success');
      loadGallery();
    } catch (error) {
      onShowToast('刪除失敗', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-8">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-900">活動剪影</h2>
        <button
          onClick={handleAddAlbum}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={18} />
          新增相簿
        </button>
      </div>

      <div className="space-y-6">
        {items.map((album) => (
          <div key={album.id} className="border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">標題</label>
                <input
                  type="text"
                  value={album.title || ''}
                  onChange={(e) => handleUpdateAlbum(album.id, { title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">日期</label>
                <input
                  type="date"
                  value={album.date || ''}
                  onChange={(e) => handleUpdateAlbum(album.id, { date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">描述</label>
                <textarea
                  value={album.description || ''}
                  onChange={(e) => handleUpdateAlbum(album.id, { description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={album.isActive || false}
                    onChange={(e) => handleUpdateAlbum(album.id, { isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">啟用</span>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => handleDeleteAlbum(album.id)}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <Trash2 size={16} />
                  刪除相簿
                </button>
              </div>
            </div>

            {/* Photos */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold text-gray-900 mb-4">相簿中的照片 ({album.photos?.length || 0})</h4>

              <div className="mb-4">
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition">
                  <Upload size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-600">上傳照片</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadPhoto(album.id, file);
                    }}
                    disabled={uploading === album.id}
                    className="hidden"
                  />
                </label>
              </div>

              {album.photos && album.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {album.photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg"
                      >
                        <Trash2 size={20} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-600 text-sm">
                  <ImageIcon size={32} className="mx-auto mb-2 text-gray-400" />
                  <p>此相簿尚無照片</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">尚無相簿</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
        <p>相簿和照片逐項即存。</p>
      </div>
    </div>
  );
};

export default AdminGallery;
