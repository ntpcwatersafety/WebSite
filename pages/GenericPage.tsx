import React from 'react';
import Hero from '../components/Hero';
import CollapsibleCard from '../components/CollapsibleCard';
import { Construction } from 'lucide-react';
import { PageConfig, SectionContent } from '../types';

interface GenericPageProps {
  data: PageConfig;
  sections?: SectionContent[];
}

const GenericPage: React.FC<GenericPageProps> = ({ data, sections }) => {
  // Helper function to render content based on type
  const renderContent = (section: SectionContent) => {
    switch (section.type) {
      case 'list':
        return (
          <ul className="space-y-2 text-gray-700">
            {section.listItems?.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-1">▸</span>
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        );
      case 'text':
      default:
        return (
          <div 
            className="text-gray-700 leading-relaxed text-justify"
            dangerouslySetInnerHTML={{ __html: section.content || '' }}
          />
        );
    }
  };

  return (
    <>
      <Hero 
        title={data.title}
        subtitle={data.subtitle}
        imageUrl={data.imageUrl}
      />
      <main className="container max-w-[1000px] mx-auto my-12 px-5">
        {sections && sections.length > 0 ? (
          <div className="space-y-4">
            {sections.map((section) => (
              <CollapsibleCard
                key={section.id}
                title={section.title}
                isOpenDefault={section.isOpenDefault}
              >
                {renderContent(section)}
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