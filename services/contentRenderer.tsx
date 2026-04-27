import React from 'react';
import { Link } from 'react-router-dom';
import { SectionContent, NewsItem, MediaItem, AwardItem, TestimonialItem, GalleryItem, CourseItem, ThankYouItem, TrainingRecordItem } from '../types';
import { Phone, MapPin, Mail, ExternalLink, Play, FileText } from 'lucide-react';
import { sortCourseItems, sortGalleryItems, sortThankYouItems, sortTrainingRecords } from './cmsData';

/**
 * =================================================================
 *  【內容渲染服務】
 *  負責將 CMS 資料轉換為前台顯示的元件
 * =================================================================
 */

/**
 * 渲染最新消息列表
 */
const renderEmptyState = (message: string) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
    {message}
  </div>
);

const COURSE_PAGE_SIZE = 5;
const RESULTS_ROW_SIZE = 3;
const RESULTS_INITIAL_ROWS = 2;
const RESULTS_INITIAL_COUNT = RESULTS_ROW_SIZE * RESULTS_INITIAL_ROWS;
const COURSE_FEATURE_TONES = [
  'border-cyan-200 bg-cyan-50 text-cyan-800',
  'border-blue-200 bg-blue-50 text-blue-800',
  'border-emerald-200 bg-emerald-50 text-emerald-800',
  'border-amber-200 bg-amber-50 text-amber-800'
];

const getYouTubeEmbedUrl = (value?: string): string | null => {
  if (!value) return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, '').toLowerCase();

    if (hostname === 'youtu.be') {
      const videoId = url.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null;
    }

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        const videoId = url.searchParams.get('v');
        return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null;
      }

      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'embed' && pathParts[1]) {
        return `https://www.youtube.com/embed/${pathParts[1]}?rel=0`;
      }

      if (pathParts[0] === 'shorts' && pathParts[1]) {
        return `https://www.youtube.com/embed/${pathParts[1]}?rel=0`;
      }
    }
  } catch {
    return null;
  }

  return null;
};

export const renderNewsItems = (items: NewsItem[]) => {
  if (items.length === 0) {
    return renderEmptyState('目前尚無資料，後續更新後會顯示於此。');
  }

  // 先排序：置頂的放前面，然後按日期排序（新的在前）
  const sortedItems = [...items].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <ul className="space-y-4">
      {sortedItems.map((item) => (
        <li 
          key={item.id} 
          className={`overflow-hidden flex flex-col gap-3 rounded-xl border border-transparent pb-4 text-gray-700 last:border-0 md:flex-row md:items-start ${
            item.isPinned ? 'border-yellow-200 bg-yellow-50 px-3 py-3 shadow-sm' : 'px-1'
          }`}
        >
          <div className="flex max-w-full flex-wrap items-center gap-2 md:w-36 md:flex-shrink-0 md:pt-0.5">
            <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-sm font-semibold tracking-wide text-primary shadow-sm md:text-base">{item.date}</span>
          </div>
          <div className="min-w-0 flex-1 md:pl-4">
            <div className="flex flex-wrap items-start gap-2 md:gap-3">
              <div className="min-w-0 flex-1 text-base font-semibold leading-snug break-words text-slate-800 [overflow-wrap:anywhere] md:text-lg">{item.title}</div>
              {item.isNew && (
                <span className="mt-0.5 inline-flex flex-shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white animate-pulse">
                  NEW
                </span>
              )}
              {item.isPinned && (
                <span className="mt-0.5 inline-flex flex-shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">置頂</span>
              )}
            </div>
            {item.description && (
              <div
                className="cms-richtext mt-2 text-sm leading-7 text-gray-600 [overflow-wrap:anywhere]"
                dangerouslySetInnerHTML={{ __html: item.description }}
              />
            )}
            {item.link && (
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 inline-flex max-w-full items-center gap-1 break-all text-sm text-blue-600 hover:text-blue-800"
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
  if (items.length === 0) {
    return renderEmptyState('目前尚無媒體報導資料。');
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'article': return <FileText className="w-4 h-4" />;
      default: return <ExternalLink className="w-4 h-4" />;
    }
  };

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const youtubeEmbedUrl = item.type === 'video' ? getYouTubeEmbedUrl(item.link) : null;

        return (
        <li key={item.id} className="border-b border-gray-100 pb-4 text-gray-700 last:border-0">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <span className="text-primary font-semibold md:w-32 md:flex-shrink-0">{item.date}</span>
            <div className="min-w-0 flex-1 flex-wrap items-center gap-2 md:flex">
            {item.source && (
              <span className="max-w-full rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 break-all">
                {item.source}
              </span>
            )}
            {item.link && !youtubeEmbedUrl ? (
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex min-w-0 max-w-full items-center gap-1 break-all text-blue-600 hover:text-blue-800 hover:underline"
              >
                {getIcon(item.type)}
                <span className="min-w-0 [overflow-wrap:anywhere]">{item.title}</span>
              </a>
            ) : (
              <span className="min-w-0 [overflow-wrap:anywhere]">{item.title}</span>
            )}
          </div>
          </div>
          {youtubeEmbedUrl ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                {getIcon(item.type)}
                <span className="font-semibold text-slate-800">{item.title}</span>
              </div>
              <div className="aspect-video overflow-hidden rounded-xl bg-slate-200 shadow-sm">
                <iframe
                  src={youtubeEmbedUrl}
                  title={item.title}
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          ) : null}
        </li>
      )})}
    </ul>
  );
};

