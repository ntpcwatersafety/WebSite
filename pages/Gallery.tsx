import React, { useEffect, useState } from 'react';
import Hero from '../components/Hero';
import GalleryCarousel from '../components/GalleryCarousel';
import CollapsibleCard from '../components/CollapsibleCard';
import { PAGE_CONTENT } from '../services/cms';
import { getActivityCategories, getGalleryItems } from '../services/cmsLoader';
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
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await loadItems();
      setItems(data);

      if (pageKey === 'activities') {
        const list = await getActivityCategories();
        setCategories(list);
      }

      setLoading(false);
    };

    void load();
  }, [loadItems]);

  const renderActivitiesByCategory = () => {
    const nonEmptyItems = items.filter((item) => item.isActive !== false && (item.photos?.length || 0) > 0);
    const withCategory = nonEmptyItems.filter((item) => item.category && item.category.trim());
    const uncategorized = nonEmptyItems.filter((item) => !item.category || !item.category.trim());

    const discovered = Array.from(new Set(withCategory.map((item) => item.category!.trim())));
    const categoryOrder = categories.length > 0
      ? [...categories, ...discovered.filter((cat) => !categories.includes(cat))]
      : discovered;

    const sections = categoryOrder
      .map((category) => ({
        title: category,
        data: withCategory.filter((item) => (item.category || '').trim() === category),
      }))
      .filter((section) => section.data.length > 0);

    if (uncategorized.length > 0) {
      sections.push({ title: '其他', data: uncategorized });
    }

    if (sections.length === 0) {
      return <div className="text-center text-gray-400 py-12">{emptyMessage || '目前尚無報名資訊內容。'}</div>;
    }

    return (
      <div className="space-y-4">
        {sections.map((section) => (
          <CollapsibleCard key={section.title} title={section.title} isOpenDefault>
            <GalleryCarousel items={section.data} emptyMessage="目前尚無內容。" itemLabel={itemLabel} enableRegistration />
          </CollapsibleCard>
        ))}
      </div>
    );
  };

  return (
    <>
      <Hero title={pageData.title} subtitle={pageData.subtitle} imageUrl={pageData.imageUrl} />
      <main className="container max-w-[900px] mx-auto my-12 px-5">
        {loading ? (
          <div className="text-center text-gray-400 py-12">載入中...</div>
        ) : pageKey === 'activities' ? (
          renderActivitiesByCategory()
        ) : (
          <GalleryCarousel items={items} emptyMessage={emptyMessage} itemLabel={itemLabel} />
        )}
      </main>
    </>
  );
};

export default GalleryPage;
