import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { GalleryItem } from '../../types';
import { getActivityGalleryItems } from '../../services/cmsLoader';
import {
  createAlbum,
  updateAlbum,
  deleteAlbum,
  uploadAlbumPhoto,
  deleteAlbumPhoto,
  deleteAlbumPhotosBatch,
  setCoverPhoto,
} from '../../services/supabaseAdmin';
import RichEditor from '../../components/RichEditor';
import AlbumPhotoGrid from '../../components/AlbumPhotoGrid';

interface AdminActivitiesProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AdminActivities: React.FC<AdminActivitiesProps> = ({ onShowToast }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getActivityGalleryItems();
      setItems(data);
    } catch {
      onShowToast('載入報名資訊失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlbum = async () => {
    if (!newTitle.trim()) { onShowToast('請輸入標題', 'error'); return; }
    try {
      await createAlbum('activities', { title: newTitle, description: newDescription, isActive: true });
      onShowToast('已新增', 'success');
      setNewTitle('');
      setNewDescription('');
      await loadItems();
    } catch {
      onShowToast('新增失敗', 'error');
    }
  };

  const handleUpdateDescription = async (item: GalleryItem) => {
    if (!editingItem) return;
    const updatedTitle = editingItem.title || item.title;
    const updatedDescription = editingItem.description;
    const updatedDate = editingItem.date;
    try {
      await updateAlbum('activities', item.id, {
        title: updatedTitle,
        description: updatedDescription,
        date: updatedDate,
      });
      setItems(prev => prev.map(a => a.id === item.id ? { ...a, title: updatedTitle, description: updatedDescription, date: updatedDate } : a));
      onShowToast('已保存', 'success');
      setEditingItem(null);
    } catch {
      onShowToast('保存失敗', 'error');
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!window.confirm('確定要刪除此項目嗎？')) return;
    try {
      await deleteAlbum('activities', id);
      setItems(prev => prev.filter(a => a.id !== id));
      onShowToast('已刪除', 'success');
    } catch {
      onShowToast('刪除失敗', 'error');
    }
  };

  const handleUploadPhoto = async (albumId: string, file: File) => {
    setUploading(albumId);
    try {
      const { photoId, imageUrl } = await uploadAlbumPhoto('activities', albumId, file);
      setItems(prev => prev.map(a => a.id === albumId
        ? { ...a, photos: [...(a.photos || []), { id: photoId, imageUrl, title: '', description: '' }] }
        : a));
      onShowToast('照片已上傳', 'success');
    } catch {
      onShowToast('上傳失敗', 'error');
    } finally {
      setUploading(null);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deleteAlbumPhoto('activities', photoId);
      setItems(prev => prev.map(a => ({ ...a, photos: (a.photos || []).filter(p => p.id !== photoId) })));
      onShowToast('照片已刪除', 'success');
    } catch {
      onShowToast('刪除失敗', 'error');
    }
  };

  const handleDeletePhotosBatch = async (albumId: string, photoIds: string[]) => {
    try {
      await deleteAlbumPhotosBatch('activities', photoIds);
      const idSet = new Set(photoIds);
      setItems(prev => prev.map(a => a.id === albumId
        ? { ...a, photos: (a.photos || []).filter(p => !idSet.has(p.id)) }
        : a));
      onShowToast(`已刪除 ${photoIds.length} 張照片`, 'success');
    } catch {
      onShowToast('批次刪除失敗', 'error');
    }
  };

  const handleSetCover = async (albumId: string, photoId: string | null) => {
    try {
      await setCoverPhoto('activities', albumId, photoId);
      setItems(prev => prev.map(a => a.id === albumId ? { ...a, coverPhotoId: photoId } : a));
      onShowToast(photoId ? '封面已設定' : '已取消封面', 'success');
    } catch {
      onShowToast('設定封面失敗', 'error');
    }
  };

  if (loading) return <div className="text-center py-8">載入中...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">報名資訊</h2>

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">新增報名資訊</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">標題</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="例如：2026年救生員訓練班"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
            <RichEditor value={newDescription} onChange={setNewDescription} />
          </div>
          <button onClick={handleAddAlbum} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Plus size={18} />新增
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6">
            {editingItem?.id === item.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">標題</label>
                    <input
                      type="text"
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">日期</label>
                    <input
                      type="date"
                      value={editingItem.date || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <RichEditor
                  value={editingItem.description || ''}
                  onChange={(content) => setEditingItem({ ...editingItem, description: content })}
                />
                <div className="flex gap-2">
                  <button onClick={() => handleUpdateDescription(item)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">保存</button>
                  <button onClick={() => setEditingItem(null)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">取消</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <div className="text-gray-600 mt-2 text-sm" dangerouslySetInnerHTML={{ __html: item.description || '' }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingItem(item)} className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">編輯</button>
                  <button onClick={() => handleDeleteAlbum(item.id)} className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                    <Trash2 size={14} />刪除
                  </button>
                </div>

                <AlbumPhotoGrid
                  albumId={item.id}
                  albumType="activities"
                  photos={item.photos || []}
                  coverPhotoId={item.coverPhotoId}
                  uploading={uploading === item.id}
                  onUpload={handleUploadPhoto}
                  onDeleteOne={handleDeletePhoto}
                  onDeleteBatch={handleDeletePhotosBatch}
                  onSetCover={handleSetCover}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">尚無報名資訊</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
        <p>編輯後按「保存」才會寫入資料庫。點★設定封面照片，可批次選取照片後一次刪除。</p>
      </div>
    </div>
  );
};

export default AdminActivities;