/**
 * 渲染獲獎紀錄列表
 */
export const renderAwardItems = (items: AwardItem[]) => {
  if (items.length === 0) {
    return renderEmptyState('目前尚無獲獎紀錄。');
  }

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
                <div className={`cms-richtext text-sm ${color.desc}`} dangerouslySetInnerHTML={{ __html: item.description }} />
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
  if (items.length === 0) {
    return renderEmptyState('目前尚無學員心得。');
  }

  const borderColors = ['border-primary', 'border-secondary', 'border-green-500', 'border-purple-500'];
  
  return (
    <div className="space-y-4 text-left">
      {items.map((item, index) => (
        <blockquote 
          key={item.id} 
          className={`border-l-4 ${borderColors[index % borderColors.length]} bg-gray-50 p-4 italic`}
        >
          <span className="[overflow-wrap:anywhere]">"{item.content}"</span> <br />
          <span className="text-sm text-gray-600 not-italic">
            — {item.author}{item.role ? `，${item.role}` : ''}
          </span>
        </blockquote>
      ))}
    </div>
  );
};

const ResultsNewsCards: React.FC<{ items: TrainingRecordItem[] }> = ({ items }) => {
  const sortedItems = React.useMemo(() => sortTrainingRecords(items), [items]);
  const [visibleCount, setVisibleCount] = React.useState(RESULTS_INITIAL_COUNT);

  React.useEffect(() => {
    setVisibleCount(RESULTS_INITIAL_COUNT);
  }, [items]);

  const visibleItems = sortedItems.slice(0, visibleCount);
  const canLoadMore = visibleCount < sortedItems.length;

  if (sortedItems.length === 0) {
    return renderEmptyState('目前尚無訓練紀錄。');
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item) => (
          <Link key={item.id} to={`/results/${item.id}`} className="block h-full">
          <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
                {item.date}
              </span>
              {item.isNew ? <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">NEW</span> : null}
              {item.isPinned ? <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">置頂</span> : null}
            </div>
            <h3 className="mt-4 text-lg font-bold leading-snug text-slate-900 [overflow-wrap:anywhere]">{item.title}</h3>
            {item.description ? (
              <div
                className="cms-richtext mt-3 flex-1 text-sm leading-7 text-slate-600 [overflow-wrap:anywhere]"
                dangerouslySetInnerHTML={{ __html: item.description }}
              />
            ) : (
              <div className="mt-3 flex-1 text-sm leading-7 text-slate-400">尚無補充說明。</div>
            )}
            <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
              查看詳情 <ExternalLink className="h-3.5 w-3.5" />
            </div>
          </article>
          </Link>
        ))}
      </div>
      {canLoadMore ? (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => Math.min(current + RESULTS_ROW_SIZE, sortedItems.length))}
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            查看更多
          </button>
          <p className="mt-2 text-xs text-slate-500">目前顯示 {visibleItems.length} / {sortedItems.length} 筆</p>
        </div>
      ) : null}
    </div>
  );
};

