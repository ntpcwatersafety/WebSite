import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, CheckCircle } from 'lucide-react';
import { GalleryItem } from '../../types';
import { getGalleryItems } from '../../services/cmsLoader';
import {
  createAlbum,
  updateAlbum,
  deleteAlbum,
  uploadAlbumPhoto,
  deleteAlbumPhoto,
  deleteAlbumPhotosBatch,
  setCoverPhoto,
} from '../../services/supabaseAdmin';
import AlbumPhotoGrid from '../../components/AlbumPhotoGrid';
import { useToast } from '../../contexts/ToastContext';


interface AlbumRowProps {
  album: GalleryItem;
  uploading: string | null;
  onUpdate: (id: string, updates: Partial<GalleryItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUploadPhoto: (albumId: string, file: File) => Promise<void>;
  onDeletePhoto: (photoId: string) => Promise<void>;
  onDeletePhotosBatch: (albumId: string, photoIds: string[]) => Promise<void>;
  onSetCover: (albumId: string, photoId: string | null) => Promise<void>;
}

const AlbumRow: React.FC<AlbumRowProps> = ({
  album, uploading, onUpdate, onDelete,
  onUploadPhoto, onDeletePhoto, onDeletePhotosBatch, onSetCover,
}) => {
  const [draft, setDraft] = useState({ ...album });

  const handleSave = () => {
    onUpdate(album.id, {
      title: draft.title,
      date: draft.date,
      description: draft.description,
      isActive: draft.isActive,
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">標題</label>
          <input
            type="text"
            value={draft.title || ''}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">日期</label>
          <input
            type="date"
            value={draft.date || ''}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">描述</label>
          <textarea
            value={draft.description || ''}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={2}
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isActive || false}
              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">啟用</span>
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Save size={16} />
            保存
          </button>
          <button
            onClick={() => onDelete(album.id)}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <Trash2 size={16} />
            刪除相簿
          </button>
        </div>
      </div>

      <AlbumPhotoGrid
        albumId={album.id}
        albumType="gallery"
        photos={album.photos || []}
        coverPhotoId={album.coverPhotoId}
        uploading={uploading === album.id}
        onUpload={onUploadPhoto}
        onDeleteOne={onDeletePhoto}
        onDeleteBatch={onDeletePhotosBatch}
        onSetCover={onSetCover}
      />
    </div>
  );
};

const AdminGallery: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => { loadGallery(); }, []);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const data = await getGalleryItems();
      setItems(data);
    } catch {
      showToast('載入相簿失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlbum = async () => {
    try {
      await createAlbum('gallery', {
        title: '新相簿',
        description: '',
        isActive: true,
        date: new Date().toISOString().split('T')[0],
        category: '',
        sortOrder: items.length + 1,
        coverPhotoId: null,
      });
      showToast('相簿已新增', 'success');
      loadGallery();
    } catch {
      showToast('新增失敗', 'error');
    }
  };

  const handleUpdateAlbum = async (id: string, updates: Partial<GalleryItem>) => {
    try {
      await updateAlbum('gallery', id, updates);
      setItems(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
      showToast('相簿已更新', 'success');
    } catch {
      showToast('更新失敗', 'error');
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!confirm('確定要刪除此相簿嗎？相關照片也會被刪除。')) return;
    try {
      await deleteAlbum('gallery', id);
      setItems(prev => prev.filter(a => a.id !== id));
      showToast('相簿已刪除', 'success');
    } catch {
      showToast('刪除失敗', 'error');
    }
  };

  const handleUploadPhoto = async (albumId: string, file: File) => {
    setUploading(albumId);
    try {
      const { photoId, imageUrl } = await uploadAlbumPhoto('gallery', albumId, file);
      setItems(prev => prev.map(a => a.id === albumId
        ? { ...a, photos: [...(a.photos || []), { id: photoId, imageUrl, title: '', description: '' }] }
        : a));
      showToast('照片已上傳', 'success');
    } catch {
      showToast('上傳失敗', 'error');
    } finally {
      setUploading(null);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deleteAlbumPhoto('gallery', photoId);
      setItems(prev => prev.map(a => ({ ...a, photos: (a.photos || []).filter(p => p.id !== photoId) })));
      showToast('照片已刪除', 'success');
    } catch {
      showToast('刪除失敗', 'error');
    }
  };

  const handleDeletePhotosBatch = async (albumId: string, photoIds: string[]) => {
    try {
      await deleteAlbumPhotosBatch('gallery', photoIds);
      const idSet = new Set(photoIds);
      setItems(prev => prev.map(a => a.id === albumId
        ? { ...a, photos: (a.photos || []).filter(p => !idSet.has(p.id)) }
        : a));
      showToast(`已刪除 ${photoIds.length} 張照片`, 'success');
    } catch {
      showToast('批次刪除失敗', 'error');
    }
  };

  const handleSetCover = async (albumId: string, photoId: string | null) => {
    try {
      await setCoverPhoto('gallery', albumId, photoId);
      setItems(prev => prev.map(a => a.id === albumId ? { ...a, coverPhotoId: photoId } : a));
      showToast(photoId ? '封面已設定' : '已取消封面', 'success');
    } catch {
      showToast('設定封面失敗', 'error');
    }
  };

  if (loading) return <div className="text-center py-8">載入中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">活動剪影</h2>
        <button onClick={handleAddAlbum} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          <Plus size={18} />新增相簿
        </button>
      </div>

      <div className="space-y-6">
        {items.map((album) => (
          <AlbumRow
            key={album.id}
            album={album}
            uploading={uploading}
            onUpdate={handleUpdateAlbum}
            onDelete={handleDeleteAlbum}
            onUploadPhoto={handleUploadPhoto}
            onDeletePhoto={handleDeletePhoto}
            onDeletePhotosBatch={handleDeletePhotosBatch}
            onSetCover={handleSetCover}
          />
        ))}
      </div>

      {items.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">尚無相簿</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
        <p>編輯後按「保存」才會寫入資料庫。點★設定封面照片，可批次選取照片後一次刪除。</p>
      </div>
    </div>
  );
};

export default AdminGallery;
