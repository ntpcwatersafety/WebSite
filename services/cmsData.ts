import { AwardItem, CmsData, CourseItem, GalleryItem, MediaItem, NewsItem, TestimonialItem, ThankYouItem, TrainingRecordDetailBlock, TrainingRecordItem } from '../types';

const toComparableTimestamp = (value?: string): number => {
  if (!value) return Number.NEGATIVE_INFINITY;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
};

const toComparableSortOrder = (value?: number): number => (
  typeof value === 'number' && Number.isFinite(value) ? value : Number.POSITIVE_INFINITY
);

const normalizeTrainingRecordDetailBlocks = (value: unknown): TrainingRecordDetailBlock[] => {
  if (Array.isArray(value)) {
    return value
      .map((block, index) => {
        const rawBlock = block as Record<string, unknown>;
        const content = typeof rawBlock?.content === 'string' ? rawBlock.content : '';
        if (!content.trim()) return null;

        return {
          id: typeof rawBlock.id === 'string' ? rawBlock.id : `training-record-detail-${index + 1}`,
          content
        };
      })
      .filter(Boolean) as TrainingRecordDetailBlock[];
  }

  return [];
};

const normalizeTrainingRecords = (items: unknown): TrainingRecordItem[] => {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => {
    const rawItem = item as Record<string, unknown>;
    const description = typeof rawItem.description === 'string' ? rawItem.description : '';

    return {
      id: typeof rawItem.id === 'string' ? rawItem.id : `training-record-${index + 1}`,
      date: typeof rawItem.date === 'string' ? rawItem.date : '',
      title: typeof rawItem.title === 'string' ? rawItem.title : `未命名訓練紀錄 ${index + 1}`,
      description,
      link: typeof rawItem.link === 'string' ? rawItem.link : '',
      isNew: Boolean(rawItem.isNew),
      isPinned: Boolean(rawItem.isPinned),
      detailBlocks: normalizeTrainingRecordDetailBlocks(rawItem.detailBlocks)
    };
  });
};

const normalizeThankYouYear = (value: unknown): string => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(/年$/, '');
    if (/^\d{2,3}$/.test(normalized)) {
      return normalized;
    }
  }

  return '';
};

const normalizeThankYouItems = (items: unknown): ThankYouItem[] => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => {
      const rawItem = item as Record<string, unknown>;
      const name = typeof rawItem.name === 'string' ? rawItem.name.trim() : '';
      if (!name) return null;

      return {
        id: typeof rawItem.id === 'string' ? rawItem.id : `thank-you-${index + 1}`,
        name,
        year: normalizeThankYouYear(rawItem.year),
        sortOrder: typeof rawItem.sortOrder === 'number' && Number.isFinite(rawItem.sortOrder) ? rawItem.sortOrder : undefined,
        description: typeof rawItem.description === 'string' ? rawItem.description : ''
      };
    })
    .filter(Boolean) as ThankYouItem[];
};

