import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Trash2, CheckSquare, Square, RefreshCw, Image as ImageIcon, X } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface MediaFile {
  name: string;
  url: string;
  createdAt: string;
  size: number;
}

interface AdminMediaLibraryProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const BUCKET = 'gallery-images';

const AdminMediaLibrary: React.FC<AdminMediaLibraryProps> = ({ onShowToast }) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<MediaFile | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from(BUCKET).list('', {
        limit: 500,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (error) throw error;

      const items: MediaFile[] = (data || [])
        .filter((f) => f.name !== '.emptyFolderPlaceholder')
        .map((f) => ({
          name: f.name,
          url: supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
          createdAt: f.created_at || '',
          size: f.metadata?.size || 0,
        }));
      setFiles(items);
    } catch {
      onShowToast('載入圖檔失敗', 'error');
    } finally {
      setLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    let successCount = 0;
    for (const file of Array.from(fileList)) {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(fileName, file);
      if (!error) successCount++;
    }
    setUploading(false);
    onShowToast(`已上傳 ${successCount} 張圖片`, 'success');
    loadFiles();
  };

  const toggleSelect = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === files.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(files.map((f) => f.name)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`確定要刪除選取的 ${selected.size} 張圖片嗎？此操作無法復原。`)) return;
    setDeleting(true);
    try {
      const names = Array.from(selected);
      const { error } = await supabase.storage.from(BUCKET).remove(names);
      if (error) throw error;
      onShowToast(`已刪除 ${names.length} 張圖片`, 'success');
      setSelected(new Set());
      loadFiles();
    } catch {
      onShowToast('刪除失敗', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteOne = async (name: string) => {
    if (!window.confirm('確定要刪除此圖片嗎？')) return;
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([name]);
      if (error) throw error;
      onShowToast('圖片已刪除', 'success');
      setSelected((prev) => { const n = new Set(prev); n.delete(name); return n; });
      if (preview?.name === name) setPreview(null);
      loadFiles();
    } catch {
      onShowToast('刪除失敗', 'error');
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  if (loading) return <div className="text-center py-8">載入中...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">圖檔管理</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadFiles}
            className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw size={15} />
            重新整理
          </button>

          <label className={`flex items-center gap-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <Upload size={15} />
            {uploading ? '上傳中...' : '上傳圖片'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
            />
          </label>

          {selected.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              <Trash2 size={15} />
              {deleting ? '刪除中...' : `刪除選取 (${selected.size})`}
            </button>
          )}
        </div>
      </div>

      {/* 全選列 */}
      {files.length > 0 && (
        <div className="flex items-center gap-3 px-2 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600">
            {selected.size === files.length
              ? <CheckSquare size={18} className="text-blue-600" />
              : <Square size={18} />}
            {selected.size === files.length ? '取消全選' : '全選'}
          </button>
          <span className="text-sm text-gray-500">共 {files.length} 張圖片{selected.size > 0 ? `，已選 ${selected.size} 張` : ''}</span>
        </div>
      )}

      {/* 圖片格線 */}
      {files.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <ImageIcon size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">尚無圖片，請上傳</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {files.map((file) => {
            const isSelected = selected.has(file.name);
            return (
              <div
                key={file.name}
                className={`relative group rounded-lg overflow-hidden border-2 transition cursor-pointer ${isSelected ? 'border-blue-500 shadow-md' : 'border-transparent hover:border-gray-300'}`}
                onClick={() => toggleSelect(file.name)}
              >
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-28 object-cover bg-gray-100"
                  loading="lazy"
                />

                {/* 選取勾選框 */}
                <div className={`absolute top-1.5 left-1.5 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition`}>
                  {isSelected
                    ? <CheckSquare size={20} className="text-blue-500 bg-white rounded" />
                    : <Square size={20} className="text-gray-400 bg-white/80 rounded" />}
                </div>

                {/* Hover 操作列 */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 flex items-center justify-between px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => { e.stopPropagation(); setPreview(file); }}
                    className="text-white text-xs hover:text-blue-300"
                  >
                    預覽
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteOne(file.name); }}
                    className="text-red-400 hover:text-red-200"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* 檔名 */}
                <div className="px-1 py-1 bg-white">
                  <p className="text-xs text-gray-500 truncate">{file.name}</p>
                  {file.size > 0 && <p className="text-xs text-gray-400">{formatSize(file.size)}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 預覽 Modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="text-sm font-medium text-gray-700 truncate">{preview.name}</p>
              <button onClick={() => setPreview(null)} className="text-gray-500 hover:text-gray-800">
                <X size={20} />
              </button>
            </div>
            <img src={preview.url} alt={preview.name} className="w-full max-h-[60vh] object-contain bg-gray-50" />
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-xs text-gray-500">{formatSize(preview.size)}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(preview.url); onShowToast('已複製圖片連結', 'success'); }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  複製連結
                </button>
                <button
                  onClick={() => { handleDeleteOne(preview.name); setPreview(null); }}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMediaLibrary;
