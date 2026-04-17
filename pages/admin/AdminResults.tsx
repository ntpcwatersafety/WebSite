import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { GalleryItem } from '../../types';
import { getResultGalleryItems } from '../../services/cmsLoader';
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
import { useToast } from '../../contexts/ToastContext';


const AdminResults: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newSortOrder, setNewSortOrder] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getResultGalleryItems();
      setItems(data);
    } catch {
      showToast('載入訓練成果失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlbum = async () => {
    if (!newTitle.trim()) { showToast('請輸入標題', 'error'); return; }
    const sortOrder = newSortOrder ? Number(newSortOrder) : undefined;
    try {
      const id = await createAlbum('results', {
        title: newTitle,
        description: newDescription,
        isActive: true,
        date: newDate || undefined,
        sortOrder,
      });
      showToast('已新增', 'success');
      setItems(prev => [...prev, { id, title: newTitle, description: newDescription, isActive: true, date: newDate || undefined, sortOrder, photos: [] }]);
      setNewTitle('');
      setNewDate('');
      setNewSortOrder('');
      setNewDescription('');
    } catch {
      showToast('新增失敗', 'error');
    }
  };

  const handleUpdateDescription = async (item: GalleryItem) => {
    if (!editingItem) return;
    const updates: Partial<GalleryItem> = {
      title: editingItem.title || item.title,
      description: editingItem.description,
      date: editingItem.date,
      sortOrder: editingItem.sortOrder,
    };
    try {
      await updateAlbum('results', item.id, updates);
      setItems(prev => prev.map(a => a.id === item.id ? { ...a, ...updates } : a));
      showToast('已保存', 'success');
      setEditingItem(null);
    } catch {
      showToast('保存失敗', 'error');
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!window.confirm('確定要刪除此項目嗎？')) return;
    try {
      await deleteAlbum('results', id);
      setItems(prev => prev.filter(a => a.id !== id));
      showToast('已刪除', 'success');
    } catch {
      showToast('刪除失敗', 'error');
    }
  };

  const handleUploadPhoto = async (albumId: string, file: File) => {
    setUploading(albumId);
    try {
      const { photoId, imageUrl } = await uploadAlbumPhoto('results', albumId, file);
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
      await deleteAlbumPhoto('results', photoId);
      setItems(prev => prev.map(a => ({ ...a, photos: (a.photos || []).filter(p => p.id !== photoId) })));
      showToast('照片已刪除', 'success');
    } catch {
      showToast('刪除失敗', 'error');
    }
  };

  const handleDeletePhotosBatch = async (albumId: string, photoIds: string[]) => {
    try {
      await deleteAlbumPhotosBatch('results', photoIds);
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
      await setCoverPhoto('results', albumId, photoId);
      setItems(prev => prev.map(a => a.id === albumId ? { ...a, coverPhotoId: photoId } : a));
      showToast(photoId ? '封面已設定' : '已取消封面', 'success');
    } catch {
      showToast('設定封面失敗', 'error');
    }
  };

  if (loading) return <div className="text-center py-8">載入中...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">訓練成果</h2>

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">新增訓練成果</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="例如：2025年救生員訓練成果"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序（數字小排前）</label>
              <input
                type="number"
                value={newSortOrder}
                onChange={(e) => setNewSortOrder(e.target.value)}
                placeholder="10, 20, 30..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">標題</label>
                    <input
                      type="text"
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">日期</label>
                    <input
                      type="date"
                      value={editingItem.date || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">排序（數字小排前）</label>
                    <input
                      type="number"
                      value={editingItem.sortOrder ?? ''}
                      onChange={(e) => setEditingItem({ ...editingItem, sortOrder: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="10, 20, 30..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                  albumType="results"
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
          <p className="text-gray-600">尚無訓練成果</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
        <p>編輯後按「保存」才會寫入資料庫。點★設定封面照片，可批次選取照片後一次刪除。</p>
      </div>
    </div>
  );
};

export default AdminResults;