const normalizeGalleryItems = (items: unknown): GalleryItem[] => {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => {
    const rawItem = item as Record<string, unknown>;
    const rawPhotos = Array.isArray(rawItem?.photos) ? rawItem.photos : null;

    if (rawPhotos) {
      const normalizedPhotos = rawPhotos
        .map((photo, photoIndex) => {
          const rawPhoto = photo as Record<string, unknown>;
          if (typeof rawPhoto?.imageUrl !== 'string' || !rawPhoto.imageUrl) {
            return null;
          }

          return {
            id: typeof rawPhoto.id === 'string' ? rawPhoto.id : `${typeof rawItem.id === 'string' ? rawItem.id : `gallery-activity-${index}`}-photo-${photoIndex + 1}`,
            imageUrl: rawPhoto.imageUrl,
            title: typeof rawPhoto.title === 'string' ? rawPhoto.title : '',
            description: typeof rawPhoto.description === 'string' ? rawPhoto.description : ''
          };
        })
        .filter(Boolean) as GalleryItem['photos'];

      return {
        id: typeof rawItem.id === 'string' ? rawItem.id : `gallery-activity-${index}`,
        title: typeof rawItem.title === 'string' && rawItem.title.trim() ? rawItem.title : `未命名活動 ${index + 1}`,
        description: typeof rawItem.description === 'string' ? rawItem.description : '',
        isActive: rawItem.isActive !== false,
        date: typeof rawItem.date === 'string' ? rawItem.date : '',
        category: typeof rawItem.category === 'string' ? rawItem.category : '',
        sortOrder: typeof rawItem.sortOrder === 'number' && Number.isFinite(rawItem.sortOrder) ? rawItem.sortOrder : undefined,
        coverPhotoId: typeof rawItem.coverPhotoId === 'string' && normalizedPhotos.some((photo) => photo.id === rawItem.coverPhotoId)
          ? rawItem.coverPhotoId
          : normalizedPhotos[0]?.id,
        photos: normalizedPhotos
      };
    }

    // 相容舊格式：一張圖就是一筆資料
    const legacyTitle = typeof rawItem.category === 'string' && rawItem.category.trim()
      ? rawItem.category
      : typeof rawItem.title === 'string' && rawItem.title.trim()
        ? rawItem.title
        : `未命名活動 ${index + 1}`;

    const legacyPhotos = typeof rawItem.imageUrl === 'string' && rawItem.imageUrl
      ? [{
          id: `${typeof rawItem.id === 'string' ? rawItem.id : `gallery-activity-${index}`}-photo-1`,
          imageUrl: rawItem.imageUrl,
          title: typeof rawItem.title === 'string' ? rawItem.title : '',
          description: typeof rawItem.description === 'string' ? rawItem.description : ''
        }]
      : [];

    return {
      id: typeof rawItem.id === 'string' ? rawItem.id : `gallery-activity-${index}`,
      title: legacyTitle,
      description: typeof rawItem.description === 'string' ? rawItem.description : '',
      isActive: rawItem.isActive !== false,
      date: typeof rawItem.date === 'string' ? rawItem.date : '',
      category: typeof rawItem.category === 'string' ? rawItem.category : '',
      sortOrder: typeof rawItem.sortOrder === 'number' && Number.isFinite(rawItem.sortOrder) ? rawItem.sortOrder : undefined,
      coverPhotoId: legacyPhotos[0]?.id,
      photos: legacyPhotos
    };
  });
};

export const CMS_SECTION_FILE_NAMES = {
  activities: 'activities.json',
  home: 'home.json',
  media: 'media.json',
  results: 'results.json',
  gallery: 'gallery.json',
  thankyou: 'thankyou.json'
} as const;

export type CmsSectionFileKey = keyof typeof CMS_SECTION_FILE_NAMES;
export type CmsFileShas = Partial<Record<CmsSectionFileKey, string>>;

export interface CmsHomeData {
  lastUpdated: string;
  introContent: string;
  homeNews: NewsItem[];
}

export interface CmsActivitiesData {
  lastUpdated: string;
  activityGalleryItems: GalleryItem[];
}

export interface CmsMediaData {
  lastUpdated: string;
  mediaReports: MediaItem[];
  awards: AwardItem[];
}

export interface CmsResultsData {
  lastUpdated: string;
  resultGalleryItems: GalleryItem[];
}

export interface CmsGalleryData {
  lastUpdated: string;
  galleryItems: GalleryItem[];
}

export interface CmsThankYouData {
  lastUpdated: string;
  thankYouItems: ThankYouItem[];
}

export interface CmsSplitData {
  activities: CmsActivitiesData;
  home: CmsHomeData;
  media: CmsMediaData;
  results: CmsResultsData;
  gallery: CmsGalleryData;
  thankyou: CmsThankYouData;
}

export const getPublicCmsFilePath = (fileKey: CmsSectionFileKey): string => `cms/${CMS_SECTION_FILE_NAMES[fileKey]}`;

export const getRepoCmsFilePath = (repoRoot: string, fileKey: CmsSectionFileKey): string => {
  const normalizedRoot = repoRoot.replace(/\\/g, '/').replace(/\/$/, '');
  return `${normalizedRoot}/${CMS_SECTION_FILE_NAMES[fileKey]}`;
};

export const createEmptyCmsSplitData = (): CmsSplitData => ({
  activities: {
    lastUpdated: '',
    activityGalleryItems: []
  },
  home: {
    lastUpdated: '',
    introContent: '',
    homeNews: []
  },
  media: {
    lastUpdated: '',
    mediaReports: [],
    awards: []
  },
  results: {
    lastUpdated: '',
    resultGalleryItems: []
  },
  gallery: {
    lastUpdated: '',
    galleryItems: []
  },
  thankyou: {
    lastUpdated: '',
    thankYouItems: []
  }
});

