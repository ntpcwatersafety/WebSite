import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { GalleryItem } from '../../types';
import { getResultGalleryItems } from '../../services/cmsLoader';
import {
  createAlbum,
  updateAlbum,
  deleteAlbum,
  uploadAlbumPhoto,
  deleteAlbumPhoto,
} from '../../services/supabaseAdmin';
import RichEditor from '../../components/RichEditor';

interface AdminResultsProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AdminResults: React.FC<AdminResultsProps> = ({ onShowToast }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getResultGalleryItems();
      setItems(data);
    } catch (error) {
      onShowToast('載入訓練成果失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlbum = async () => {
    if (!newTitle.trim()) {
      onShowToast('請輸入相簿標題', 'error');
      return;
    }

    try {
      await createAlbum('results', {
        title: newTitle,
        description: newDescription,
        isActive: true,
      });
      onShowToast('相簿已新增', 'success');
      setNewTitle('');
      setNewDescription('');
      await loadItems();
    } catch (error) {
      onShowToast('新增相簿失敗', 'error');
    }
  };

  const handleUpdateDescription = async (item: GalleryItem) => {
    if (!editingItem) return;

    try {
      await updateAlbum('results', item.id, {
        title: editingItem.title || item.title,
        description: editingItem.description,
      });
      onShowToast('已保存', 'success');
      setEditingItem(null);
      await loadItems();
    } catch (error) {
      onShowToast('保存失敗', 'error');
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!window.confirm('確定要刪除此相簿嗎？')) return;

    try {
      await deleteAlbum('results', id);
      onShowToast('已刪除', 'success');
      await loadItems();
    } catch (error) {
      onShowToast('刪除失敗', 'error');
    }
  };

  const handleUploadPhoto = async (albumId: string, file: File) => {
    setUploading(albumId);
    try {
      await uploadAlbumPhoto('results', albumId, file);
      onShowToast('照片已上傳', 'success');
      await loadItems();
    } catch (error) {
      onShowToast('上傳失敗', 'error');
    } finally {
      setUploading(null);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm('確定要刪除此照片嗎？')) return;

    try {
      await deleteAlbumPhoto('results', photoId);
      onShowToast('照片已刪除', 'success');
      await loadItems();
    } catch (error) {
      onShowToast('刪除失敗', 'error');
    }
  };

  if (loading) {
    return <div className="text-center py-8">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">訓練成果</h2>

      {/* 新增相簿 */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">新增訓練成果</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              標題
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="例如：2025年救生員訓練成果"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述
            </label>
            <RichEditor value={newDescription} onChange={setNewDescription} />
          </div>
          <button
            onClick={handleAddAlbum}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus size={18} />
            新增
          </button>
        </div>
      </div>

      {/* 現有相簿列表 */}
      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6">
            {editingItem?.id === item.id ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <RichEditor
                  value={editingItem.description}
                  onChange={(content) => setEditingItem({ ...editingItem, description: content })}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateDescription(item)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <div
                    className="text-gray-600 mt-2 text-sm"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />
                </div>

                {/* 照片上傳區域 */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-4">相簿中的照片 ({item.photos?.length || 0})</h4>

                  <div className="mb-4">
                    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition">
                      <Upload size={18} className="text-gray-500" />
                      <span className="text-sm text-gray-600">上傳照片</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadPhoto(item.id, file);
                        }}
                        disabled={uploading === item.id}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {item.photos && item.photos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {item.photos.map((photo) => (
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

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleDeleteAlbum(item.id)}
                    className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    <Trash2 size={14} />
                    刪除
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminResults;
