import React, { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import GalleryCarousel from '../components/GalleryCarousel';
import { PAGE_CONTENT } from '../services/cms';
import { getGalleryItems } from '../services/cmsLoader';
import { GalleryItem } from '../types';

const Gallery: React.FC = () => {
  const pageData = PAGE_CONTENT.gallery;
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGalleryItems().then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Hero title={pageData.title} subtitle={pageData.subtitle} imageUrl={pageData.imageUrl} />
      <main className="container max-w-[900px] mx-auto my-12 px-5">
        {loading ? (
          <div className="text-center text-gray-400 py-12">載入中...</div>
        ) : (
          <GalleryCarousel items={items} />
        )}
      </main>
    </>
  );
};

export default Gallery;
