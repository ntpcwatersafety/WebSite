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
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-3/5 bg-slate-100">
            <div className="relative flex min-h-[320px] items-center justify-center bg-slate-100 md:min-h-[420px]">
              <img
                src={currentPhoto?.imageUrl}
                alt={currentItem.title || itemLabel}
                className="h-full max-h-[520px] w-full object-contain"
              />
              <button onClick={goPrev} className="absolute left-3 rounded-full bg-black/45 p-2 text-white transition hover:bg-black/65">
                <ChevronLeft size={28} />
              </button>
              <button onClick={goNext} className="absolute right-3 rounded-full bg-black/45 p-2 text-white transition hover:bg-black/65">
                <ChevronRight size={28} />
              </button>
            </div>
            {currentPhotos.length > 1 ? (
              <div className="flex gap-3 overflow-x-auto border-t border-slate-200 bg-slate-50 px-4 py-4">
                {currentPhotos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setPhotoIndex(index)}
                    className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${index === photoIndex ? 'border-primary shadow-sm' : 'border-transparent opacity-75 hover:opacity-100'}`}
                  >
                    <img src={photo.imageUrl} alt={currentItem.title || `${itemLabel}縮圖`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="md:w-2/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">{itemLabel} {itemIndex + 1} / {activeItems.length}</span>
              <span className="text-sm text-gray-400">照片 {photoIndex + 1} / {currentPhotos.length}</span>
            </div>
            {(currentItem.category || currentItem.date) && (
              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                {currentItem.category ? (
                  <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 font-medium text-cyan-700">
                    {currentItem.category}
                  </span>
                ) : null}
                {currentItem.date ? (
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 font-medium text-slate-600">
                    {currentItem.date}
                  </span>
                ) : null}
              </div>
            )}
            <h3 className="text-2xl font-bold text-primary">{currentItem.title || `（無標題${itemLabel}）`}</h3>
            {currentItem.description ? <div className="mt-3 whitespace-pre-line text-gray-700">{currentItem.description}</div> : null}
            {currentPhoto?.description ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-600">{currentPhoto.description}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

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
              className="absolute right-3 top-3 z-10 rounded-full bg-black/45 p-2 text-white transition hover:bg-black/65"
              aria-label="關閉播放視窗"
            >
              <X size={22} />
            </button>

            <div className="relative flex min-h-[320px] items-center justify-center bg-black md:min-h-[72vh]">
              <img
                src={currentPhoto?.imageUrl}
                alt={currentItem.title || itemLabel}
                className="max-h-[72vh] w-full object-contain"
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

            <div className="border-t border-white/10 bg-slate-900/95 p-4 text-white md:p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span>{itemLabel} {itemIndex + 1} / {activeItems.length}</span>
                <span>照片 {photoIndex + 1} / {currentPhotos.length}</span>
                {currentItem.date ? <span>{currentItem.date}</span> : null}
              </div>
              <h4 className="mt-2 text-lg font-bold md:text-xl">{currentItem.title || `（無標題${itemLabel}）`}</h4>
              {currentPhoto?.description ? (
                <p className="mt-2 text-sm leading-6 text-slate-200">{currentPhoto.description}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GalleryCarousel;
