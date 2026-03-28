import React, { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import GalleryCarousel from '../components/GalleryCarousel';
import { PAGE_CONTENT } from '../services/cms';
import { getGalleryItems } from '../services/cmsLoader';
import { GalleryItem } from '../types';

interface GalleryPageProps {
  pageKey: 'activities' | 'results' | 'gallery';
  loadItems?: () => Promise<GalleryItem[]>;
  emptyMessage?: string;
  itemLabel?: string;
}

const GalleryPage: React.FC<GalleryPageProps> = ({
  pageKey,
  loadItems = getGalleryItems,
  emptyMessage,
  itemLabel
}) => {
  const pageData = PAGE_CONTENT[pageKey];
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems().then(data => {
      setItems(data);
      setLoading(false);
    });
  }, [loadItems]);

  return (
    <>
      <Hero title={pageData.title} subtitle={pageData.subtitle} imageUrl={pageData.imageUrl} />
      <main className="container max-w-[900px] mx-auto my-12 px-5">
        {loading ? (
          <div className="text-center text-gray-400 py-12">載入中...</div>
        ) : (
          <GalleryCarousel items={items} emptyMessage={emptyMessage} itemLabel={itemLabel} />
        )}
      </main>
    </>
  );
};

export default GalleryPage;
