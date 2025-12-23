import React from 'react';
import { SectionContent, NewsItem, MediaItem, AwardItem, TestimonialItem, GalleryItem } from '../types';
import { Phone, MapPin, Mail, ExternalLink, Play, FileText } from 'lucide-react';

/**
 * =================================================================
 *  【內容渲染服務】
 *  負責將 CMS 資料轉換為前台顯示的元件
 * =================================================================
 */

/**
 * 渲染最新消息列表
 */
export const renderNewsItems = (items: NewsItem[]) => {
  // 先排序：置頂的放前面，然後按日期排序（新的在前）
  const sortedItems = [...items].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <ul className="space-y-3">
      {sortedItems.map((item) => (
        <li 
          key={item.id} 
          className={`flex flex-col md:flex-row md:items-start text-gray-700 border-b border-gray-100 pb-3 last:border-0 ${
            item.isPinned ? 'bg-yellow-50 -mx-2 px-2 py-2 rounded-lg border-l-4 border-yellow-400' : ''
          }`}
        >
          <div className="flex items-center gap-2 md:w-36 flex-shrink-0">
            <span className="text-primary font-semibold">{item.date}</span>
            {item.isNew && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                NEW
              </span>
            )}
            {item.isPinned && (
              <span className="text-yellow-600 text-xs">📌</span>
            )}
          </div>
          <div className="flex-1">
            <span className="font-medium">{item.title}</span>
            {item.description && (
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            )}
            {item.link && (
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-1"
              >
                查看詳情 <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

/**
 * 渲染媒體報導列表
 */
export const renderMediaItems = (items: MediaItem[]) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'article': return <FileText className="w-4 h-4" />;
      default: return <ExternalLink className="w-4 h-4" />;
    }
  };

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col md:flex-row md:items-center text-gray-700 border-b border-gray-100 pb-3 last:border-0">
          <span className="text-primary font-semibold md:w-32 flex-shrink-0">{item.date}</span>
          <div className="flex items-center gap-2 flex-1">
            {item.source && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {item.source}
              </span>
            )}
            {item.link ? (
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
              >
                {getIcon(item.type)}
                {item.title}
              </a>
            ) : (
              <span>{item.title}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

/**
 * 渲染獲獎紀錄列表
 */
export const renderAwardItems = (items: AwardItem[]) => {
  return (
    <div className="space-y-3 text-left">
      {items.map((item, index) => {
        // 根據索引選擇不同顏色
        const colorClasses = [
          { bg: 'bg-yellow-50', border: 'border-yellow-500', title: 'text-yellow-800', desc: 'text-yellow-700' },
          { bg: 'bg-blue-50', border: 'border-blue-500', title: 'text-blue-800', desc: 'text-blue-700' },
          { bg: 'bg-green-50', border: 'border-green-500', title: 'text-green-800', desc: 'text-green-700' },
          { bg: 'bg-purple-50', border: 'border-purple-500', title: 'text-purple-800', desc: 'text-purple-700' },
        ];
        const color = colorClasses[index % colorClasses.length];
        
        return (
          <div 
            key={item.id} 
            className={`flex items-start gap-3 ${color.bg} p-4 rounded-lg border-l-4 ${color.border}`}
          >
            <span className="text-2xl">{item.icon || '🏆'}</span>
            <div>
              <p className={`font-bold ${color.title}`}>
                {item.year} {item.title}
              </p>
              {item.description && (
                <p className={`text-sm ${color.desc}`}>{item.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * 渲染學員心得列表
 */
export const renderTestimonialItems = (items: TestimonialItem[]) => {
  const borderColors = ['border-primary', 'border-secondary', 'border-green-500', 'border-purple-500'];
  
  return (
    <div className="space-y-4 text-left">
      {items.map((item, index) => (
        <blockquote 
          key={item.id} 
          className={`border-l-4 ${borderColors[index % borderColors.length]} bg-gray-50 p-4 italic`}
        >
          "{item.content}" <br />
          <span className="text-sm text-gray-600 not-italic">
            — {item.author}{item.role ? `，${item.role}` : ''}
          </span>
        </blockquote>
      ))}
    </div>
  );
};

/**
 * 渲染圖片庫
 */
export const renderGalleryItems = (items: GalleryItem[]) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.id} className="group relative">
          <img 
            src={item.imageUrl} 
            alt={item.title}
            className="rounded-lg shadow-md w-full h-48 object-cover hover:scale-105 transition cursor-pointer"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 rounded-b-lg opacity-0 group-hover:opacity-100 transition">
            <p className="text-white text-sm font-medium">{item.title}</p>
            {item.description && (
              <p className="text-white/80 text-xs">{item.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * 渲染舊格式的列表（向下相容）
 */
export const renderLegacyList = (items: string[]) => {
  return (
    <ul className="space-y-3">
      {items.map((item: string, index: number) => {
        const parts = item.split(' - ');
        return (
          <li key={index} className="flex flex-col md:flex-row md:items-center text-gray-700 border-b border-gray-100 pb-2 last:border-0">
            {parts.length > 1 ? (
              <>
                <strong className="text-primary font-semibold md:w-32 flex-shrink-0">{parts[0]}</strong>
                <span dangerouslySetInnerHTML={{ __html: parts.slice(1).join(' - ') }} />
              </>
            ) : (
              <span dangerouslySetInnerHTML={{ __html: item }} />
            )}
          </li>
        );
      })}
    </ul>
  );
};

/**
 * 渲染聯絡資訊
 */
export const renderContactInfo = (content: string) => {
  const contactData = JSON.parse(content || '{}');
  return (
    <div className="space-y-4 text-gray-700">
      {contactData.phone && (
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-secondary" />
          <span>{contactData.phone}</span>
        </div>
      )}
      {contactData.address && (
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-secondary" />
          <span>{contactData.address}</span>
        </div>
      )}
      {contactData.email && (
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-secondary" />
          <a href={`mailto:${contactData.email}`} className="hover:text-primary underline">
            {contactData.email}
          </a>
        </div>
      )}
    </div>
  );
};

/**
 * 渲染純文字/HTML 內容
 */
export const renderTextContent = (content: string) => {
  return (
    <div 
      className="text-gray-700 leading-relaxed text-justify"
      dangerouslySetInnerHTML={{ __html: content || '' }}
    />
  );
};

/**
 * 主要渲染函數 - 根據 section type 自動選擇對應的渲染方式
 */
export const renderSectionContent = (section: SectionContent): React.ReactNode => {
  switch (section.type) {
    case 'news':
      if (section.newsItems) {
        return renderNewsItems(section.newsItems);
      }
      return null;
      
    case 'media':
      if (section.mediaItems) {
        return renderMediaItems(section.mediaItems);
      }
      return null;
      
    case 'awards':
      if (section.awardItems) {
        return renderAwardItems(section.awardItems);
      }
      return null;
      
    case 'testimonials':
      if (section.testimonialItems) {
        return renderTestimonialItems(section.testimonialItems);
      }
      return null;
      
    case 'gallery':
      if (section.galleryItems) {
        return renderGalleryItems(section.galleryItems);
      }
      return null;
      
    case 'list':
      // 舊格式：保持向下相容
      if (section.listItems) {
        return renderLegacyList(section.listItems);
      }
      return null;
      
    case 'contact_info':
      if (section.content) {
        return renderContactInfo(section.content);
      }
      return null;
      
    case 'text':
    default:
      if (section.content) {
        return renderTextContent(section.content);
      }
      return null;
  }
};
