import React from 'react';
import Hero from '../components/Hero';
import CollapsibleCard from '../components/CollapsibleCard';
import { HOME_SECTIONS, PAGE_CONTENT } from '../services/cms';
import { Phone, MapPin, Mail } from 'lucide-react';

const Home: React.FC = () => {
  const pageData = PAGE_CONTENT.home;

  // Helper function to render content based on type
  const renderContent = (section: any) => {
    switch (section.type) {
      case 'list':
        return (
          <ul className="space-y-3">
            {section.listItems?.map((item: string, index: number) => {
               // Simple split for date highlighting
               const parts = item.split(' - ');
               return (
                 <li key={index} className="flex flex-col md:flex-row md:items-center text-gray-700 border-b border-gray-100 pb-2 last:border-0">
                    {parts.length > 1 ? (
                        <>
                            <strong className="text-primary font-semibold md:w-32 flex-shrink-0">{parts[0]}</strong>
                            <span>{parts.slice(1).join(' - ')}</span>
                        </>
                    ) : (
                        <span>{item}</span>
                    )}
                 </li>
               );
            })}
          </ul>
        );
      case 'contact_info':
        const contactData = JSON.parse(section.content || '{}');
        return (
          <div className="space-y-4 text-gray-700">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-secondary" />
              <span>{contactData.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-secondary" />
              <span>{contactData.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-secondary" />
              <a href={`mailto:${contactData.email}`} className="hover:text-primary underline">
                {contactData.email}
              </a>
            </div>
          </div>
        );
      case 'text':
      default:
        return <p className="text-gray-700 leading-relaxed text-justify">{section.content}</p>;
    }
  };

  return (
    <>
      <Hero 
        title={pageData.title}
        subtitle={pageData.subtitle}
        imageUrl={pageData.imageUrl}
      />
      <main className="container max-w-[1000px] mx-auto my-8 px-5">
        {HOME_SECTIONS.map((section) => (
          <CollapsibleCard 
            key={section.id} 
            title={section.title} 
            isOpenDefault={section.isOpenDefault}
          >
            {renderContent(section)}
          </CollapsibleCard>
        ))}
      </main>
    </>
  );
};

export default Home;