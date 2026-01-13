import React, { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import { PAGE_CONTENT } from '../services/cms';
import { getThankYouItems, ThankYouItem } from '../services/cmsLoader';

const ThankYou: React.FC = () => {
  const pageData = PAGE_CONTENT.thankyou;
  const [items, setItems] = useState<ThankYouItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getThankYouItems().then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Hero title={pageData.title} subtitle={pageData.subtitle} imageUrl={pageData.imageUrl} />
      <main className="container max-w-[800px] mx-auto my-12 px-5">
        <div className="bg-white rounded-lg shadow-md border-t-4 border-primary p-8">
          <h2 className="text-2xl font-bold text-primary mb-6">感恩有您</h2>
          {loading ? (
            <div className="text-center text-gray-400 py-12">載入中...</div>
          ) : items.length === 0 ? (
            <div className="text-center text-gray-400 py-12">尚無資料</div>
          ) : (
            <ul className="space-y-4">
              {items.map(item => (
                <li key={item.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <span className="font-semibold text-lg text-primary">{item.name}</span>
                  {item.description && <span className="ml-2 text-gray-600">{item.description}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
};

export default ThankYou;