export const createEmptyCmsData = (): CmsData => ({
  lastUpdated: '',
  activityGalleryItems: [],
  homeNews: [],
  mediaReports: [],
  awards: [],
  resultGalleryItems: [],
  galleryItems: [],
  introContent: '',
  thankYouItems: []
});

export const normalizeCmsSplitData = (raw: Partial<CmsSplitData> | null | undefined): CmsSplitData => {
  const empty = createEmptyCmsSplitData();

  return {
    activities: {
      lastUpdated: typeof raw?.activities?.lastUpdated === 'string' ? raw.activities.lastUpdated : empty.activities.lastUpdated,
      activityGalleryItems: normalizeGalleryItems(raw?.activities?.activityGalleryItems)
    },
    home: {
      lastUpdated: typeof raw?.home?.lastUpdated === 'string' ? raw.home.lastUpdated : empty.home.lastUpdated,
      introContent: typeof raw?.home?.introContent === 'string' ? raw.home.introContent : empty.home.introContent,
      homeNews: Array.isArray(raw?.home?.homeNews) ? raw.home.homeNews : empty.home.homeNews
    },
    media: {
      lastUpdated: typeof raw?.media?.lastUpdated === 'string' ? raw.media.lastUpdated : empty.media.lastUpdated,
      mediaReports: Array.isArray(raw?.media?.mediaReports) ? raw.media.mediaReports : empty.media.mediaReports,
      awards: Array.isArray(raw?.media?.awards) ? raw.media.awards : empty.media.awards
    },
    results: {
      lastUpdated: typeof raw?.results?.lastUpdated === 'string' ? raw.results.lastUpdated : empty.results.lastUpdated,
      resultGalleryItems: normalizeGalleryItems(raw?.results?.resultGalleryItems)
    },
    gallery: {
      lastUpdated: typeof raw?.gallery?.lastUpdated === 'string' ? raw.gallery.lastUpdated : empty.gallery.lastUpdated,
      galleryItems: normalizeGalleryItems(raw?.gallery?.galleryItems)
    },
    thankyou: {
      lastUpdated: typeof raw?.thankyou?.lastUpdated === 'string' ? raw.thankyou.lastUpdated : empty.thankyou.lastUpdated,
      thankYouItems: normalizeThankYouItems(raw?.thankyou?.thankYouItems)
    }
  };
};

export const normalizeCmsData = (raw: Partial<CmsData> | null | undefined): CmsData => {
  const empty = createEmptyCmsData();

  return {
    lastUpdated: typeof raw?.lastUpdated === 'string' ? raw.lastUpdated : empty.lastUpdated,
    activityGalleryItems: normalizeGalleryItems(raw?.activityGalleryItems),
    homeNews: Array.isArray(raw?.homeNews) ? raw.homeNews : empty.homeNews,
    mediaReports: Array.isArray(raw?.mediaReports) ? raw.mediaReports : empty.mediaReports,
    awards: Array.isArray(raw?.awards) ? raw.awards : empty.awards,
    resultGalleryItems: normalizeGalleryItems(raw?.resultGalleryItems),
    galleryItems: normalizeGalleryItems(raw?.galleryItems),
    introContent: typeof raw?.introContent === 'string' ? raw.introContent : empty.introContent,
    thankYouItems: normalizeThankYouItems(raw?.thankYouItems)
  };
};

export const mergeCmsSplitData = (raw: Partial<CmsSplitData> | null | undefined): CmsData => {
  const normalized = normalizeCmsSplitData(raw);
  const timestamps = [
    normalized.activities.lastUpdated,
    normalized.home.lastUpdated,
    normalized.media.lastUpdated,
    normalized.results.lastUpdated,
    normalized.gallery.lastUpdated,
    normalized.thankyou.lastUpdated
  ].filter(Boolean);

  return normalizeCmsData({
    lastUpdated: timestamps.sort().at(-1) || '',
    activityGalleryItems: normalized.activities.activityGalleryItems,
    introContent: normalized.home.introContent,
    homeNews: normalized.home.homeNews,
    mediaReports: normalized.media.mediaReports,
    awards: normalized.media.awards,
    resultGalleryItems: normalized.results.resultGalleryItems,
    galleryItems: normalized.gallery.galleryItems,
    thankYouItems: normalized.thankyou.thankYouItems
  });
};

