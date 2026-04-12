import React, { useEffect, useState } from 'react';
import { GalleryItem } from '../types';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { sortGalleryItems } from '../services/cmsData';

interface GalleryCarouselProps {
  items: GalleryItem[];
  emptyMessage?: string;
  itemLabel?: string;
}

const GalleryCarousel: React.FC<GalleryCarouselProps> = ({
  items,
  emptyMessage = '目前尚無相簿內容。',
  itemLabel = '項目'
}) => {
  const activeItems = sortGalleryItems(items).filter((item) => item.isActive !== false && item.photos?.length);
  const [itemIndex, setItemIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (activeItems.length === 0) return <div className="text-gray-400">{emptyMessage}</div>;

  const currentItem = activeItems[itemIndex] || activeItems[0];
  const currentPhotos = currentItem.photos || [];
  const currentPhoto = currentPhotos[photoIndex] || currentPhotos[0];
  const getCoverPhoto = (item: GalleryItem) => (
    item.photos.find((photo) => photo.id === item.coverPhotoId) || item.photos[0]
  );

  const selectItem = (index: number) => {
    setItemIndex(index);
    setPhotoIndex(0);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
      if (event.key === 'ArrowLeft') {
        goPrev();
      }
      if (event.key === 'ArrowRight') {
        goNext();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeydown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [isModalOpen, photoIndex, itemIndex]);

  const goPrev = () => {
    if (photoIndex > 0) {
      setPhotoIndex((prev) => prev - 1);
      return;
    }

    const nextItemIndex = itemIndex === 0 ? activeItems.length - 1 : itemIndex - 1;
    const nextPhotos = activeItems[nextItemIndex]?.photos || [];
    setItemIndex(nextItemIndex);
    setPhotoIndex(Math.max(nextPhotos.length - 1, 0));
  };

  const goNext = () => {
    if (photoIndex < currentPhotos.length - 1) {
      setPhotoIndex((prev) => prev + 1);
      return;
    }

    const nextItemIndex = itemIndex === activeItems.length - 1 ? 0 : itemIndex + 1;
    setItemIndex(nextItemIndex);
    setPhotoIndex(0);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {activeItems.map((item, index) => {
          const coverPhoto = getCoverPhoto(item);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectItem(index)}
              className={`overflow-hidden rounded-2xl border text-left transition ${index === itemIndex ? 'border-primary bg-cyan-50/50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
            >
              <div className="h-40 bg-slate-100">
                {coverPhoto ? <img src={coverPhoto.imageUrl} alt={item.title} className="h-full w-full object-cover" /> : null}
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2 text-xs mb-2">
                  {item.date ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{item.date}</span> : null}
                  <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-cyan-700">{item.photos.length} 張</span>
                </div>
                <h4 className="font-bold text-slate-800">{item.title}</h4>
                {item.description ? <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.description}</p> : null}
              </div>
            </button>
          );
        })}
      </div>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label="活動相簿播放視窗"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-6xl overflow-hidden rounded-2xl bg-slate-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-3 top-3 z-20 rounded-full bg-black/45 p-2 text-white transition hover:bg-black/65"
              aria-label="關閉播放視窗"
            >
              <X size={22} />
            </button>

            {/* Grid: 手機單欄捲動，桌機雙欄固定高度 */}
            <div className="grid max-h-[85vh] overflow-y-auto md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_420px] md:h-[85vh] md:max-h-none md:overflow-hidden">

              {/* 左側：圖片區 */}
              <div className="relative flex min-h-[260px] flex-col bg-black md:min-h-0 md:overflow-hidden">
                <div className="relative flex flex-1 items-center justify-center overflow-hidden">
                  <img
                    src={currentPhoto?.imageUrl}
                    alt={currentItem.title || itemLabel}
                    className="max-h-[50vh] w-full object-contain md:absolute md:inset-0 md:h-full md:max-h-none md:w-full"
                  />
                  <button
                    type="button"
                    onClick={goPrev}
                    className="absolute left-3 rounded-full bg-black/45 p-2 text-white transition hover:bg-black/65"
                    aria-label="上一張"
                  >
                    <ChevronLeft size={28} />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute right-3 rounded-full bg-black/45 p-2 text-white transition hover:bg-black/65"
                    aria-label="下一張"
                  >
                    <ChevronRight size={28} />
                  </button>
                </div>

                {currentPhotos.length > 1 ? (
                  <div className="flex gap-3 overflow-x-auto border-t border-white/10 bg-slate-900/90 px-4 py-4">
                    {currentPhotos.map((photo, index) => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setPhotoIndex(index)}
                        className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${index === photoIndex ? 'border-cyan-300 shadow-sm' : 'border-transparent opacity-75 hover:opacity-100'}`}
                      >
                        <img src={photo.imageUrl} alt={currentItem.title || `${itemLabel}縮圖`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* 右側：資訊欄，桌機 grid item 自動撐滿 row 高度，overflow-y-auto 捲動 */}
              <aside className="border-t border-white/10 bg-slate-950/95 text-white md:border-l md:border-t-0 md:overflow-y-auto">
                <div className="p-5 md:p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span>{itemLabel} {itemIndex + 1} / {activeItems.length}</span>
                    <span>照片 {photoIndex + 1} / {currentPhotos.length}</span>
                  </div>
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-cyan-200">活動資訊</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {currentItem.category ? (
                        <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 font-medium text-cyan-200">
                          {currentItem.category}
                        </span>
                      ) : null}
                      {currentItem.date ? (
                        <span className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 font-medium text-slate-200">
                          {currentItem.date}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-cyan-200">活動說明</p>
                    <h4 className="mt-2 text-xl font-bold leading-snug">{currentItem.title || `（無標題${itemLabel}）`}</h4>
                    {currentItem.description ? (
                      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-200">{currentItem.description}</p>
                    ) : (
                      <p className="mt-3 text-sm text-slate-400">目前尚無活動說明。</p>
                    )}
                  </div>

                  {currentPhoto?.description ? (
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[11px] font-semibold tracking-[0.14em] text-cyan-200">照片說明</p>
                      <p className="text-sm leading-6 text-slate-100">{currentPhoto.description}</p>
                    </div>
                  ) : null}
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GalleryCarousel;
