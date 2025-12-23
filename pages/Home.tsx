import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import CollapsibleCard from '../components/CollapsibleCard';
import { HOME_SECTIONS, PAGE_CONTENT } from '../services/cms';
import { renderSectionContent } from '../services/contentRenderer';
import { loadCmsData, CmsData } from '../services/cmsLoader';
import { SectionContent } from '../types';

const Home: React.FC = () => {
  const pageData = PAGE_CONTENT.home;
  const [dynamicSections, setDynamicSections] = useState<SectionContent[]>(HOME_SECTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDynamicData = async () => {
      try {
        const cmsData = await loadCmsData();
        if (cmsData) {
          // 用動態資料替換靜態資料
          const updatedSections = HOME_SECTIONS.map(section => {
            if (section.id === 'news' && cmsData.homeNews) {
              return {
                ...section,
                newsItems: cmsData.homeNews
              };
            }
            return section;
          });
          setDynamicSections(updatedSections);
        }
      } catch (error) {
        console.error('載入動態資料失敗:', error);
      }
      setLoading(false);
    };

    loadDynamicData();
  }, []);

  return (
    <>
      <Hero 
        title={pageData.title}
        subtitle={pageData.subtitle}
        imageUrl={pageData.imageUrl}
      />
      <main className="container max-w-[1000px] mx-auto my-8 px-5">
        {dynamicSections.map((section) => (
          <CollapsibleCard 
            key={section.id} 
            title={section.title} 
            isOpenDefault={section.isOpenDefault}
          >
            {renderSectionContent(section)}
          </CollapsibleCard>
        ))}
      </main>
    </>
  );
};

export default Home;