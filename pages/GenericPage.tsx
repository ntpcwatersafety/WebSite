import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import CollapsibleCard from '../components/CollapsibleCard';
import { Construction } from 'lucide-react';
import { PageConfig, SectionContent } from '../types';
import { renderSectionContent } from '../services/contentRenderer';
import { loadCmsData } from '../services/cmsLoader';

interface GenericPageProps {
  data: PageConfig;
  sections?: SectionContent[];
}

const GenericPage: React.FC<GenericPageProps> = ({ data, sections }) => {
  const [dynamicSections, setDynamicSections] = useState<SectionContent[]>(sections || []);

  useEffect(() => {
    const loadDynamicData = async () => {
      if (!sections) return;
      
      try {
        const cmsData = await loadCmsData();
        if (cmsData) {
          // 用動態資料替換靜態資料
          const updatedSections = sections.map(section => {
            // 訓練成果頁面 - 近期結訓學員
            if (section.id === 'recent_graduates' && cmsData.trainingRecords) {
              return {
                ...section,
                newsItems: cmsData.trainingRecords
              };
            }
            // 訓練成果頁面 - 學員心得
            if (section.id === 'testimonials' && cmsData.testimonials) {
              return {
                ...section,
                testimonialItems: cmsData.testimonials
              };
            }
            // 媒體報導頁面 - 新聞報導
            if (section.id === 'news_reports' && cmsData.mediaReports) {
              return {
                ...section,
                mediaItems: cmsData.mediaReports
              };
            }
            // 媒體報導頁面 - 獲獎紀錄
            if (section.id === 'awards' && cmsData.awards) {
              return {
                ...section,
                awardItems: cmsData.awards
              };
            }
            return section;
          });
          setDynamicSections(updatedSections);
        }
      } catch (error) {
        console.error('載入動態資料失敗:', error);
      }
    };

    loadDynamicData();
  }, [sections]);

  return (
    <>
      <Hero 
        title={data.title}
        subtitle={data.subtitle}
        imageUrl={data.imageUrl}
      />
      <main className="container max-w-[1000px] mx-auto my-12 px-5">
        {dynamicSections && dynamicSections.length > 0 ? (
          <div className="space-y-4">
            {dynamicSections.map((section) => (
              <CollapsibleCard
                key={section.id}
                title={section.title}
                isOpenDefault={section.isOpenDefault}
              >
                {renderSectionContent(section)}
              </CollapsibleCard>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border-t-4 border-gray-300 p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-700 mb-6">{data.title}</h2>
            <div className="flex flex-col items-center justify-center text-gray-400 gap-4">
              <Construction size={64} />
              <p className="text-xl">此頁面建置中...</p>
              <p className="text-sm">資料庫內容串接後，將在此顯示「{data.title}」的詳細資訊。</p>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default GenericPage;