const TestimonialCards: React.FC<{ items: TestimonialItem[] }> = ({ items }) => {
  const [visibleCount, setVisibleCount] = React.useState(RESULTS_INITIAL_COUNT);

  React.useEffect(() => {
    setVisibleCount(RESULTS_INITIAL_COUNT);
  }, [items]);

  const visibleItems = items.slice(0, visibleCount);
  const canLoadMore = visibleCount < items.length;

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item, index) => {
          const toneClasses = [
            'border-cyan-200 bg-cyan-50/70',
            'border-emerald-200 bg-emerald-50/70',
            'border-amber-200 bg-amber-50/70'
          ];
          const toneClass = toneClasses[index % toneClasses.length];

          return (
            <article key={item.id} className={`flex h-full flex-col rounded-2xl border p-5 shadow-sm ${toneClass}`}>
              <div className="text-3xl leading-none text-slate-300">“</div>
              <p className="mt-3 flex-1 text-sm leading-7 text-slate-700 [overflow-wrap:anywhere]">{item.content}</p>
              <div className="mt-5 border-t border-white/70 pt-4">
                <p className="font-semibold text-slate-900">{item.author}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.role ? item.role : '學員回饋'}{item.date ? ` ・ ${item.date}` : ''}
                </p>
              </div>
            </article>
          );
        })}
      </div>
      {canLoadMore ? (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => Math.min(current + RESULTS_ROW_SIZE, items.length))}
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            查看更多
          </button>
          <p className="mt-2 text-xs text-slate-500">目前顯示 {visibleItems.length} / {items.length} 筆</p>
        </div>
      ) : null}
    </div>
  );
};

const CoursesList: React.FC<{ items: CourseItem[] }> = ({ items }) => {
  const sortedItems = React.useMemo(() => sortCourseItems(items), [items]);
  const [visibleCount, setVisibleCount] = React.useState(COURSE_PAGE_SIZE);

  React.useEffect(() => {
    setVisibleCount(COURSE_PAGE_SIZE);
  }, [items]);

  const visibleItems = sortedItems.slice(0, visibleCount);
  const canLoadMore = visibleCount < sortedItems.length;

  if (sortedItems.length === 0) {
    return renderEmptyState('目前尚無課程與活動資料。');
  }

  return (
    <div className="space-y-4 text-left">
      {visibleItems.map((item) => (
        <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {item.date ? (
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold tracking-wide text-slate-500">
                    {item.date}
                  </span>
                ) : null}
                {typeof item.sortOrder === 'number' ? (
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold tracking-wide text-slate-500">
                    排序 {item.sortOrder}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-900">{item.title}</h3>
              {item.description && (
                <div className="cms-richtext mt-2 text-sm leading-relaxed text-slate-700" dangerouslySetInnerHTML={{ __html: item.description }} />
              )}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isRecruiting ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              {item.isRecruiting ? '招生中' : '暫停招生'}
            </span>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
            <div>上課時間：{item.schedule || '未提供'}</div>
            <div>地點：{item.location || '未提供'}</div>
            <div>費用：{item.price || '請洽協會'}</div>
          </div>
          {item.features?.length ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white/80 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-sm font-bold tracking-wide text-slate-800">課程特色</h4>
                <span className="text-xs text-slate-400">{item.features.length} 項</span>
              </div>
              <ul className="grid gap-2 text-sm md:grid-cols-2">
              {item.features.map((feature, index) => (
                <li
                  key={`${item.id}-${index}`}
                  className={`rounded-xl border px-3 py-2 font-medium ${COURSE_FEATURE_TONES[index % COURSE_FEATURE_TONES.length]}`}
                >
                  {feature}
                </li>
              ))}
              </ul>
            </div>
          ) : null}
        </article>
      ))}
      {canLoadMore ? (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => Math.min(current + COURSE_PAGE_SIZE, sortedItems.length))}
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            顯示更多
          </button>
          <p className="mt-2 text-xs text-slate-500">目前顯示 {visibleItems.length} / {sortedItems.length} 筆</p>
        </div>
      ) : null}
    </div>
  );
};

