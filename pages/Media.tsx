import React, { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import { PAGE_CONTENT } from '../services/cms';
import { getMediaReports } from '../services/cmsLoader';
import { renderMediaItems } from '../services/contentRenderer';

const Media: React.FC = () => {
  const pageData = PAGE_CONTENT.media;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMediaReports().then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Hero title={pageData.title} subtitle={pageData.subtitle} imageUrl={pageData.imageUrl} />
      <main className="container max-w-[900px] mx-auto my-12 px-5">
        <div className="bg-white rounded-lg shadow-md border-t-4 border-primary p-8">
          <h2 className="text-2xl font-bold text-primary mb-6">媒體報導</h2>
          {loading ? (
            <div className="text-center text-gray-400 py-12">載入中...</div>
          ) : items.length === 0 ? (
            <div className="text-center text-gray-400 py-12">尚無資料</div>
          ) : (
            renderMediaItems(items)
          )}
        </div>
      </main>
    </>
  );
};

export default Media;
