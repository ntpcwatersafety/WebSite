import React, { useState } from 'react';
import { GalleryItem } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { sortGalleryItems } from '../services/cmsData';

interface GalleryCarouselProps {
  items: GalleryItem[];
}

const GalleryCarousel: React.FC<GalleryCarouselProps> = ({ items }) => {
  const activeItems = sortGalleryItems(items).filter((item) => item.isActive !== false && item.photos?.length);
  const [activityIndex, setActivityIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);

  if (activeItems.length === 0) return <div className="text-gray-400">無活動剪影</div>;

  const currentActivity = activeItems[activityIndex] || activeItems[0];
  const currentPhotos = currentActivity.photos || [];
  const currentPhoto = currentPhotos[photoIndex] || currentPhotos[0];
  const getCoverPhoto = (activity: GalleryItem) => (
    activity.photos.find((photo) => photo.id === activity.coverPhotoId) || activity.photos[0]
  );

  const selectActivity = (index: number) => {
    setActivityIndex(index);
    setPhotoIndex(0);
  };

  const goPrev = () => {
    if (photoIndex > 0) {
      setPhotoIndex((prev) => prev - 1);
      return;
    }

    const nextActivityIndex = activityIndex === 0 ? activeItems.length - 1 : activityIndex - 1;
    const nextPhotos = activeItems[nextActivityIndex]?.photos || [];
    setActivityIndex(nextActivityIndex);
    setPhotoIndex(Math.max(nextPhotos.length - 1, 0));
  };

  const goNext = () => {
    if (photoIndex < currentPhotos.length - 1) {
      setPhotoIndex((prev) => prev + 1);
      return;
    }

    const nextActivityIndex = activityIndex === activeItems.length - 1 ? 0 : activityIndex + 1;
    setActivityIndex(nextActivityIndex);
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
                alt={currentActivity.title || '活動剪影'}
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
                    <img src={photo.imageUrl} alt={currentActivity.title || '活動剪影縮圖'} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="md:w-2/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">活動 {activityIndex + 1} / {activeItems.length}</span>
              <span className="text-sm text-gray-400">照片 {photoIndex + 1} / {currentPhotos.length}</span>
            </div>
            {(currentActivity.category || currentActivity.date) && (
              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                {currentActivity.category ? (
                  <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 font-medium text-cyan-700">
                    {currentActivity.category}
                  </span>
                ) : null}
                {currentActivity.date ? (
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 font-medium text-slate-600">
                    {currentActivity.date}
                  </span>
                ) : null}
              </div>
            )}
            <h3 className="text-2xl font-bold text-primary">{currentActivity.title || '（無標題活動）'}</h3>
            {currentActivity.description ? <div className="mt-3 whitespace-pre-line text-gray-700">{currentActivity.description}</div> : null}
            {currentPhoto?.description ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-600">{currentPhoto.description}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {activeItems.map((activity, index) => {
          const coverPhoto = getCoverPhoto(activity);

          return (
            <button
              key={activity.id}
              type="button"
              onClick={() => selectActivity(index)}
              className={`overflow-hidden rounded-2xl border text-left transition ${index === activityIndex ? 'border-primary bg-cyan-50/50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
            >
              <div className="h-40 bg-slate-100">
                {coverPhoto ? <img src={coverPhoto.imageUrl} alt={activity.title} className="h-full w-full object-cover" /> : null}
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2 text-xs mb-2">
                  {activity.date ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{activity.date}</span> : null}
                  <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-cyan-700">{activity.photos.length} 張</span>
                </div>
                <h4 className="font-bold text-slate-800">{activity.title}</h4>
                {activity.description ? <p className="mt-2 line-clamp-2 text-sm text-slate-600">{activity.description}</p> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GalleryCarousel;
