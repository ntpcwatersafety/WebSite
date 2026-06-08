import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, CheckCircle, Upload, X, Save, Pencil, Check } from 'lucide-react';
import { GalleryItem } from '../../types';
import { DEFAULT_ACTIVITY_CATEGORIES, getActivityCategories, getActivityGalleryItems } from '../../services/cmsLoader';
import {
  createAlbum,
  updateAlbum,
  updateActivityCategories,
  replaceActivityAlbumCategory,
  deleteAlbum,
  uploadAlbumPhoto,
  uploadQrCode,
  deleteAlbumPhoto,
  deleteAlbumPhotosBatch,
  setCoverPhoto,
} from '../../services/supabaseAdmin';
import RichEditor from '../../components/RichEditor';
import AlbumPhotoGrid from '../../components/AlbumPhotoGrid';
import SortableGalleryList from '../../components/admin/SortableGalleryList';
import { useToast } from '../../contexts/ToastContext';

type EditorMode = 'add' | 'edit' | null;

const cloneItem = (item: GalleryItem): GalleryItem => ({
  ...item,
  photos: [...(item.photos || [])],
});

const AdminActivities: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [categories, setCategories] = useState<string[]>([...DEFAULT_ACTIVITY_CATEGORIES]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GalleryItem | null>(null);

  const qrcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const [data, categoryList] = await Promise.all([
        getActivityGalleryItems(),
        getActivityCategories(),
      ]);
      setItems(data);
      setCategories(categoryList);
    } catch {
      showToast('載入報名資訊失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: GalleryItem) => {
    setEditorMode('edit');
    setEditingId(item.id);
    setDraft(cloneItem(item));
  };

  const startAdd = () => {
    setEditorMode('add');
    setEditingId(null);
    setDraft({
      id: '',
      title: '',
      description: '',
      isActive: true,
      date: new Date().toISOString().split('T')[0],
      sortOrder: undefined,
      registerUrl: '',
      qrcodeUrl: '',
      category: '',
      photos: [],
    });
  };

  const handleAddCategory = async () => {
    const value = newCategory.trim();
    if (!value) {
      showToast('請輸入類別名稱', 'error');
      return;
    }

    if (categories.includes(value)) {
      showToast('類別已存在', 'error');
      return;
    }

    const next = [...categories, value];
    try {
      await updateActivityCategories(next);
      setCategories(next);
      setNewCategory('');
      showToast('類別已新增', 'success');
    } catch {
      showToast('新增類別失敗', 'error');
    }
  };

  const startEditCategory = (category: string) => {
    setEditingCategory(category);
    setEditingCategoryValue(category);
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setEditingCategoryValue('');
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;

    const value = editingCategoryValue.trim();
    if (!value) {
      showToast('類別名稱不可空白', 'error');
      return;
    }

    if (value !== editingCategory && categories.includes(value)) {
      showToast('類別已存在', 'error');
      return;
    }

    const next = categories.map((cat) => (cat === editingCategory ? value : cat));

    try {
      await Promise.all([
        updateActivityCategories(next),
        replaceActivityAlbumCategory(editingCategory, value),
      ]);

      setCategories(next);
      setItems((prev) => prev.map((item) => (
        item.category === editingCategory ? { ...item, category: value } : item
      )));
      setDraft((prev) => {
        if (!prev) return prev;
        return prev.category === editingCategory ? { ...prev, category: value } : prev;
      });

      cancelEditCategory();
      showToast('類別已更新', 'success');
    } catch {
      showToast('更新類別失敗', 'error');
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (categories.length <= 1) {
      showToast('至少保留一個類別', 'error');
      return;
    }

    if (!window.confirm(`確定要刪除類別「${category}」嗎？該類別資料會改為未分類。`)) return;

    const next = categories.filter((cat) => cat !== category);
    try {
      await Promise.all([
        updateActivityCategories(next),
        replaceActivityAlbumCategory(category, ''),
      ]);

      setCategories(next);
      setItems((prev) => prev.map((item) => (
        item.category === category ? { ...item, category: '' } : item
      )));
      setDraft((prev) => {
        if (!prev) return prev;
        return prev.category === category ? { ...prev, category: next[0] || '' } : prev;
      });

      if (editingCategory === category) cancelEditCategory();
      showToast('類別已刪除', 'success');
    } catch {
      showToast('刪除類別失敗', 'error');
    }
  };

  const cancelEdit = () => {
    setEditorMode(null);
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
      await Promise.all(next.map((item) => updateAlbum('activities', item.id, { sortOrder: item.sortOrder })));
      showToast('排序已保存', 'success');
    } catch {
      showToast('保存排序失敗，已重新載入', 'error');
      await loadItems();
    } finally {
      setSavingOrder(false);
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.title?.trim()) {
      showToast('請輸入標題', 'error');
      return;
    }
    if (!String(draft.category || '').trim()) {
      showToast('請選擇類別', 'error');
      return;
    }

    try {
      if (editorMode === 'add') {
        await createAlbum('activities', {
          title: draft.title,
          description: draft.description,
          isActive: draft.isActive !== false,
          date: draft.date || undefined,
          sortOrder: draft.sortOrder,
          category: draft.category,
          registerUrl: draft.registerUrl,
          qrcodeUrl: draft.qrcodeUrl,
        });
        await loadItems();
        showToast('已新增', 'success');
      } else if (editorMode === 'edit' && editingId) {
        const updates: Partial<GalleryItem> = {
          title: draft.title,
          description: draft.description,
          date: draft.date,
          sortOrder: draft.sortOrder,
          category: draft.category,
          registerUrl: draft.registerUrl,
          qrcodeUrl: draft.qrcodeUrl,
        };

        await updateAlbum('activities', editingId, updates);
        setItems((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...updates } : item)));
        showToast('已保存', 'success');
      }

      cancelEdit();
    } catch {
      showToast(editorMode === 'add' ? '新增失敗' : '保存失敗', 'error');
    }
  };

  const handleUploadQrCode = async (file: File) => {
    if (!editingId || !draft) return;
    try {
      const url = await uploadQrCode(editingId, file);
      setDraft({ ...draft, qrcodeUrl: url });
      showToast('QRCode 已上傳', 'success');
    } catch {
      showToast('QRCode 上傳失敗', 'error');
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!window.confirm('確定要刪除此項目嗎？')) return;
    try {
      await deleteAlbum('activities', id);
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
      const { photoId, imageUrl } = await uploadAlbumPhoto('activities', albumId, file);
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
      await deleteAlbumPhoto('activities', photoId);
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
      await deleteAlbumPhotosBatch('activities', photoIds);
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
      await setCoverPhoto('activities', albumId, photoId);
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
        <h2 className="text-2xl font-bold text-gray-900">報名資訊</h2>
        <button
          onClick={startAdd}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={18} />新增
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">報名資訊類別管理</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div key={cat} className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-cyan-100 text-cyan-700">
              {editingCategory === cat ? (
                <>
                  <input
                    type="text"
                    value={editingCategoryValue}
                    onChange={(event) => setEditingCategoryValue(event.target.value)}
                    className="px-2 py-0.5 text-xs rounded border border-cyan-300 bg-white text-gray-700 w-24"
                  />
                  <button onClick={handleSaveCategory} className="text-cyan-700 hover:text-cyan-900" title="保存類別">
                    <Check size={14} />
                  </button>
                  <button onClick={cancelEditCategory} className="text-gray-500 hover:text-gray-700" title="取消編輯">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span>{cat}</span>
                  <button onClick={() => startEditCategory(cat)} className="text-cyan-700 hover:text-cyan-900" title="編輯類別">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => handleDeleteCategory(cat)} className="text-red-600 hover:text-red-700" title="刪除類別">
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            placeholder="新增類別，例如：青少年"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={handleAddCategory}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            新增類別
          </button>
        </div>
      </div>

      <SortableGalleryList
        items={items}
        selectedId={editingId}
        onSelect={startEdit}
        onReorder={handleReorder}
        savingOrder={savingOrder}
        emptyText="尚無報名資訊"
      />

      {editorMode && draft && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{editorMode === 'add' ? '新增報名資訊' : '編輯報名資訊'}</h3>
            {editorMode === 'edit' && editingId && (
              <button
                onClick={() => handleDeleteAlbum(editingId)}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                <Trash2 size={14} />
                刪除
              </button>
            )}
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
            <div>
              <label className="block text-xs text-gray-500 mb-1">類別</label>
              <select
                value={draft.category || ''}
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">請選擇類別</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">描述</label>
            <RichEditor
              value={draft.description || ''}
              onChange={(content) => setDraft({ ...draft, description: content })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div>
              <label className="block text-xs text-gray-500 mb-1">報名超連結</label>
              <input
                type="url"
                value={draft.registerUrl || ''}
                onChange={(event) => setDraft({ ...draft, registerUrl: event.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">QRCode 圖片</label>
              {editorMode === 'add' ? (
                <div className="text-xs text-gray-500">先保存新增資料後，才可上傳 QRCode。</div>
              ) : draft.qrcodeUrl ? (
                <div className="flex items-center gap-2">
                  <img src={draft.qrcodeUrl} alt="QRCode" className="h-12 w-12 object-contain border rounded" />
                  <button
                    onClick={() => setDraft({ ...draft, qrcodeUrl: '' })}
                    className="p-1 text-red-500 hover:text-red-700"
                    title="移除QRCode"
                  >
                    <X size={16} />
                  </button>
                  <label className="cursor-pointer text-xs text-blue-600 hover:underline">
                    更換
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={qrcodeInputRef}
                      onChange={(event) => {
                        if (event.target.files?.[0]) void handleUploadQrCode(event.target.files[0]);
                        event.target.value = '';
                      }}
                    />
                  </label>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
                  <Upload size={14} />上傳 QRCode
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      if (event.target.files?.[0]) void handleUploadQrCode(event.target.files[0]);
                      event.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={cancelEdit} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">取消</button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Save size={16} />保存
            </button>
          </div>

          {editorMode === 'edit' && editingId && (
            <AlbumPhotoGrid
              albumId={editingId}
              albumType="activities"
              photos={draft.photos || []}
              coverPhotoId={draft.coverPhotoId}
              uploading={uploading === editingId}
              onUpload={handleUploadPhoto}
              onDeleteOne={handleDeletePhoto}
              onDeleteBatch={handleDeletePhotosBatch}
              onSetCover={handleSetCover}
            />
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
        <p>先在上方點「新增」或從列表點「編輯」再修改內容。新增與編輯共用同一表單，保存新增後會刷新列表。</p>
      </div>
    </div>
  );
};

export default AdminActivities;
