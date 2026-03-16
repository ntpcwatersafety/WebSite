import { AwardItem, CmsData, CourseItem, GalleryItem, MediaItem, NewsItem, TestimonialItem, ThankYouItem } from '../types';

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
  courseItems: CourseItem[];
}

export interface CmsMediaData {
  lastUpdated: string;
  mediaReports: MediaItem[];
  awards: AwardItem[];
}

export interface CmsResultsData {
  lastUpdated: string;
  testimonials: TestimonialItem[];
  trainingRecords: NewsItem[];
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
    courseItems: []
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
    testimonials: [],
    trainingRecords: []
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
  courseItems: [],
  homeNews: [],
  mediaReports: [],
  awards: [],
  testimonials: [],
  trainingRecords: [],
  galleryItems: [],
  introContent: '',
  thankYouItems: []
});

export const normalizeCmsSplitData = (raw: Partial<CmsSplitData> | null | undefined): CmsSplitData => {
  const empty = createEmptyCmsSplitData();

  return {
    activities: {
      lastUpdated: typeof raw?.activities?.lastUpdated === 'string' ? raw.activities.lastUpdated : empty.activities.lastUpdated,
      courseItems: Array.isArray(raw?.activities?.courseItems) ? raw.activities.courseItems : empty.activities.courseItems
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
      testimonials: Array.isArray(raw?.results?.testimonials) ? raw.results.testimonials : empty.results.testimonials,
      trainingRecords: Array.isArray(raw?.results?.trainingRecords) ? raw.results.trainingRecords : empty.results.trainingRecords
    },
    gallery: {
      lastUpdated: typeof raw?.gallery?.lastUpdated === 'string' ? raw.gallery.lastUpdated : empty.gallery.lastUpdated,
      galleryItems: Array.isArray(raw?.gallery?.galleryItems) ? raw.gallery.galleryItems : empty.gallery.galleryItems
    },
    thankyou: {
      lastUpdated: typeof raw?.thankyou?.lastUpdated === 'string' ? raw.thankyou.lastUpdated : empty.thankyou.lastUpdated,
      thankYouItems: Array.isArray(raw?.thankyou?.thankYouItems) ? raw.thankyou.thankYouItems : empty.thankyou.thankYouItems
    }
  };
};

export const normalizeCmsData = (raw: Partial<CmsData> | null | undefined): CmsData => {
  const empty = createEmptyCmsData();

  return {
    lastUpdated: typeof raw?.lastUpdated === 'string' ? raw.lastUpdated : empty.lastUpdated,
    courseItems: Array.isArray(raw?.courseItems) ? raw.courseItems : empty.courseItems,
    homeNews: Array.isArray(raw?.homeNews) ? raw.homeNews : empty.homeNews,
    mediaReports: Array.isArray(raw?.mediaReports) ? raw.mediaReports : empty.mediaReports,
    awards: Array.isArray(raw?.awards) ? raw.awards : empty.awards,
    testimonials: Array.isArray(raw?.testimonials) ? raw.testimonials : empty.testimonials,
    trainingRecords: Array.isArray(raw?.trainingRecords) ? raw.trainingRecords : empty.trainingRecords,
    galleryItems: Array.isArray(raw?.galleryItems) ? raw.galleryItems : empty.galleryItems,
    introContent: typeof raw?.introContent === 'string' ? raw.introContent : empty.introContent,
    thankYouItems: Array.isArray(raw?.thankYouItems) ? raw.thankYouItems : empty.thankYouItems
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
    courseItems: normalized.activities.courseItems,
    introContent: normalized.home.introContent,
    homeNews: normalized.home.homeNews,
    mediaReports: normalized.media.mediaReports,
    awards: normalized.media.awards,
    testimonials: normalized.results.testimonials,
    trainingRecords: normalized.results.trainingRecords,
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
      courseItems: normalized.courseItems
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
      testimonials: normalized.testimonials,
      trainingRecords: normalized.trainingRecords
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