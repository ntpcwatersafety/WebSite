import React, { useMemo, useState } from 'react';
import { GripVertical, Pencil, CalendarDays, Image as ImageIcon } from 'lucide-react';
import { GalleryItem } from '../../types';
import { sortGalleryItems } from '../../services/sortUtils';

interface SortableGalleryListProps {
  items: GalleryItem[];
  selectedId: string | null;
  onSelect: (item: GalleryItem) => void;
  onReorder: (items: GalleryItem[]) => Promise<void>;
  savingOrder?: boolean;
  emptyText: string;
  renderActions?: (item: GalleryItem) => React.ReactNode;
}

const reorderByIds = (items: GalleryItem[], dragId: string, dropId: string): GalleryItem[] => {
  if (dragId === dropId) return items;

  const sourceIndex = items.findIndex((item) => item.id === dragId);
  const targetIndex = items.findIndex((item) => item.id === dropId);
  if (sourceIndex < 0 || targetIndex < 0) return items;

  const next = [...items];
  const [dragItem] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, dragItem);
  return next;
};

const SortableGalleryList: React.FC<SortableGalleryListProps> = ({
  items,
  selectedId,
  onSelect,
  onReorder,
  savingOrder = false,
  emptyText,
  renderActions,
}) => {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sortedItems = useMemo(() => sortGalleryItems(items), [items]);

  const handleDrop = async (dropId: string) => {
    if (!dragId) return;

    const reordered = reorderByIds(sortedItems, dragId, dropId);
    setDragId(null);
    setOverId(null);

    if (reordered !== sortedItems) {
      await onReorder(reordered);
    }
  };

  if (sortedItems.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50 text-sm text-gray-600 flex items-center justify-between">
        <span>列表（預設日期新到舊，可拖拉排序）</span>
        {savingOrder && <span className="text-blue-600">排序儲存中...</span>}
      </div>

      <ul className="divide-y divide-gray-200">
        {sortedItems.map((item) => {
          const isSelected = selectedId === item.id;
          const isOver = overId === item.id;

          return (
            <li
              key={item.id}
              draggable={!savingOrder}
              onDragStart={() => setDragId(item.id)}
              onDragOver={(event) => {
                event.preventDefault();
                if (!savingOrder) setOverId(item.id);
              }}
              onDragLeave={() => setOverId((current) => (current === item.id ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                void handleDrop(item.id);
              }}
              className={`px-4 py-3 transition ${isSelected ? 'bg-blue-50' : 'bg-white'} ${isOver ? 'ring-2 ring-blue-200' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <GripVertical size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title || '(未命名)'}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      {item.date && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={12} />
                          {item.date}
                        </span>
                      )}
                      {item.category && <span>類別: {item.category}</span>}
                      <span className="inline-flex items-center gap-1">
                        <ImageIcon size={12} />
                        {item.photos?.length || 0} 張
                      </span>
                      {item.sortOrder != null && <span>排序 {item.sortOrder}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {renderActions ? renderActions(item) : null}
                  <button
                    onClick={() => onSelect(item)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Pencil size={14} />
                    編輯
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SortableGalleryList;