export const splitCmsData = (raw: Partial<CmsData> | null | undefined): CmsSplitData => {
  const normalized = normalizeCmsData(raw);
  const timestamp = normalized.lastUpdated || new Date().toISOString();

  return normalizeCmsSplitData({
    activities: {
      lastUpdated: timestamp,
      activityGalleryItems: normalized.activityGalleryItems
    },
    home: {
      lastUpdated: timestamp,
      introContent: normalized.introContent || '',
      homeNews: normalized.homeNews
    },
    media: {
      lastUpdated: timestamp,
      mediaReports: normalized.mediaReports,
      awards: normalized.awards
    },
    results: {
      lastUpdated: timestamp,
      resultGalleryItems: normalized.resultGalleryItems
    },
    gallery: {
      lastUpdated: timestamp,
      galleryItems: normalized.galleryItems
    },
    thankyou: {
      lastUpdated: timestamp,
      thankYouItems: normalized.thankYouItems || []
    }
  });
};

export const sortCourseItems = (items: CourseItem[] | null | undefined): CourseItem[] => {
  if (!Array.isArray(items)) return [];

  return [...items].sort((left, right) => {
    const sortOrderDiff = toComparableSortOrder(left.sortOrder) - toComparableSortOrder(right.sortOrder);
    if (sortOrderDiff !== 0) return sortOrderDiff;

    const dateDiff = toComparableTimestamp(right.date) - toComparableTimestamp(left.date);
    if (dateDiff !== 0) return dateDiff;

    if ((left.isRecruiting ?? true) !== (right.isRecruiting ?? true)) {
      return left.isRecruiting === false ? 1 : -1;
    }

    return String(left.title || '').localeCompare(String(right.title || ''), 'zh-Hant');
  });
};

export const sortGalleryItems = (items: GalleryItem[] | null | undefined): GalleryItem[] => {
  if (!Array.isArray(items)) return [];

  return [...items].sort((left, right) => {
    // 優先按日期降序排列（最新優先），無日期則使用 sortOrder
    const dateDiff = toComparableTimestamp(right.date) - toComparableTimestamp(left.date);
    if (dateDiff !== 0) return dateDiff;

    const sortOrderDiff = toComparableSortOrder(left.sortOrder) - toComparableSortOrder(right.sortOrder);
    if (sortOrderDiff !== 0) return sortOrderDiff;

    return String(left.title || '').localeCompare(String(right.title || ''), 'zh-Hant');
  });
};

export const sortTrainingRecords = (items: TrainingRecordItem[] | null | undefined): TrainingRecordItem[] => {
  if (!Array.isArray(items)) return [];

  return [...items].sort((left, right) => {
    if ((left.isPinned ?? false) !== (right.isPinned ?? false)) {
      return left.isPinned ? -1 : 1;
    }

    const dateDiff = toComparableTimestamp(right.date) - toComparableTimestamp(left.date);
    if (dateDiff !== 0) return dateDiff;

    return String(left.title || '').localeCompare(String(right.title || ''), 'zh-Hant');
  });
};

export const sortThankYouItems = (items: ThankYouItem[] | null | undefined): ThankYouItem[] => {
  if (!Array.isArray(items)) return [];

  return [...items].sort((left, right) => {
    const rightYear = Number.parseInt(right.year || '', 10);
    const leftYear = Number.parseInt(left.year || '', 10);
    const yearDiff = (Number.isFinite(rightYear) ? rightYear : Number.NEGATIVE_INFINITY) - (Number.isFinite(leftYear) ? leftYear : Number.NEGATIVE_INFINITY);
    if (yearDiff !== 0) return yearDiff;

    const sortOrderDiff = toComparableSortOrder(left.sortOrder) - toComparableSortOrder(right.sortOrder);
    if (sortOrderDiff !== 0) return sortOrderDiff;

    return String(left.name || '').localeCompare(String(right.name || ''), 'zh-Hant');
  });
};