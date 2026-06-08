import React, { useEffect, useState } from 'react';
import { Plus, Trash2, CheckCircle, Save } from 'lucide-react';
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
import SortableGalleryList from '../../components/admin/SortableGalleryList';
import { useToast } from '../../contexts/ToastContext';

const cloneItem = (item: GalleryItem): GalleryItem => ({
  ...item,
  photos: [...(item.photos || [])],
});

const AdminResults: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GalleryItem | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newSortOrder, setNewSortOrder] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    void loadItems();
  }, []);

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

  const startEdit = (item: GalleryItem) => {
    setEditingId(item.id);
    setDraft(cloneItem(item));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
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
      await Promise.all(next.map((item) => updateAlbum('results', item.id, { sortOrder: item.sortOrder })));
      showToast('排序已保存', 'success');
    } catch {
      showToast('保存排序失敗，已重新載入', 'error');
      await loadItems();
    } finally {
      setSavingOrder(false);
    }
  };

  const handleAddAlbum = async () => {
    if (!newTitle.trim()) {
      showToast('請輸入標題', 'error');
      return;
    }

    const sortOrder = newSortOrder ? Number(newSortOrder) : undefined;

    try {
      const id = await createAlbum('results', {
        title: newTitle,
        description: newDescription,
        isActive: true,
        date: newDate || undefined,
        sortOrder,
      });

      const newItem: GalleryItem = {
        id,
        title: newTitle,
        description: newDescription,
        isActive: true,
        date: newDate || undefined,
        sortOrder,
        photos: [],
      };

      setItems((prev) => [newItem, ...prev]);
      setNewTitle('');
      setNewDate('');
      setNewSortOrder('');
      setNewDescription('');
      startEdit(newItem);
      showToast('已新增', 'success');
    } catch {
      showToast('新增失敗', 'error');
    }
  };

  const handleSave = async () => {
    if (!editingId || !draft) return;

    const updates: Partial<GalleryItem> = {
      title: draft.title,
      description: draft.description,
      date: draft.date,
      sortOrder: draft.sortOrder,
    };

    try {
      await updateAlbum('results', editingId, updates);
      setItems((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...updates } : item)));
      showToast('已保存', 'success');
      cancelEdit();
    } catch {
      showToast('保存失敗', 'error');
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!window.confirm('確定要刪除此項目嗎？')) return;
    try {
      await deleteAlbum('results', id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) cancelEdit();
      showToast('已刪除', 'success');
    } catch {
      showToast('刪除失敗', 'error');
    }
  };

  const handleUploadPhoto = async (albumId: string, file: File) => {
    setUploading(albumId);
    try {
      const { photoId, imageUrl } = await uploadAlbumPhoto('results', albumId, file);
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
      await deleteAlbumPhoto('results', photoId);
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
      await deleteAlbumPhotosBatch('results', photoIds);
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
      await setCoverPhoto('results', albumId, photoId);
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
      <h2 className="text-2xl font-bold text-gray-900">訓練成果</h2>

      <SortableGalleryList
        items={items}
        selectedId={editingId}
        onSelect={startEdit}
        onReorder={handleReorder}
        savingOrder={savingOrder}
        emptyText="尚無訓練成果"
      />

      {editingId && draft && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">編輯訓練成果</h3>
            <button
              onClick={() => handleDeleteAlbum(editingId)}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              <Trash2 size={14} />
              刪除
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
            <RichEditor
              value={draft.description || ''}
              onChange={(content) => setDraft({ ...draft, description: content })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={cancelEdit} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">取消</button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Save size={16} />保存
            </button>
          </div>

          <AlbumPhotoGrid
            albumId={editingId}
            albumType="results"
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

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">新增訓練成果</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
              <input
                type="text"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="例如：2026年救生員訓練成果"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
              <input
                type="date"
                value={newDate}
                onChange={(event) => setNewDate(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序（可不填）</label>
              <input
                type="number"
                value={newSortOrder}
                onChange={(event) => setNewSortOrder(event.target.value)}
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
        <p>先在上方列表點「編輯」再修改內容。列表可拖拉排序，未設定排序時會依日期新的在上方。</p>
      </div>
    </div>
  );
};

export default AdminResults;
