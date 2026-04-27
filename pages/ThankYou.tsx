import React, { useEffect, useMemo, useState } from 'react';
import Hero from '../components/Hero';
import { PAGE_CONTENT } from '../services/cms';
import { getThankYouItems } from '../services/cmsLoader';
import { ThankYouItem } from '../types';
import { sortThankYouItems } from '../services/sortUtils';

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

  const groups = useMemo(() => {
    const sortedItems = sortThankYouItems(items);
    const grouped = new Map<string, ThankYouItem[]>();

    sortedItems.forEach((item) => {
      const year = item.year?.trim() || '未分類';
      const bucket = grouped.get(year);
      if (bucket) {
        bucket.push(item);
        return;
      }

      grouped.set(year, [item]);
    });

    return Array.from(grouped.entries()).map(([year, entries]) => ({ year, entries }));
  }, [items]);

  return (
    <>
      <Hero title={pageData.title} subtitle={pageData.subtitle} imageUrl={pageData.imageUrl} />
      <main className="container max-w-[1100px] mx-auto my-12 px-5">
        <div className="bg-white rounded-3xl shadow-md border-t-4 border-primary p-8 md:p-10">
          <h2 className="text-2xl font-bold text-primary mb-6">感恩有您</h2>
          {loading ? (
            <div className="text-center text-gray-400 py-12">載入中...</div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              感謝名單整理中，後續將於此更新。
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((group, index) => (
                <section
                  key={group.year}
                  className={`overflow-hidden rounded-3xl border ${index % 2 === 0 ? 'border-sky-200 bg-sky-50/70' : 'border-amber-200 bg-amber-50/80'}`}
                >
                  <div className={`flex items-center justify-between gap-4 px-6 py-5 ${index % 2 === 0 ? 'bg-sky-100/80' : 'bg-amber-100/90'}`}>
                    <div>
                      <p className="text-sm font-medium tracking-[0.2em] text-slate-500">THANK YOU</p>
                      <h3 className="mt-1 text-3xl font-black text-slate-900">{group.year === '未分類' ? group.year : `${group.year}年`}</h3>
                    </div>
                    <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                      共 {group.entries.length} 項
                    </div>
                  </div>

                  <ul className="divide-y divide-white/80 px-6 py-2">
                    {group.entries.map((item) => (
                      <li key={item.id} className="grid gap-2 py-4 md:grid-cols-[minmax(220px,360px)_1fr] md:items-start md:gap-6">
                        <div className="text-lg font-semibold text-slate-900 [overflow-wrap:anywhere]">{item.name}</div>
                        <div className="text-sm leading-7 text-slate-600 [overflow-wrap:anywhere]">{item.description || '感謝支持與協助。'}</div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default ThankYou;
