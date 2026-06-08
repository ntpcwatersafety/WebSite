import React, { useEffect, useState } from 'react';
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
import SortableGalleryList from '../../components/admin/SortableGalleryList';
import { useToast } from '../../contexts/ToastContext';

const cloneItem = (item: GalleryItem): GalleryItem => ({
  ...item,
  photos: [...(item.photos || [])],
});

const AdminGallery: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GalleryItem | null>(null);

  useEffect(() => {
    void loadGallery();
  }, []);

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

  const startEdit = (item: GalleryItem) => {
    setEditingId(item.id);
    setDraft(cloneItem(item));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const handleAddAlbum = async () => {
    try {
      const id = await createAlbum('gallery', {
        title: '新相簿',
        description: '',
        isActive: true,
        date: new Date().toISOString().split('T')[0],
        category: '',
        coverPhotoId: null,
      });

      const newItem: GalleryItem = {
        id,
        title: '新相簿',
        description: '',
        isActive: true,
        date: new Date().toISOString().split('T')[0],
        category: '',
        coverPhotoId: null,
        photos: [],
      };

      setItems((prev) => [newItem, ...prev]);
      startEdit(newItem);
      showToast('相簿已新增', 'success');
    } catch {
      showToast('新增失敗', 'error');
    }
  };

  const handleReorder = async (reordered: GalleryItem[]) => {
    const next = reordered.map((item, index) => ({
      ...item,
      sortOrder: (index + 1) * 10,
    }));

    setItems(next);
    if (editingId) {
      const nextEditing = next.find((item) => item.id === editingId);
      if (nextEditing) setDraft(cloneItem(nextEditing));
    }

    setSavingOrder(true);
    try {
      await Promise.all(next.map((item) => updateAlbum('gallery', item.id, { sortOrder: item.sortOrder })));
      showToast('排序已保存', 'success');
    } catch {
      showToast('保存排序失敗，已重新載入', 'error');
      await loadGallery();
    } finally {
      setSavingOrder(false);
    }
  };

  const handleSave = async () => {
    if (!editingId || !draft) return;

    try {
      const updates: Partial<GalleryItem> = {
        title: draft.title,
        date: draft.date,
        description: draft.description,
        isActive: draft.isActive,
        sortOrder: draft.sortOrder,
      };

      await updateAlbum('gallery', editingId, updates);
      setItems((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...updates } : item)));
      showToast('相簿已更新', 'success');
      cancelEdit();
    } catch {
      showToast('更新失敗', 'error');
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!confirm('確定要刪除此相簿嗎？相關照片也會被刪除。')) return;
    try {
      await deleteAlbum('gallery', id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) cancelEdit();
      showToast('相簿已刪除', 'success');
    } catch {
      showToast('刪除失敗', 'error');
    }
  };

  const handleUploadPhoto = async (albumId: string, file: File) => {
    setUploading(albumId);
    try {
      const { photoId, imageUrl } = await uploadAlbumPhoto('gallery', albumId, file);
      setItems((prev) => prev.map((item) => (
        item.id === albumId
          ? { ...item, photos: [...(item.photos || []), { id: photoId, imageUrl, title: '', description: '' }] }
          : item
      )));

      setDraft((prev) => {
        if (!prev || prev.id !== albumId) return prev;
        return {
          ...prev,
          photos: [...(prev.photos || []), { id: photoId, imageUrl, title: '', description: '' }],
        };
      });

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
      setItems((prev) => prev.map((item) => ({
        ...item,
        photos: (item.photos || []).filter((photo) => photo.id !== photoId),
      })));

      setDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          photos: (prev.photos || []).filter((photo) => photo.id !== photoId),
        };
      });

      showToast('照片已刪除', 'success');
    } catch {
      showToast('刪除失敗', 'error');
    }
  };

  const handleDeletePhotosBatch = async (albumId: string, photoIds: string[]) => {
    try {
      await deleteAlbumPhotosBatch('gallery', photoIds);
      const idSet = new Set(photoIds);
      setItems((prev) => prev.map((item) => (
        item.id === albumId
          ? { ...item, photos: (item.photos || []).filter((photo) => !idSet.has(photo.id)) }
          : item
      )));

      setDraft((prev) => {
        if (!prev || prev.id !== albumId) return prev;
        return {
          ...prev,
          photos: (prev.photos || []).filter((photo) => !idSet.has(photo.id)),
        };
      });

      showToast(`已刪除 ${photoIds.length} 張照片`, 'success');
    } catch {
      showToast('批次刪除失敗', 'error');
    }
  };

  const handleSetCover = async (albumId: string, photoId: string | null) => {
    try {
      await setCoverPhoto('gallery', albumId, photoId);
      setItems((prev) => prev.map((item) => (item.id === albumId ? { ...item, coverPhotoId: photoId } : item)));
      setDraft((prev) => (prev && prev.id === albumId ? { ...prev, coverPhotoId: photoId } : prev));
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
        <button
          onClick={handleAddAlbum}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={18} />
          新增相簿
        </button>
      </div>

      <SortableGalleryList
        items={items}
        selectedId={editingId}
        onSelect={startEdit}
        onReorder={handleReorder}
        savingOrder={savingOrder}
        emptyText="尚無相簿"
      />

      {editingId && draft && (
        <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">編輯相簿</h3>
            <button
              onClick={() => handleDeleteAlbum(editingId)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <Trash2 size={16} />
              刪除相簿
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">標題</label>
              <input
                type="text"
                value={draft.title || ''}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">日期</label>
              <input
                type="date"
                value={draft.date || ''}
                onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">排序（數字小排前）</label>
              <input
                type="number"
                value={draft.sortOrder ?? ''}
                onChange={(event) => setDraft({
                  ...draft,
                  sortOrder: event.target.value ? Number(event.target.value) : undefined,
                })}
                placeholder="10, 20, 30..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">描述</label>
            <textarea
              value={draft.description || ''}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.isActive || false}
                onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
                className="rounded"
              />
              <span className="text-sm">啟用</span>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={cancelEdit}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save size={16} />
              保存
            </button>
          </div>

          <AlbumPhotoGrid
            albumId={editingId}
            albumType="gallery"
            photos={draft.photos || []}
            coverPhotoId={draft.coverPhotoId}
            uploading={uploading === editingId}
            onUpload={handleUploadPhoto}
            onDeleteOne={handleDeletePhoto}
            onDeleteBatch={handleDeletePhotosBatch}
            onSetCover={handleSetCover}
          />
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
        <p>請先在上方列表拖拉排序，點「編輯」才會顯示詳細修改區。照片與封面設定都在下方編輯區完成。</p>
      </div>
    </div>
  );
};

export default AdminGallery;