export const renderCourseItems = (items: CourseItem[]) => <CoursesList items={items} />;

export const renderThankYouItems = (items: ThankYouItem[]) => {
  if (items.length === 0) {
    return renderEmptyState('感謝名單整理中，後續將於此更新。');
  }

  const grouped = sortThankYouItems(items).reduce<Array<{ year: string; entries: ThankYouItem[] }>>((result, item) => {
    const year = item.year != null ? String(item.year) : '未分類';
    const existing = result.find((group) => group.year === year);

    if (existing) {
      existing.entries.push(item);
      return result;
    }

    result.push({ year, entries: [item] });
    return result;
  }, []);

  return (
    <div className="space-y-6">
      {grouped.map((group, index) => (
        <section
          key={group.year}
          className={`overflow-hidden rounded-3xl border ${index % 2 === 0 ? 'border-sky-200 bg-sky-50/70' : 'border-amber-200 bg-amber-50/80'}`}
        >
          <div className={`flex items-center justify-between gap-4 px-6 py-5 ${index % 2 === 0 ? 'bg-sky-100/80' : 'bg-amber-100/90'}`}>
            <h3 className="text-3xl font-black text-slate-900">{group.year === '未分類' ? group.year : `${group.year}年`}</h3>
            <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">共 {group.entries.length} 項</div>
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
  );
};

/**
 * 渲染圖片庫
 */
export const renderGalleryItems = (items: GalleryItem[]) => {
  const activeItems = sortGalleryItems(items).filter((item) => item.isActive !== false && item.photos?.length);

  if (activeItems.length === 0) {
    return renderEmptyState('目前尚無活動照片。');
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {activeItems.map((item) => {
        const coverPhoto = item.photos[0];

        return (
        <div key={item.id} className="group relative">
          <img 
            src={coverPhoto.imageUrl} 
            alt={item.title}
            className="rounded-lg shadow-md w-full h-48 object-cover hover:scale-105 transition cursor-pointer"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 rounded-b-lg opacity-0 group-hover:opacity-100 transition">
            {(item.category || item.date) && (
              <div className="mb-2 flex flex-wrap gap-2 text-[11px]">
                {item.category ? <span className="rounded-full bg-white/20 px-2 py-0.5 text-white">{item.category}</span> : null}
                {item.date ? <span className="rounded-full bg-white/20 px-2 py-0.5 text-white">{item.date}</span> : null}
              </div>
            )}
            <p className="text-white text-sm font-medium">{item.title}</p>
            {item.description && (
              <p className="text-white/80 text-xs">{item.description}</p>
            )}
            <p className="mt-1 text-white/80 text-[11px]">共 {item.photos.length} 張</p>
          </div>
        </div>
      )})}
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
          <li key={index} className="flex flex-col text-gray-700 border-b border-gray-100 pb-2 last:border-0 md:flex-row md:items-center">
            {parts.length > 1 ? (
              <>
                <strong className="text-primary font-semibold md:w-32 md:flex-shrink-0 [overflow-wrap:anywhere]">{parts[0]}</strong>
                <span className="cms-richtext min-w-0 [overflow-wrap:anywhere]" dangerouslySetInnerHTML={{ __html: parts.slice(1).join(' - ') }} />
              </>
            ) : (
              <span className="cms-richtext min-w-0 [overflow-wrap:anywhere]" dangerouslySetInnerHTML={{ __html: item }} />
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
      className="cms-richtext text-justify text-gray-700 leading-relaxed"
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
        if (section.id === 'recent_graduates') {
          return <ResultsNewsCards items={section.newsItems as TrainingRecordItem[]} />;
        }
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
        if (section.id === 'testimonials') {
          return <TestimonialCards items={section.testimonialItems} />;
        }
        return renderTestimonialItems(section.testimonialItems);
      }
      return null;

    case 'courses':
      if (section.courseItems) {
        return renderCourseItems(section.courseItems);
      }
      return null;

    case 'thankyou':
      if (section.thankYouItems) {
        return renderThankYouItems(section.thankYouItems);
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
      return renderEmptyState('目前尚無相關內容。');
  }
};
