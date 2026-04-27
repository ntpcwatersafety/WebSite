import { CourseItem, GalleryItem, ThankYouItem, TrainingRecordItem } from '../types';

const toComparableTimestamp = (value?: string): number => {
  if (!value) return Number.NEGATIVE_INFINITY;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
};

const toComparableSortOrder = (value?: number): number => (
  typeof value === 'number' && Number.isFinite(value) ? value : Number.POSITIVE_INFINITY
);

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
    const rightYear = Number(right.year);
    const leftYear = Number(left.year);
    const yearDiff = (Number.isFinite(rightYear) ? rightYear : Number.NEGATIVE_INFINITY)
      - (Number.isFinite(leftYear) ? leftYear : Number.NEGATIVE_INFINITY);
    if (yearDiff !== 0) return yearDiff;

    const sortOrderDiff = toComparableSortOrder(left.sortOrder) - toComparableSortOrder(right.sortOrder);
    if (sortOrderDiff !== 0) return sortOrderDiff;

    return String(left.name || '').localeCompare(String(right.name || ''), 'zh-Hant');
  });
};
