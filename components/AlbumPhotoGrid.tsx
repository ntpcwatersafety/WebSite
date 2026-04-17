import React, { useState } from 'react';
import { Trash2, Upload, CheckSquare, Square, Star, Image as ImageIcon } from 'lucide-react';
import { GalleryPhoto } from '../types';

interface AlbumPhotoGridProps {
  albumId: string;
  albumType: 'activities' | 'results' | 'gallery';
  photos: GalleryPhoto[];
  coverPhotoId?: string | null;
  uploading: boolean;
  onUpload: (albumId: string, file: File) => Promise<void>;
  onDeleteOne: (photoId: string) => Promise<void>;
  onDeleteBatch: (albumId: string, photoIds: string[]) => Promise<void>;
  onSetCover: (albumId: string, photoId: string | null) => Promise<void>;
}

const AlbumPhotoGrid: React.FC<AlbumPhotoGridProps> = ({
  albumId,
  photos,
  coverPhotoId,
  uploading,
  onUpload,
  onDeleteOne,
  onDeleteBatch,
  onSetCover,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === photos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(photos.map((p) => p.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`確定要刪除選取的 ${selected.size} 張照片嗎？`)) return;
    setDeleting(true);
    try {
      await onDeleteBatch(albumId, Array.from(selected));
      setSelected(new Set());
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="border-t pt-4 space-y-3">
      {/* 標題列 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="font-semibold text-gray-900">
          相簿照片（{photos.length} 張）
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          {photos.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
            >
              {selected.size === photos.length
                ? <CheckSquare size={13} className="text-blue-600" />
                : <Square size={13} />}
              {selected.size === photos.length ? '取消全選' : '全選'}
            </button>
          )}
          {selected.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 size={13} />
              {deleting ? '刪除中...' : `刪除選取 (${selected.size})`}
            </button>
          )}
          <label className={`flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <Upload size={13} />
            {uploading ? '上傳中...' : '上傳照片'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const files = e.target.files;
                if (!files) return;
                Array.from(files).forEach((f) => onUpload(albumId, f));
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </div>

      {/* 照片格線 */}
      {photos.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500 text-sm">
          <ImageIcon size={28} className="mx-auto mb-2 text-gray-400" />
          此相簿尚無照片
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => {
            const isSelected = selected.has(photo.id);
            const isCover = photo.id === coverPhotoId;
            return (
              <div
                key={photo.id}
                className={`relative group rounded-lg overflow-hidden border-2 transition cursor-pointer ${isSelected ? 'border-blue-500 shadow' : isCover ? 'border-yellow-400 shadow' : 'border-transparent hover:border-gray-300'}`}
                onClick={() => toggleSelect(photo.id)}
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.title || ''}
                  className="w-full h-28 object-cover bg-gray-100"
                  loading="lazy"
                />

                {/* 封面標籤 */}
                {isCover && (
                  <div className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                    <Star size={10} fill="currentColor" />
                    封面
                  </div>
                )}

                {/* 選取勾選框 */}
                <div className={`absolute top-1 right-1 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition`}>
                  {isSelected
                    ? <CheckSquare size={18} className="text-blue-500 bg-white rounded" />
                    : <Square size={18} className="text-gray-400 bg-white/80 rounded" />}
                </div>

                {/* Hover 操作列 */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 flex items-center justify-between px-2 py-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetCover(albumId, isCover ? null : photo.id);
                    }}
                    className={`text-xs ${isCover ? 'text-yellow-300' : 'text-white hover:text-yellow-300'}`}
                    title={isCover ? '取消封面' : '設為封面'}
                  >
                    <Star size={14} fill={isCover ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('確定要刪除此照片嗎？')) {
                        setSelected((prev) => { const n = new Set(prev); n.delete(photo.id); return n; });
                        onDeleteOne(photo.id);
                      }
                    }}
                    className="text-red-400 hover:text-red-200"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AlbumPhotoGrid;
