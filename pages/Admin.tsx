// 媒體報導編輯器
interface MediaItemEditorProps {
  item: MediaItem;
  onUpdate: (field: string, value: any) => void;
}

const isYouTubeLink = (value?: string) => {
  if (!value) return false;

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, '').toLowerCase();
    return ['youtube.com', 'm.youtube.com', 'youtu.be'].includes(hostname);
  } catch {
    return false;
  }
};

const MediaItemEditor: React.FC<MediaItemEditorProps> = ({ item, onUpdate }) => {
  const youtubeLink = isYouTubeLink(item.link);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">日期</label>
        <input
          type="date"
          value={item.date || ''}
          onChange={e => onUpdate('date', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">標題</label>
        <input
          type="text"
          value={item.title || ''}
          onChange={e => onUpdate('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">來源</label>
        <input
          type="text"
          value={item.source || ''}
          onChange={e => onUpdate('source', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">連結</label>
        <input
          type="url"
          value={item.link || ''}
          onChange={e => onUpdate('link', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="https://..."
        />
        <p className={`mt-1 text-xs ${youtubeLink ? 'text-blue-600' : 'text-gray-400'}`}>
          {youtubeLink ? '這是 YouTube 連結，前台會自動顯示嵌入影片預覽。' : '若填入 YouTube 連結，前台會自動改成嵌入影片預覽。'}
        </p>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">類型</label>
        <select
          value={item.type || ''}
          onChange={e => onUpdate('type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
            <option value="">請選擇</option>
            <option value="news">新聞</option>
            <option value="video">影片</option>
            <option value="article">文章</option>
        </select>
      </div>
    </div>
  );
};
import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { useNavigate } from 'react-router-dom';
import { 
  LogIn, LogOut, Save, Plus, Trash2, Edit3, 
  Settings, Home, Newspaper, Award, MessageSquare,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle,
  Key, RefreshCw, Download, Eye, GripVertical
} from 'lucide-react';
import { login, logout, isAuthenticated } from '../services/adminAuth';
import { cleanupEditorImages, EditorImageAsset, getFileContent, listEditorImages, updateCmsData, uploadEditorImage, validateToken } from '../services/githubApi';
import { loadCmsData } from '../services/cmsLoader';
import { CmsCollectionKey, CmsData, CourseItem, MediaItem, NewsItem, AwardItem, TestimonialItem, GalleryItem, GalleryPhoto, ThankYouItem, TrainingRecordItem, TrainingRecordDetailBlock } from '../types';
import { CmsFileShas, normalizeCmsData, sortCourseItems, sortGalleryItems, sortThankYouItems } from '../services/cmsData';
import AdminFeedbackToast from '../components/AdminFeedbackToast';
import AdminConfirmDialog from '../components/AdminConfirmDialog';

const CONFLICT_ERROR_MESSAGE = '資料已被其他人更新，請先重新載入最新內容後再儲存。';
const TINYMCE_API_KEY = 'r5if44rv4x9bo1fan9i5rj3wyy782zuqkqd4lkhkomddqngo';
const TINYMCE_LANGUAGE = 'zh-Hant';
const TINYMCE_LANGUAGE_URL = 'https://cdn.jsdelivr.net/npm/tinymce-i18n@26.2.16/langs6/zh-Hant.js';
const EDITOR_IMAGE_MAX_SIZE = 8 * 1024 * 1024;
const EDITOR_IMAGE_COMPRESSION_THRESHOLD = 2 * 1024 * 1024;
const EDITOR_IMAGE_MAX_DIMENSION = 2400;
const EDITOR_IMAGE_ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);
const EDITOR_IMAGE_PATH_PATTERN = /(https?:\/\/[^"'\s)<>]*?(?:\/public)?\/images\/editor\/[^"'\s)<>]+|(?:public\/|\/)images\/editor\/[^"'\s)<>]+)/g;

const formatFileSizeMb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(0)} MB`;

const normalizeEditorImageUrl = (value: string) => {
  if (value.startsWith('public/images/editor/')) {
    return value;
  }

  try {
    const pathname = new URL(value, 'https://ntpcwsa.local').pathname;
    const publicIndex = pathname.indexOf('/public/images/editor/');
    if (publicIndex >= 0) {
      return pathname.slice(publicIndex + 1);
    }

    return pathname.startsWith('/images/editor/') ? `public${pathname}` : null;
  } catch {
    if (value.startsWith('/images/editor/')) {
      return `public${value}`;
    }
    return null;
  }
};

const collectEditorImageUrls = (input: unknown, urls: Set<string>) => {
  if (typeof input === 'string') {
    for (const match of input.matchAll(EDITOR_IMAGE_PATH_PATTERN)) {
      const normalized = normalizeEditorImageUrl(match[1] || match[0]);
      if (normalized) {
        urls.add(normalized);
      }
    }
    return;
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      collectEditorImageUrls(item, urls);
    }
    return;
  }

  if (input && typeof input === 'object') {
    for (const value of Object.values(input)) {
      collectEditorImageUrls(value, urls);
    }
  }
};

const extractCmsEditorImageUrls = (data: CmsData | null) => {
  const urls = new Set<string>();
  if (data) {
    collectEditorImageUrls(data, urls);
  }
  return urls;
};

const validateEditorImageFile = (file: File) => {
  if (!EDITOR_IMAGE_ALLOWED_TYPES.has(file.type)) {
    throw new Error('僅支援 JPG、PNG、WEBP、GIF 圖片格式。');
  }

  if (file.size > EDITOR_IMAGE_MAX_SIZE) {
    throw new Error(`圖片過大，請控制在 ${formatFileSizeMb(EDITOR_IMAGE_MAX_SIZE)} 以內。`);
  }
};

const loadImageElement = (file: File): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    resolve(image);
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error('無法讀取圖片內容，請換一張圖片再試一次。'));
  };

  image.src = objectUrl;
});

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (!blob) {
      reject(new Error('圖片壓縮失敗，請改用較小的圖片。'));
      return;
    }
    resolve(blob);
  }, type, quality);
});

const renameFileExtension = (name: string, nextExtension: string) => {
  const sanitizedExtension = nextExtension.replace(/^\./, '');
  if (!name) return `image.${sanitizedExtension}`;
  return name.replace(/\.[a-zA-Z0-9]+$/, '') + `.${sanitizedExtension}`;
};

const compressEditorImage = async (file: File): Promise<File> => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return file;
  }

  if (file.size <= EDITOR_IMAGE_COMPRESSION_THRESHOLD) {
    return file;
  }

  const image = await loadImageElement(file);
  const scale = Math.min(1, EDITOR_IMAGE_MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    return file;
  }

  context.drawImage(image, 0, 0, width, height);

  const outputType = file.type === 'image/png' ? 'image/webp' : file.type;
  const extension = outputType === 'image/webp' ? 'webp' : outputType === 'image/png' ? 'png' : 'jpg';
  const qualityCandidates = outputType === 'image/png'
    ? [undefined]
    : [0.88, 0.8, 0.72, 0.64];

  for (const quality of qualityCandidates) {
    const blob = await canvasToBlob(canvas, outputType, quality);
    if (blob.size < file.size || blob.size <= EDITOR_IMAGE_MAX_SIZE) {
      return new File([blob], renameFileExtension(file.name, extension), {
        type: outputType,
        lastModified: Date.now()
      });
    }
  }

  const fallbackBlob = await canvasToBlob(canvas, outputType, qualityCandidates.at(-1));
  return new File([fallbackBlob], renameFileExtension(file.name, extension), {
    type: outputType,
    lastModified: Date.now()
  });
};

const uploadValidatedEditorImage = async (file: File) => {
  validateEditorImageFile(file);
  const nextFile = await compressEditorImage(file);
  validateEditorImageFile(nextFile);
  return uploadEditorImage(nextFile);
};

const openImagePicker = (callback: (file: File) => void) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp,image/gif';

  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    callback(file);
  };

  input.click();
};

const resizeEditorToContent = (editor: any, minHeight: number) => {
  if (!editor) return;

  const container = editor.getContainer?.();
  const contentArea = editor.getContentAreaContainer?.();
  const body = editor.getBody?.();
  const doc = editor.getDoc?.();

  if (!container || !contentArea || !body || !doc) return;

  const chromeHeight = Math.max(container.offsetHeight - contentArea.offsetHeight, 0);
  const bodyHeight = Math.max(
    body.scrollHeight || 0,
    body.offsetHeight || 0,
    doc.documentElement?.scrollHeight || 0
  );
  const nextHeight = Math.min(2400, Math.max(minHeight, bodyHeight + chromeHeight + 16));

  if (typeof editor.theme?.resizeTo === 'function') {
    editor.theme.resizeTo(null, nextHeight);
    return;
  }

  contentArea.style.height = `${Math.max(minHeight, bodyHeight + 16)}px`;
  container.style.height = `${nextHeight}px`;
};

const scheduleEditorAutoResize = (editor: any, minHeight: number) => {
  if (!editor || typeof window === 'undefined') return;

  window.requestAnimationFrame(() => {
    try {
      resizeEditorToContent(editor, minHeight);
    } catch (error) {
      console.warn('編輯器自動調整高度失敗', error);
    }
  });
};

const buildRichTextEditorInit = (height: number) => {
  const minEditorHeight = Math.max(height, 160);
  const plugins = [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'template',
    'searchreplace', 'visualblocks', 'visualchars', 'code', 'fullscreen', 'autoresize',
    'insertdatetime', 'media', 'table', 'paste', 'help', 'wordcount', 'quickbars',
    'directionality', 'emoticons', 'hr', 'nonbreaking'
  ].join(' ');

  return {
    language: TINYMCE_LANGUAGE,
    language_url: TINYMCE_LANGUAGE_URL,
    menubar: true,
    branding: false,
    promotion: false,
    resize: false,
    plugins,
    toolbar: [
      'undo redo | image media | blocks | fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | removeformat',
      'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table blockquote hr | styles template | searchreplace code preview fullscreen | help'
    ],
    toolbar_mode: 'wrap',
    toolbar_sticky: true,
    statusbar: true,
    elementpath: true,
    min_height: minEditorHeight,
    max_height: 2400,
    autoresize_bottom_margin: 0,
    autoresize_overflow_padding: 0,
    paste_data_images: true,
    block_unsupported_drop: true,
    images_file_types: 'jpeg,jpg,png,webp,gif',
    quickbars_selection_toolbar: 'bold italic underline | forecolor backcolor | link blockquote',
    quickbars_insert_toolbar: 'quickimage quicktable hr',
    block_formats: '段落=p; 標題 1=h1; 標題 2=h2; 標題 3=h3; 標題 4=h4; 引言=blockquote',
    font_family_formats: 'Helvetica=helvetica,arial,sans-serif; 微軟正黑體=Microsoft JhengHei,sans-serif; 新細明體=PMingLiU,serif; Arial=arial,helvetica,sans-serif; Georgia=georgia,serif; Times New Roman=times new roman,times,serif; Verdana=verdana,geneva,sans-serif',
    font_size_formats: '12px 14px 16px 18px 20px 24px 28px 36px 48px',
    content_style: 'body { font-family: Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.7; overflow-y: hidden; } img { max-width: 100%; height: auto; } .notice-box { border-left: 4px solid #0f766e; background: #f0fdfa; padding: 12px 14px; border-radius: 8px; } .warning-box { border-left: 4px solid #dc2626; background: #fef2f2; padding: 12px 14px; border-radius: 8px; } .highlight-text { color: #b91c1c; font-weight: 700; }',
    image_title: true,
    image_caption: true,
    automatic_uploads: true,
    file_picker_types: 'image',
    style_formats: [
      { title: '公告框', block: 'div', classes: 'notice-box', wrapper: true },
      { title: '警示框', block: 'div', classes: 'warning-box', wrapper: true },
      { title: '紅字重點', inline: 'span', classes: 'highlight-text' },
      { title: '細字說明', inline: 'small' }
    ],
    setup: (editor: any) => {
      const handleResize = () => scheduleEditorAutoResize(editor, minEditorHeight);
      editor.on('init SetContent change input undo redo keyup ObjectResized', handleResize);
    },
    init_instance_callback: (editor: any) => {
      scheduleEditorAutoResize(editor, minEditorHeight);
    },
    templates: [
      {
        title: '公告區塊',
        description: '插入一般公告框樣板',
        content: '<div class="notice-box"><p><strong>公告標題</strong></p><p>請在這裡輸入公告內容。</p></div>'
      },
      {
        title: '重要提醒',
        description: '插入警示提醒樣板',
        content: '<div class="warning-box"><p><strong>重要提醒</strong></p><p>請在這裡輸入提醒內容。</p></div>'
      },
      {
        title: '圖文段落',
        description: '插入標題加說明的段落樣板',
        content: '<h3>段落標題</h3><p>請在這裡輸入內文，可搭配上方圖片按鈕插入照片。</p>'
      }
    ],
    images_upload_handler: async (blobInfo: { blob: () => Blob; filename: () => string }) => {
      const file = new File([blobInfo.blob()], blobInfo.filename(), {
        type: blobInfo.blob().type || 'image/png'
      });
      return uploadValidatedEditorImage(file);
    },
    file_picker_callback: (callback: (url: string, meta?: { alt?: string; title?: string }) => void, _value: string, meta: { filetype?: string }) => {
      if (meta.filetype === 'image') {
        openImagePicker(async (file) => {
          const url = await uploadValidatedEditorImage(file);
          callback(url, { alt: file.name, title: file.name });
        });
      }
    }
  };
};

const RichTextEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  height?: number;
  onImageUploaded?: (url: string) => void;
}> = ({ value, onChange, height = 240, onImageUploaded }) => {
  const editorRef = useRef<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageHint, setImageHint] = useState<string | null>(null);
  const minEditorHeight = Math.max(height, 160);

  useEffect(() => {
    scheduleEditorAutoResize(editorRef.current, minEditorHeight);
  }, [value, minEditorHeight]);

  const handleInsertImage = () => {
    if (uploadingImage) return;

    openImagePicker(async (file) => {
      try {
        setUploadingImage(true);
        setImageHint('圖片上傳中...');
        const url = await uploadValidatedEditorImage(file);
        onImageUploaded?.(url);
        editorRef.current?.insertContent(`<img src="${url}" alt="${file.name}" />`);
        setImageHint('圖片已插入內文。');
      } catch (error) {
        setImageHint(error instanceof Error ? error.message : '圖片上傳失敗，請稍後再試。');
      } finally {
        setUploadingImage(false);
      }
    });
  };

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleInsertImage}
          disabled={uploadingImage}
          className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploadingImage ? '圖片上傳中...' : '插入圖片'}
        </button>
        <span className="text-xs text-gray-500">可按這個按鈕，也可直接拖曳或貼上圖片。</span>
      </div>
      <Editor
        apiKey={TINYMCE_API_KEY}
        value={value}
        init={{
          ...buildRichTextEditorInit(height),
          images_upload_handler: async (blobInfo: { blob: () => Blob; filename: () => string }) => {
            const file = new File([blobInfo.blob()], blobInfo.filename(), {
              type: blobInfo.blob().type || 'image/png'
            });
            const url = await uploadValidatedEditorImage(file);
            onImageUploaded?.(url);
            return url;
          },
          file_picker_callback: (callback: (url: string, meta?: { alt?: string; title?: string }) => void, _value: string, meta: { filetype?: string }) => {
            if (meta.filetype === 'image') {
              openImagePicker(async (file) => {
                const url = await uploadValidatedEditorImage(file);
                onImageUploaded?.(url);
                callback(url, { alt: file.name, title: file.name });
              });
            }
          }
        }}
        onInit={(_evt, editor) => {
          editorRef.current = editor;
          scheduleEditorAutoResize(editor, minEditorHeight);
        }}
        onEditorChange={(nextValue) => {
          onChange(nextValue);
          scheduleEditorAutoResize(editorRef.current, minEditorHeight);
        }}
      />
      <p className="mt-2 text-xs text-gray-500">
        可直接插入、拖曳或貼上單張圖片，系統會自動上傳到網站圖庫並插入網址；目前支援 JPG、PNG、WEBP、GIF，單張上限 8 MB，較大的 JPG、PNG、WEBP 會先自動壓縮後再上傳。
      </p>
      {imageHint && (
        <p className="mt-1 text-xs text-blue-700">{imageHint}</p>
      )}
    </>
  );
};
// 感恩有您編輯器
const ThankYouItemEditor: React.FC<{ item: ThankYouItem; onUpdate: (field: string, value: any) => void }> = ({ item, onUpdate }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div>
      <label className="block text-xs text-gray-500 mb-1">年度（民國年）</label>
      <input
        type="text"
        inputMode="numeric"
        value={item.year || ''}
        onChange={e => onUpdate('year', e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
        placeholder="例如 114"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-500 mb-1">姓名/單位</label>
      <input
        type="text"
        value={item.name}
        onChange={e => onUpdate('name', e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-500 mb-1">感謝內容（選填）</label>
      <input
        type="text"
        value={item.description || ''}
        onChange={e => onUpdate('description', e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>
  </div>
);

const normalizeFeatureLines = (value: string) => (
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
);

const createTrainingRecordDetailBlock = (): TrainingRecordDetailBlock => ({
  id: `training-record-detail-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  content: '<p>請輸入詳細內容。</p>'
});

const getCurrentRocYear = (): string => String(new Date().getFullYear() - 1911);

const normalizeThankYouAdminItems = (items: ThankYouItem[] | null | undefined): ThankYouItem[] => {
  const sortedItems = sortThankYouItems(items || []).map((item) => ({
    ...item,
    year: item.year?.trim().replace(/年$/, '') || ''
  }));

  const counters = new Map<string, number>();
  return sortedItems.map((item) => {
    const yearKey = item.year || '';
    const nextOrder = (counters.get(yearKey) || 0) + 1;
    counters.set(yearKey, nextOrder);

    return {
      ...item,
      sortOrder: nextOrder * 10
    };
  });
};

const CourseItemEditor: React.FC<{
  item: CourseItem;
  onUpdate: (field: string, value: any) => void;
  onImageUploaded?: (url: string) => void;
}> = ({ item, onUpdate, onImageUploaded }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="md:col-span-2">
      <label className="block text-xs text-gray-500 mb-1">課程名稱</label>
      <input
        type="text"
        value={item.title}
        onChange={e => onUpdate('title', e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-500 mb-1">排序日期</label>
      <input
        type="date"
        value={item.date || ''}
        onChange={e => onUpdate('date', e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      <p className="mt-1 text-xs text-gray-400">若未設定自訂排序，前台會優先顯示較新的日期。</p>
    </div>
    <div>
      <label className="block text-xs text-gray-500 mb-1">自訂排序</label>
      <input
        type="number"
        value={typeof item.sortOrder === 'number' ? item.sortOrder : ''}
        onChange={e => onUpdate('sortOrder', e.target.value === '' ? undefined : Number(e.target.value))}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        placeholder="數字越小越前面"
      />
      <p className="mt-1 text-xs text-gray-400">建議用 10、20、30 留間距，之後插隊比較方便。</p>
    </div>
    <div>
      <label className="block text-xs text-gray-500 mb-1">上課時間</label>
      <input
        type="text"
        value={item.schedule || ''}
        onChange={e => onUpdate('schedule', e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        placeholder="例：每週六 09:00-12:00"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-500 mb-1">地點</label>
      <input
        type="text"
        value={item.location || ''}
        onChange={e => onUpdate('location', e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-500 mb-1">費用</label>
      <input
        type="text"
        value={item.price || ''}
        onChange={e => onUpdate('price', e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        placeholder="例：每人 2,500 元"
      />
    </div>
    <div className="flex items-center gap-2 pt-6">
      <input
        id={`recruiting-${item.id}`}
        type="checkbox"
        checked={item.isRecruiting !== false}
        onChange={e => onUpdate('isRecruiting', e.target.checked)}
      />
      <label htmlFor={`recruiting-${item.id}`} className="text-sm text-gray-700">目前開放報名</label>
    </div>
    <div className="md:col-span-2">
      <label className="block text-xs text-gray-500 mb-1">課程說明</label>
      <RichTextEditor
        value={item.description}
        onChange={(content) => onUpdate('description', content)}
        onImageUploaded={onImageUploaded}
      />
    </div>
    <div className="md:col-span-2">
      <label className="block text-xs text-gray-500 mb-1">課程特色</label>
      <textarea
        value={(item.features || []).join('\n')}
        onChange={e => onUpdate('features', normalizeFeatureLines(e.target.value))}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        rows={4}
        placeholder="一行一點，例如：\n小班制\n含基礎救生訓練"
      />
      <p className="mt-1 text-xs text-gray-400">一行代表前台一個特色標籤。</p>
    </div>
  </div>
);
// 協會簡介編輯器
const IntroEditor: React.FC<{ value: string; onChange: (v: string) => void; onImageUploaded?: (url: string) => void }> = ({ value, onChange, onImageUploaded }) => (
  <div className="mb-8">
    <label className="block text-lg font-bold text-primary mb-2">首頁協會簡介</label>
    <RichTextEditor
      value={value}
      height={260}
      onChange={onChange}
      onImageUploaded={onImageUploaded}
    />
  </div>
);

interface ConfirmDialogState {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
}

interface GalleryActivitiesEditorProps {
  sectionId?: string;
  items: GalleryItem[];
  expanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onDeleteActivity: (activityId: string) => void;
  onUpdateActivity: (activityId: string, field: keyof GalleryItem, value: any) => void;
  onSetCoverPhoto: (activityId: string, photoId: string) => void;
  onUploadPhotos: (activityId: string, files: FileList) => void;
  onDeletePhoto: (activityId: string, photoId: string) => void;
  onMoveActivity: (draggedId: string, targetId: string) => void;
  onMovePhoto: (activityId: string, draggedId: string, targetId: string) => void;
  uploadingActivityId: string | null;
}

const GalleryActivitiesEditor: React.FC<GalleryActivitiesEditorProps> = ({
  sectionId,
  items,
  expanded,
  onToggle,
  onAdd,
  onDeleteActivity,
  onUpdateActivity,
  onSetCoverPhoto,
  onUploadPhotos,
  onDeletePhoto,
  onMoveActivity,
  onMovePhoto,
  uploadingActivityId
}) => {
  const sortedActivities = sortGalleryItems(items);
  const [draggingActivityId, setDraggingActivityId] = useState<string | null>(null);
  const [draggingPhoto, setDraggingPhoto] = useState<{ activityId: string; photoId: string } | null>(null);
  const getCoverPhoto = (activity: GalleryItem) => (
    activity.photos.find((photo) => photo.id === activity.coverPhotoId) || activity.photos[0]
  );

  return (
    <div id={sectionId} className="bg-white rounded-xl shadow-sm overflow-hidden scroll-mt-24">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3 text-left">
          <span className="text-blue-600 self-start mt-0.5"><Eye className="w-5 h-5" /></span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-800">活動剪影 / 活動相簿</span>
              <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-100">
                前台：活動剪影 / 活動輪播
              </span>
              <span className="bg-gray-100 text-gray-600 text-sm px-2 py-0.5 rounded-full">
                {sortedActivities.length} 個活動
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">每個活動可上傳多張照片、拖拉調整活動順序與照片順序，前台會以活動為單位輪播顯示。</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {expanded ? (
        <div className="px-6 pb-6">
          <button
            onClick={onAdd}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-2 mb-4"
          >
            <Plus className="w-5 h-5" />
            新增活動
          </button>

          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 mb-4 text-sm text-blue-800">
            直接拖拉整個活動卡片可調整前台活動順序；活動內的照片縮圖也可拖拉改變播放順序。每次可一次上傳多張圖片。
          </div>

          <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-4 mb-4 text-sm text-cyan-800">
            多張照片的封面設定方式：先把照片上傳進活動，再點每張縮圖下方的「設為封面」；被選中的照片會顯示「封面」標記，前台活動卡片會優先使用這張圖。
          </div>

          <div className="space-y-4">
            {sortedActivities.map((activity, index) => (
              (() => {
                const coverPhoto = getCoverPhoto(activity);

                return (
              <div
                key={activity.id}
                draggable
                onDragStart={() => setDraggingActivityId(activity.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggingActivityId && draggingActivityId !== activity.id) {
                    onMoveActivity(draggingActivityId, activity.id);
                  }
                  setDraggingActivityId(null);
                }}
                onDragEnd={() => setDraggingActivityId(null)}
                className={`rounded-2xl border bg-slate-50 p-4 ${draggingActivityId === activity.id ? 'border-blue-300 shadow-md' : 'border-slate-200'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500">
                      可拖拉排序
                    </span>
                    <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500">
                      {activity.photos.length} 張照片
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteActivity(activity.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    刪除活動
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">活動名稱</label>
                    <input
                      type="text"
                      value={activity.title || ''}
                      onChange={(event) => onUpdateActivity(activity.id, 'title', event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">活動日期</label>
                    <input
                      type="date"
                      value={activity.date || ''}
                      onChange={(event) => onUpdateActivity(activity.id, 'date', event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">活動分類（選填）</label>
                    <input
                      type="text"
                      value={activity.category || ''}
                      onChange={(event) => onUpdateActivity(activity.id, 'category', event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      id={`gallery-active-${activity.id}`}
                      type="checkbox"
                      checked={activity.isActive !== false}
                      onChange={(event) => onUpdateActivity(activity.id, 'isActive', event.target.checked)}
                    />
                    <label htmlFor={`gallery-active-${activity.id}`} className="text-sm text-gray-700">前台顯示這個活動</label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">活動描述（選填）</label>
                    <textarea
                      value={activity.description || ''}
                      onChange={(event) => onUpdateActivity(activity.id, 'description', event.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-cyan-900">目前封面預覽</p>
                        <p className="mt-1 text-xs text-cyan-800">按下「設為封面」後，這裡會立即更新，前台活動卡片也會使用同一張圖。</p>
                      </div>
                      {coverPhoto ? (
                        <span className="rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-xs font-medium text-cyan-700">
                          {coverPhoto.title || '未命名封面'}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 overflow-hidden rounded-2xl border border-cyan-100 bg-white">
                      {coverPhoto ? (
                        <img src={coverPhoto.imageUrl} alt={coverPhoto.title || activity.title} className="h-52 w-full object-cover md:h-64" />
                      ) : (
                        <div className="flex h-40 items-center justify-center text-sm text-slate-500">尚未上傳照片，封面預覽會顯示在這裡。</div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-800">活動照片</h4>
                      <p className="mt-1 text-xs text-slate-500">可多選檔案一次上傳；縮圖可直接拖拉改順序，也可指定其中一張作為活動封面。</p>
                    </div>
                    <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${uploadingActivityId === activity.id ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={uploadingActivityId === activity.id}
                        onChange={(event) => {
                          if (event.target.files?.length) {
                            onUploadPhotos(activity.id, event.target.files);
                            event.target.value = '';
                          }
                        }}
                      />
                      {uploadingActivityId === activity.id ? '上傳中...' : '新增多張照片'}
                    </label>
                  </div>

                  {activity.photos.length ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
                      {activity.photos.map((photo, photoIndex) => (
                        <div
                          key={photo.id}
                          draggable
                          onDragStart={() => setDraggingPhoto({ activityId: activity.id, photoId: photo.id })}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => {
                            if (draggingPhoto && draggingPhoto.activityId === activity.id && draggingPhoto.photoId !== photo.id) {
                              onMovePhoto(activity.id, draggingPhoto.photoId, photo.id);
                            }
                            setDraggingPhoto(null);
                          }}
                          onDragEnd={() => setDraggingPhoto(null)}
                          className={`overflow-hidden rounded-xl border bg-slate-50 ${draggingPhoto?.photoId === photo.id ? 'border-blue-300 shadow-md' : 'border-slate-200'}`}
                        >
                          <div className="relative aspect-square bg-slate-100">
                            <img src={photo.imageUrl} alt={photo.title || activity.title} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => onDeletePhoto(activity.id, photo.id)}
                              className="absolute right-2 top-2 rounded-full bg-black/55 p-1.5 text-white hover:bg-black/70"
                              title="刪除這張照片"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-slate-700">
                              {photoIndex + 1}
                            </span>
                            {activity.coverPhotoId === photo.id ? (
                              <span className="absolute bottom-2 left-2 rounded-full bg-cyan-600 px-2 py-0.5 text-xs font-semibold text-white">
                                封面
                              </span>
                            ) : null}
                          </div>
                          <div className="border-t border-slate-200 bg-white p-2">
                            <button
                              type="button"
                              onClick={() => onSetCoverPhoto(activity.id, photo.id)}
                              className={`w-full rounded-lg border px-2 py-1.5 text-xs font-medium ${activity.coverPhotoId === photo.id ? 'border-cyan-200 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                            >
                              {activity.coverPhotoId === photo.id ? '目前封面' : '設為封面'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">尚未上傳照片。</p>
                  )}
                </div>
              </div>
                );
              })()
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};


const Admin: React.FC = () => {
  const navigate = useNavigate();
  const pendingEditorImageUrlsRef = useRef<Set<string>>(new Set());
  const toastTimeoutsRef = useRef<Map<number, number>>(new Map());
  
  // 登入狀態
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // GitHub / server token status
  const [showTokenSetup, setShowTokenSetup] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  
  // 資料狀態
  const [cmsData, setCmsData] = useState<CmsData | null>(null);
  const [cmsShas, setCmsShas] = useState<CmsFileShas | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: number; type: 'success' | 'error'; text: string }>>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [editorImages, setEditorImages] = useState<EditorImageAsset[]>([]);
  const [loadingEditorImages, setLoadingEditorImages] = useState(false);
  const [deletingEditorImages, setDeletingEditorImages] = useState(false);
  const [uploadingGalleryActivityId, setUploadingGalleryActivityId] = useState<string | null>(null);
  const [editorImageKeyword, setEditorImageKeyword] = useState('');
  const [selectedEditorImages, setSelectedEditorImages] = useState<string[]>([]);
  const [showOnlyUnusedEditorImages, setShowOnlyUnusedEditorImages] = useState(false);
  
  // 展開的區塊
  const [expandedSection, setExpandedSection] = useState<string>('homeNews');
  
  // 編輯中的項目
  const [editingItem, setEditingItem] = useState<{ section: string; index: number } | null>(null);

  const pageMappings = [
    {
      page: '首頁',
      route: '/#/',
      sections: '協會簡介、最新消息',
      note: '首頁下方感恩名單同步使用「感恩有您」資料'
    },
    {
      page: '訓練與活動',
      route: '/#/activities',
      sections: '課程與活動項目',
      note: '前台活動頁會直接顯示這份課程清單與招生狀態'
    },
    {
      page: '訓練成果',
      route: '/#/results',
      sections: '訓練紀錄、學員心得',
      note: '同一頁面由兩個後台區塊共同組成'
    },
    {
      page: '媒體報導',
      route: '/#/media',
      sections: '媒體報導、獲獎紀錄',
      note: '兩個區塊都會顯示在媒體報導頁'
    },
    {
      page: '活動剪影',
      route: '/#/gallery',
      sections: '活動剪影相簿',
      note: '控制輪播與圖片清單'
    },
    {
      page: '感恩有您',
      route: '/#/thankyou',
      sections: '感恩名單',
      note: '同時同步到首頁下方名單'
    }
  ];

  const jumpToSection = (sectionId: string, expandedKey?: string) => {
    if (expandedKey) {
      setExpandedSection(expandedKey);
    }

    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, expandedKey ? 120 : 0);
  };

  const quickActions: Array<{
    id: string;
    title: string;
    description: string;
    sectionId: string;
    expandedKey?: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: string;
  }> = [
    {
      id: 'quick-intro',
      title: '修改首頁協會簡介',
      description: '更新首頁第一個展開區塊的文字與圖片。',
      sectionId: 'intro-content-editor',
      icon: Home,
      tone: 'bg-blue-50 text-blue-700 border-blue-100'
    },
    {
      id: 'quick-home-news',
      title: '更新首頁最新消息',
      description: '新增或調整首頁最新消息列表。',
      sectionId: 'section-homeNews',
      expandedKey: 'homeNews',
      icon: Newspaper,
      tone: 'bg-cyan-50 text-cyan-700 border-cyan-100'
    },
    {
      id: 'quick-results',
      title: '編輯訓練成果',
      description: '快速前往訓練紀錄與學員心得區塊。',
      sectionId: 'section-trainingRecords',
      expandedKey: 'trainingRecords',
      icon: MessageSquare,
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    {
      id: 'quick-activities',
      title: '編輯訓練與活動',
      description: '快速前往課程與活動項目區塊。',
      sectionId: 'section-courseItems',
      expandedKey: 'courseItems',
      icon: Edit3,
      tone: 'bg-lime-50 text-lime-700 border-lime-100'
    },
    {
      id: 'quick-gallery',
      title: '管理活動剪影',
      description: '上傳或調整活動照片與相簿內容。',
      sectionId: 'section-galleryItems',
      expandedKey: 'galleryItems',
      icon: Eye,
      tone: 'bg-amber-50 text-amber-700 border-amber-100'
    },
    {
      id: 'quick-editor-images',
      title: '檢查編輯器圖片庫',
      description: '人工查看 editor 圖片並刪除未使用檔案。',
      sectionId: 'editor-image-library',
      icon: Eye,
      tone: 'bg-violet-50 text-violet-700 border-violet-100'
    }
  ];

  const referencedEditorImageUrls = extractCmsEditorImageUrls(cmsData);
  const filteredEditorImages = editorImages.filter((image) => {
    if (showOnlyUnusedEditorImages && referencedEditorImageUrls.has(image.path)) {
      return false;
    }

    const keyword = editorImageKeyword.trim().toLowerCase();
    if (!keyword) return true;

    return [image.name, image.path, image.url].some((value) => value.toLowerCase().includes(keyword));
  });

  const sortedCoursePreview = sortCourseItems(cmsData?.courseItems || []);

  // 檢查登入狀態
  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  // 載入資料：先檢查伺服器端是否有設定 GitHub Token，然後載入資料（若 GitHub 不可用則回退本地）
  useEffect(() => {
    if (!authenticated) return;
    (async () => {
      const valid = await validateToken();
      setTokenValid(valid);
      await loadData();
    })();
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return undefined;

    const handlePageHide = () => {
      const urls = Array.from(pendingEditorImageUrlsRef.current);
      if (!urls.length) return;
      void cleanupEditorImages(urls, true).catch(() => undefined);
      pendingEditorImageUrlsRef.current.clear();
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [authenticated]);

  const trackUploadedEditorImage = (url: string) => {
    const normalized = normalizeEditorImageUrl(url);
    if (normalized) {
      pendingEditorImageUrlsRef.current.add(normalized);
    }
  };

  const cleanupPendingEditorImages = async (urls?: string[]) => {
    const targets = urls && urls.length ? urls : Array.from(pendingEditorImageUrlsRef.current);
    if (!targets.length) return true;

    await cleanupEditorImages(targets);
    for (const url of targets) {
      pendingEditorImageUrlsRef.current.delete(url);
    }
    return true;
  };

  const loadEditorImageLibrary = async () => {
    setLoadingEditorImages(true);
    try {
      const images = await listEditorImages();
      setEditorImages(images);
      setSelectedEditorImages((previous) => previous.filter((url) => images.some((image) => image.url === url)));
    } catch (error) {
      console.error('載入圖片庫失敗:', error);
      showMessage('error', error instanceof Error ? error.message : '載入圖片庫失敗');
    }
    setLoadingEditorImages(false);
  };

  const toggleEditorImageSelection = (url: string) => {
    setSelectedEditorImages((previous) => (
      previous.includes(url)
        ? previous.filter((item) => item !== url)
        : [...previous, url]
    ));
  };

  const selectAllDeletableEditorImages = () => {
    const deletableUrls = filteredEditorImages
      .filter((image) => !referencedEditorImageUrls.has(image.path))
      .map((image) => image.url);

    setSelectedEditorImages(deletableUrls);
  };

  const handleDeleteSelectedEditorImages = async () => {
    if (!selectedEditorImages.length) return;

    requestConfirmation({
      title: `確定要刪除 ${selectedEditorImages.length} 張圖片嗎？`,
      description: '這些圖片會從 editor 圖片庫移除，請先確認它們目前沒有被內容引用。',
      confirmLabel: '刪除圖片',
      tone: 'danger',
      onConfirm: async () => {
        const targetUrls = [...selectedEditorImages];
        setDeletingEditorImages(true);
        try {
          await cleanupEditorImages(targetUrls);
          setSelectedEditorImages([]);
          await loadEditorImageLibrary();
          showMessage('success', '已刪除選取的圖片。');
        } catch (error) {
          console.error('刪除圖片失敗:', error);
          showMessage('error', error instanceof Error ? error.message : '刪除圖片失敗');
        }
        setDeletingEditorImages(false);
      }
    });
  };

  const handleDeleteSingleEditorImage = async (url: string) => {

    requestConfirmation({
      title: '確定要刪除這張圖片嗎？',
      description: '這張圖片會從 editor 圖片庫移除，若其他內容仍在使用，前台圖片將失效。',
      confirmLabel: '刪除圖片',
      tone: 'danger',
      onConfirm: async () => {
        setDeletingEditorImages(true);
        try {
          await cleanupEditorImages([url]);
          setSelectedEditorImages((previous) => previous.filter((item) => item !== url));
          await loadEditorImageLibrary();
          showMessage('success', '已刪除圖片。');
        } catch (error) {
          console.error('刪除圖片失敗:', error);
          showMessage('error', error instanceof Error ? error.message : '刪除圖片失敗');
        }
        setDeletingEditorImages(false);
      }
    });
  };

  const checkToken = async () => {
    const valid = await validateToken();
    setTokenValid(valid);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (pendingEditorImageUrlsRef.current.size) {
        try {
          await cleanupPendingEditorImages();
        } catch (cleanupError) {
          console.warn('清理未儲存圖片失敗，將在下次操作時再試一次', cleanupError);
        }
      }

      // 嘗試透過伺服器代理從 GitHub 取得整合後的 CMS 資料
      try {
        const result = await getFileContent();
        if (result && result.content) {
          const normalizedData = normalizeCmsData(result.content as Partial<CmsData>);
          setCmsData({
            ...normalizedData,
            thankYouItems: normalizeThankYouAdminItems(normalizedData.thankYouItems || [])
          });
          setCmsShas(result.shas || null);
          await loadEditorImageLibrary();
          setLoading(false);
          return;
        }
      } catch (ghErr) {
        console.warn('從後端 GitHub 代理載入失敗，回退至本地 cms/*.json', ghErr);
      }

      const localCmsData = await loadCmsData();
      setCmsData({
        ...localCmsData,
        thankYouItems: normalizeThankYouAdminItems(localCmsData.thankYouItems || [])
      });
      setCmsShas(null);
      await loadEditorImageLibrary();
    } catch (error) {
      console.error('載入資料失敗:', error);
      showMessage('error', '載入資料失敗');
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) {
      setAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('帳號或密碼錯誤');
    }
  };

  const handleLogout = async () => {
    try {
      if (pendingEditorImageUrlsRef.current.size) {
        await cleanupPendingEditorImages();
      }
    } catch (cleanupError) {
      console.warn('登出前清理未儲存圖片失敗', cleanupError);
    }

    logout();
    setAuthenticated(false);
    setCmsData(null);
    setCmsShas(null);
  };

  // GitHub token 存放改為伺服器端，前端僅顯示狀態並提供檢查功能

  const showMessage = (type: 'success' | 'error', text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setMessages((previous) => [...previous, { id, type, text }]);

    const timeoutId = window.setTimeout(() => {
      setMessages((previous) => previous.filter((message) => message.id !== id));
      toastTimeoutsRef.current.delete(id);
    }, type === 'error' ? 12000 : 3600);

    toastTimeoutsRef.current.set(id, timeoutId);
  };

  const dismissMessage = (id: number) => {
    const timeoutId = toastTimeoutsRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      toastTimeoutsRef.current.delete(id);
    }

    setMessages((previous) => previous.filter((message) => message.id !== id));
  };

  const requestConfirmation = (options: ConfirmDialogState) => {
    setConfirmDialog(options);
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(null);
  };

  const handleConfirmDialog = () => {
    if (!confirmDialog) return;
    const action = confirmDialog.onConfirm;
    setConfirmDialog(null);
    action();
  };

  const moveGalleryActivity = (draggedId: string, targetId: string) => {
    if (!cmsData) return;

    const orderedItems = sortGalleryItems(cmsData.galleryItems || []);
    const draggedIndex = orderedItems.findIndex((item) => item.id === draggedId);
    const targetIndex = orderedItems.findIndex((item) => item.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;

    const nextOrderedItems = [...orderedItems];
    const [movedItem] = nextOrderedItems.splice(draggedIndex, 1);
    nextOrderedItems.splice(targetIndex, 0, movedItem);

    const reorderedMap = new Map(
      nextOrderedItems.map((item, index) => [item.id, { ...item, sortOrder: (index + 1) * 10 }])
    );

    setCmsData({
      ...cmsData,
      galleryItems: (cmsData.galleryItems || []).map((item) => reorderedMap.get(item.id) || item)
    });
  };

  const updateGalleryActivityField = (activityId: string, field: keyof GalleryItem, value: any) => {
    if (!cmsData) return;

    setCmsData({
      ...cmsData,
      galleryItems: (cmsData.galleryItems || []).map((item) => (
        item.id === activityId ? { ...item, [field]: value } : item
      ))
    });
  };

  const setGalleryCoverPhoto = (activityId: string, photoId: string) => {
    if (!cmsData) return;

    setCmsData({
      ...cmsData,
      galleryItems: (cmsData.galleryItems || []).map((item) => (
        item.id === activityId ? { ...item, coverPhotoId: photoId } : item
      ))
    });
  };

  const deleteGalleryActivity = (activityId: string) => {
    if (!cmsData) return;

    requestConfirmation({
      title: '確定要刪除此活動嗎？',
      description: '這會移除整個活動與活動內的照片排序資料，但不會刪除 repo 裡已上傳的圖片檔案。',
      confirmLabel: '刪除活動',
      tone: 'danger',
      onConfirm: () => {
        setCmsData({
          ...cmsData,
          galleryItems: (cmsData.galleryItems || []).filter((item) => item.id !== activityId)
        });
      }
    });
  };

  const moveGalleryPhoto = (activityId: string, draggedPhotoId: string, targetPhotoId: string) => {
    if (!cmsData) return;

    setCmsData({
      ...cmsData,
      galleryItems: (cmsData.galleryItems || []).map((item) => {
        if (item.id !== activityId) return item;

        const photos = [...(item.photos || [])];
        const draggedIndex = photos.findIndex((photo) => photo.id === draggedPhotoId);
        const targetIndex = photos.findIndex((photo) => photo.id === targetPhotoId);
        if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return item;

        const [movedPhoto] = photos.splice(draggedIndex, 1);
        photos.splice(targetIndex, 0, movedPhoto);
        return { ...item, photos };
      })
    });
  };

  const deleteGalleryPhoto = (activityId: string, photoId: string) => {
    if (!cmsData) return;

    requestConfirmation({
      title: '確定要把這張照片從此活動移除嗎？',
      description: '這只會移除活動內的引用，不會刪除 repo 圖檔。若這張圖目前是封面，系統會自動改用下一張照片。',
      confirmLabel: '移除照片',
      tone: 'danger',
      onConfirm: () => {
        setCmsData({
          ...cmsData,
          galleryItems: (cmsData.galleryItems || []).map((item) => {
            if (item.id !== activityId) return item;

            const nextPhotos = (item.photos || []).filter((photo) => photo.id !== photoId);
            const nextCoverPhotoId = item.coverPhotoId === photoId ? nextPhotos[0]?.id : item.coverPhotoId;

            return { ...item, photos: nextPhotos, coverPhotoId: nextCoverPhotoId };
          })
        });
      }
    });
  };

  const uploadGalleryPhotos = async (activityId: string, files: FileList) => {
    if (!cmsData) return;

    setUploadingGalleryActivityId(activityId);
    try {
      const uploadedPhotos: GalleryPhoto[] = [];
      const selectedFiles = Array.from(files);

      for (const [index, file] of selectedFiles.entries()) {
        const url = await uploadValidatedEditorImage(file);
        trackUploadedEditorImage(url);
        uploadedPhotos.push({
          id: `${activityId}-photo-${Date.now()}-${index}`,
          imageUrl: url,
          title: file.name.replace(/\.[^.]+$/, ''),
          description: ''
        });
      }

      setCmsData((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          galleryItems: (previous.galleryItems || []).map((item) => (
            item.id === activityId
              ? {
                  ...item,
                  coverPhotoId: item.coverPhotoId || uploadedPhotos[0]?.id,
                  photos: [...(item.photos || []), ...uploadedPhotos]
                }
              : item
          ))
        };
      });
      showMessage('success', `已新增 ${uploadedPhotos.length} 張照片。`);
    } catch (error) {
      console.error('活動照片上傳失敗:', error);
      const errorMessage = error instanceof Error ? error.message : '活動照片上傳失敗';
      showMessage('error', `活動照片上傳失敗：${errorMessage}`);
    }
    setUploadingGalleryActivityId(null);
  };

  const moveCourseItemByPreview = (courseId: string, direction: 'up' | 'down') => {
    if (!cmsData) return;

    const orderedItems = sortCourseItems(cmsData.courseItems || []);
    const currentIndex = orderedItems.findIndex((item) => item.id === courseId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= orderedItems.length) return;

    const nextOrderedItems = [...orderedItems];
    const [movedItem] = nextOrderedItems.splice(currentIndex, 1);
    nextOrderedItems.splice(targetIndex, 0, movedItem);

    const reorderedMap = new Map(
      nextOrderedItems.map((item, index) => [
        item.id,
        {
          ...item,
          sortOrder: (index + 1) * 10
        }
      ])
    );

    setCmsData({
      ...cmsData,
      courseItems: (cmsData.courseItems || []).map((item) => reorderedMap.get(item.id) || item)
    });
  };

  const moveThankYouItem = (draggedId: string, targetId: string) => {
    if (!cmsData) return;

    const orderedItems = normalizeThankYouAdminItems(cmsData.thankYouItems || []);
    const draggedIndex = orderedItems.findIndex((item) => item.id === draggedId);
    const targetIndex = orderedItems.findIndex((item) => item.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;

    const draggedItem = orderedItems[draggedIndex];
    const targetItem = orderedItems[targetIndex];
    if ((draggedItem.year || '') !== (targetItem.year || '')) {
      showMessage('error', '拖曳排序僅支援同年度內調整，跨年度請直接修改年度欄位。');
      return;
    }

    const nextOrderedItems = [...orderedItems];
    const [movedItem] = nextOrderedItems.splice(draggedIndex, 1);
    nextOrderedItems.splice(targetIndex, 0, movedItem);

    setCmsData({
      ...cmsData,
      thankYouItems: normalizeThankYouAdminItems(nextOrderedItems)
    });
  };

  const deleteThankYouItem = (itemId: string) => {
    if (!cmsData) return;

    requestConfirmation({
      title: '確定要刪除此項目嗎？',
      description: '刪除後會在本次編輯中立即生效，需按右上角「發布更新」才會正式送出。',
      confirmLabel: '刪除項目',
      tone: 'danger',
      onConfirm: () => {
        setCmsData({
          ...cmsData,
          thankYouItems: normalizeThankYouAdminItems((cmsData.thankYouItems || []).filter((item) => item.id !== itemId))
        });
      }
    });
  };

  const updateThankYouItemField = (itemId: string, field: string, value: any) => {
    if (!cmsData) return;

    const nextItems = (cmsData.thankYouItems || []).map((item) => (
      item.id === itemId ? { ...item, [field]: value } : item
    ));

    setCmsData({
      ...cmsData,
      thankYouItems: normalizeThankYouAdminItems(nextItems)
    });
  };

  const moveThankYouItemByDirection = (itemId: string, direction: 'up' | 'down') => {
    if (!cmsData) return;

    const orderedItems = normalizeThankYouAdminItems(cmsData.thankYouItems || []);
    const currentIndex = orderedItems.findIndex((item) => item.id === itemId);
    if (currentIndex === -1) return;

    const currentItem = orderedItems[currentIndex];
    const sameYearIndexes = orderedItems
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => (item.year || '') === (currentItem.year || ''));

    const sameYearPosition = sameYearIndexes.findIndex(({ item }) => item.id === itemId);
    if (sameYearPosition === -1) return;

    const targetPosition = direction === 'up' ? sameYearPosition - 1 : sameYearPosition + 1;
    if (targetPosition < 0 || targetPosition >= sameYearIndexes.length) return;

    moveThankYouItem(itemId, sameYearIndexes[targetPosition].item.id);
  };

  const handleSave = async () => {
    if (!cmsData) return;
    if (!cmsShas) {
      showMessage('error', '目前不是最新的 GitHub 版本，請先重新載入資料後再儲存。');
      return;
    }
    
    setSaving(true);
    try {
      const referencedImageUrls = extractCmsEditorImageUrls(cmsData);
      const unusedPendingUrls = Array.from(pendingEditorImageUrlsRef.current).filter((url) => !referencedImageUrls.has(url));
      pendingEditorImageUrlsRef.current = new Set(unusedPendingUrls);

      await updateCmsData(cmsData, `📝 管理員更新網站內容 - ${new Date().toLocaleString('zh-TW')}`, cmsShas);

      if (unusedPendingUrls.length) {
        try {
          await cleanupPendingEditorImages(unusedPendingUrls);
        } catch (cleanupError) {
          console.warn('儲存後清理未使用圖片失敗，稍後會再嘗試', cleanupError);
        }
      }

      pendingEditorImageUrlsRef.current.clear();
      await loadData();
      showMessage('success', '儲存成功！網站將在 1-2 分鐘內更新');
    } catch (error: any) {
      const errorMessage = error?.message || '儲存失敗';
      if (/changed on GitHub|409/.test(errorMessage)) {
        showMessage('error', CONFLICT_ERROR_MESSAGE);
      } else {
        showMessage('error', errorMessage);
      }
    }
    setSaving(false);
  };

  // 下載整份 CMS 備份檔（手動維護或備份用）
  const handleDownloadJson = () => {
    if (!cmsData) return;
    
    const dataWithTimestamp = {
      ...cmsData,
      lastUpdated: new Date().toISOString()
    };
    
    // 使用 UTF-8 BOM 確保中文正確顯示
    const jsonString = JSON.stringify(dataWithTimestamp, null, 2);
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cms-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('success', '已下載 cms-export.json，可作為整站內容備份');
  };

  // 新增項目
  const addItem = (section: CmsCollectionKey) => {
    if (!cmsData) return;
    const newId = `${section}-${Date.now()}`;
    let newItem: CourseItem | NewsItem | TrainingRecordItem | MediaItem | AwardItem | TestimonialItem | GalleryItem | ThankYouItem;
    switch (section) {
      case 'courseItems':
        const nextCourseItems = sortCourseItems(cmsData.courseItems || []);
        const nextSortOrder = nextCourseItems.reduce((maxOrder, item) => (
          typeof item.sortOrder === 'number' && Number.isFinite(item.sortOrder)
            ? Math.max(maxOrder, item.sortOrder)
            : maxOrder
        ), 0) + 10;
        newItem = {
          id: newId,
          title: '新課程名稱',
          description: '<p>請輸入課程說明。</p>',
          date: new Date().toISOString().split('T')[0],
          sortOrder: nextSortOrder,
          schedule: '',
          location: '',
          price: '',
          features: [],
          isRecruiting: true
        };
        break;
      case 'homeNews':
        newItem = {
          id: newId,
          date: new Date().toISOString().split('T')[0],
          title: '新消息標題',
          description: '請輸入說明文字',
          isNew: true
        };
        break;
      case 'trainingRecords':
        newItem = {
          id: newId,
          date: new Date().toISOString().split('T')[0],
          title: '新訓練紀錄標題',
          description: '<p>請輸入卡片摘要。</p>',
          isNew: true,
          detailBlocks: [createTrainingRecordDetailBlock()]
        };
        break;
      case 'mediaReports':
        newItem = {
          id: newId,
          date: new Date().toISOString().split('T')[0],
          title: '新媒體報導標題',
          source: '',
          link: '',
          type: 'article'
        };
        break;
      case 'awards':
        newItem = {
          id: newId,
          year: new Date().getFullYear().toString(),
          title: '新獎項名稱',
          description: '請輸入說明',
          icon: '🏆'
        };
        break;
      case 'testimonials':
        newItem = {
          id: newId,
          content: '請輸入心得內容...',
          author: '姓名',
          role: '學員身份'
        };
        break;
      case 'galleryItems':
        const nextGalleryItems = sortGalleryItems(cmsData.galleryItems || []);
        const nextGallerySortOrder = nextGalleryItems.reduce((maxOrder, item) => (
          typeof item.sortOrder === 'number' && Number.isFinite(item.sortOrder)
            ? Math.max(maxOrder, item.sortOrder)
            : maxOrder
        ), 0) + 10;
        newItem = {
          id: newId,
          title: '新活動名稱',
          description: '',
          date: new Date().toISOString().split('T')[0],
          category: '',
          isActive: true,
          sortOrder: nextGallerySortOrder,
          coverPhotoId: undefined,
          photos: []
        };
        break;
      case 'thankYouItems':
        newItem = {
          id: newId,
          year: getCurrentRocYear(),
          sortOrder: (normalizeThankYouAdminItems(cmsData.thankYouItems || []).filter((item) => item.year === getCurrentRocYear()).length + 1) * 10,
          name: '請輸入姓名或單位',
          description: ''
        };
        break;
      default:
        return;
    }

    if (section === 'thankYouItems') {
      setCmsData({
        ...cmsData,
        thankYouItems: normalizeThankYouAdminItems([newItem as ThankYouItem, ...(cmsData.thankYouItems || [])])
      });
      return;
    }

    setCmsData({
      ...cmsData,
      [section]: [newItem, ...cmsData[section]]
    });
  };

  // 刪除項目
  const deleteItem = (section: CmsCollectionKey, index: number) => {
    if (!cmsData) return;

    requestConfirmation({
      title: '確定要刪除此項目嗎？',
      description: '刪除後會在本次編輯中立即生效，需按右上角「發布更新」才會正式送出。',
      confirmLabel: '刪除項目',
      tone: 'danger',
      onConfirm: () => {
        const items = [...cmsData[section]];
        items.splice(index, 1);

        setCmsData({
          ...cmsData,
          [section]: items
        });
      }
    });
  };

  // 更新項目欄位
  const updateItemField = (section: CmsCollectionKey, index: number, field: string, value: any) => {
    if (!cmsData) return;
    
    const items = [...cmsData[section]];
    items[index] = { ...items[index], [field]: value };
    
    setCmsData({
      ...cmsData,
      [section]: items
    });
  };

  // 登入畫面
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-cyan-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">後台管理系統</h1>
            <p className="text-gray-500 mt-2">新北市水上安全協會</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">帳號</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="請輸入帳號"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="請輸入密碼"
              />
            </div>
            
            {loginError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              登入
            </button>
          </form>
          
          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-1"
          >
            <Home className="w-4 h-4" />
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  // 主後台介面
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 頂部導覽 */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">後台管理</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Token 狀態（伺服器端） */}
            {tokenValid !== null && (
              <span className={`flex items-center gap-1 text-sm ${tokenValid ? 'text-green-600' : 'text-yellow-600'}`}>
                <Key className="w-4 h-4" />
                {tokenValid ? 'GitHub 已設定（由伺服器管理）' : 'GitHub 未設定 / 驗證失敗'}
              </span>
            )}

            {/* 本地預覽按鈕 */}
            <button
              onClick={handleDownloadJson}
              disabled={!cmsData}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50"
              title="下載 JSON 檔案到本地預覽"
            >
              <Download className="w-4 h-4" />
              本地預覽
            </button>

            <button
              onClick={loadData}
              disabled={loading || saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="重新載入 GitHub 最新內容"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              重新載入
            </button>
            
            {/* 儲存按鈕 */}
            <button
              onClick={handleSave}
              disabled={saving || loading || !tokenValid || !cmsShas}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? '儲存中...' : '發布更新'}
            </button>
            
            {/* 設定 */}
            <button
              onClick={() => setShowTokenSetup(true)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              title="設定"
            >
              <Key className="w-5 h-5" />
            </button>
            
            {/* 登出 */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg"
              title="登出"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <AdminFeedbackToast messages={messages} onDismiss={dismissMessage} />

      <AdminConfirmDialog
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title || ''}
        description={confirmDialog?.description}
        confirmLabel={confirmDialog?.confirmLabel}
        cancelLabel={confirmDialog?.cancelLabel}
        tone={confirmDialog?.tone}
        onConfirm={handleConfirmDialog}
        onCancel={closeConfirmDialog}
      />

      {/* Token 設定 Modal */}
      {showTokenSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Key className="w-5 h-5" />
              GitHub 設定說明（伺服器）
            </h2>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                <p className="font-medium mb-2">說明：</p>
                <p>為了安全，GitHub Personal Access Token 應設定在伺服器端環境變數 <strong>GITHUB_TOKEN</strong>，由後端負責與 GitHub 互動。</p>
                <p className="mt-2">伺服器上的環境變數設定範例（PowerShell）：</p>
                <pre className="bg-white p-2 rounded text-xs">$env:GITHUB_TOKEN = 'ghp_xxx...'</pre>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={async () => { await checkToken(); showMessage('success', '已重新檢查 GitHub 狀態'); }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  重新檢查狀態
                </button>
                <button
                  onClick={() => setShowTokenSetup(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主內容 */}
      <main className="max-w-5xl mx-auto p-4 py-8">
        {tokenValid !== true && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">伺服器尚未設定 GitHub Token</p>
              <p className="text-sm text-yellow-700 mt-1">
                請在伺服器環境變數中設定 <strong>GITHUB_TOKEN</strong>，或按下「重新檢查狀態」。
                <button 
                  onClick={() => setShowTokenSetup(true)}
                  className="underline ml-1"
                >
                  說明
                </button>
              </p>
            </div>
          </div>
        )}

        {tokenValid === true && !cmsShas && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">目前未載入到 GitHub 最新版本</p>
              <p className="text-sm text-amber-700 mt-1">請先按「重新載入」取得最新內容後再發布更新，避免覆蓋他人先前修改。</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">載入中...</p>
          </div>
        ) : cmsData ? (
          <div className="space-y-4">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-700">常用入口</p>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1">後台工作台</h2>
                  <p className="text-sm text-slate-600 mt-2">
                    先從常用編輯項目進入，再視需要往下調整其他區塊；完成後請記得按右上角「發布更新」。
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 min-w-[220px]">
                  <p className="text-xs font-medium text-slate-500">建議操作順序</p>
                  <ol className="mt-2 space-y-1 text-sm text-slate-700 list-decimal list-inside">
                    <li>先按重新載入</li>
                    <li>編輯對應內容區塊</li>
                    <li>確認後按發布更新</li>
                  </ol>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => jumpToSection(action.sectionId, action.expandedKey)}
                      className="text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-4 transition"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`inline-flex items-center justify-center w-11 h-11 rounded-xl border ${action.tone}`}>
                          <Icon className="w-5 h-5" />
                        </span>
                        <div>
                          <div className="font-bold text-slate-800">{action.title}</div>
                          <p className="text-sm text-slate-600 mt-1">{action.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => jumpToSection('page-group-home')}
                  className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700"
                >
                  查看首頁相關全部區塊
                </button>
                <button
                  type="button"
                  onClick={() => jumpToSection('page-group-activities')}
                  className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700"
                >
                  查看訓練與活動全部區塊
                </button>
                <button
                  type="button"
                  onClick={() => jumpToSection('page-group-results')}
                  className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700"
                >
                  查看訓練成果全部區塊
                </button>
                <button
                  type="button"
                  onClick={() => jumpToSection('page-group-thankyou')}
                  className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700"
                >
                  查看感恩有您全部區塊
                </button>
              </div>
            </section>

            <section className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">前後台對照總表</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                  先找前台頁面，再編輯對應區塊
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                這裡先標出每個前台頁面對應的後台資料區塊，避免只看到資料名稱卻不知道會顯示在哪一頁。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {pageMappings.map((mapping) => (
                  <div key={mapping.route} className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-800">{mapping.page}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {mapping.route}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-3">後台區塊：{mapping.sections}</p>
                    <p className="text-xs text-slate-500 mt-2">{mapping.note}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="editor-image-library" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm scroll-mt-24">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">編輯器圖片庫</h2>
                  <p className="text-sm text-slate-600 mt-2">人工檢查 editor 圖片、搜尋檔名，並刪除目前未被內容引用的圖片。</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={loadEditorImageLibrary}
                    disabled={loadingEditorImages || deletingEditorImages}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    {loadingEditorImages ? '載入中...' : '重新整理圖片庫'}
                  </button>
                  <button
                    type="button"
                    onClick={selectAllDeletableEditorImages}
                    disabled={loadingEditorImages || deletingEditorImages || !filteredEditorImages.some((image) => !referencedEditorImageUrls.has(image.path))}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    全選可刪圖片
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelectedEditorImages}
                    disabled={deletingEditorImages || !selectedEditorImages.length}
                    className="px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {deletingEditorImages ? '刪除中...' : `刪除選取圖片 (${selectedEditorImages.length})`}
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={editorImageKeyword}
                  onChange={(event) => setEditorImageKeyword(event.target.value)}
                  className="md:col-span-2 w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="搜尋檔名或路徑"
                />
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600">
                  共 {filteredEditorImages.length} 張，可刪 {filteredEditorImages.filter((image) => !referencedEditorImageUrls.has(image.path)).length} 張
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <label className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={showOnlyUnusedEditorImages}
                    onChange={(event) => setShowOnlyUnusedEditorImages(event.target.checked)}
                  />
                  只看未引用圖片
                </label>
                <span className="text-slate-500">開啟後只顯示目前未被 CMS 內容引用、可直接整理的圖片。</span>
              </div>

              <div className="mt-4 space-y-3">
                {loadingEditorImages ? (
                  <p className="text-sm text-slate-500">圖片清單載入中...</p>
                ) : filteredEditorImages.length ? (
                  filteredEditorImages.map((image) => {
                    const referenced = referencedEditorImageUrls.has(image.path);
                    const selected = selectedEditorImages.includes(image.url);

                    return (
                      <div key={image.url} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="w-full md:w-40 h-28 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                            <img src={image.url} alt={image.name} className="max-w-full max-h-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  disabled={referenced || deletingEditorImages}
                                  onChange={() => toggleEditorImageSelection(image.url)}
                                />
                                {image.name}
                              </label>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${referenced ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                {referenced ? '內容引用中' : '可人工刪除'}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {(image.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-slate-500 break-all">{image.path}</p>
                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                              <span>網址：{image.url}</span>
                              <span>上傳時間：{image.uploadedAt ? new Date(image.uploadedAt).toLocaleString('zh-TW') : '未知'}</span>
                            </div>
                            {!referenced && (
                              <div className="mt-3">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSingleEditorImage(image.url)}
                                  disabled={deletingEditorImages}
                                  className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                                >
                                  單張刪除
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500">目前沒有符合條件的 editor 圖片。</p>
                )}
              </div>
            </section>

            <PageGroup
              sectionId="page-group-home"
              title="首頁"
              route="/#/"
              description="這一組會顯示在前台首頁，包含首頁的協會簡介與最新消息。"
            >
              <div id="intro-content-editor" className="bg-white rounded-xl shadow-sm p-6 mb-4 scroll-mt-24">
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-800">首頁 / 協會簡介</h3>
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-100">
                      前台：首頁 / 協會簡介
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">對應前台首頁第一個展開區塊「協會簡介」。</p>
                </div>
                <IntroEditor
                  value={cmsData.introContent || ''}
                  onChange={v => setCmsData({ ...cmsData, introContent: v })}
                  onImageUploaded={trackUploadedEditorImage}
                />
              </div>

              <SectionEditor
                sectionId="section-homeNews"
                title="首頁 / 最新消息"
                pageLabel="首頁 / 最新消息"
                description="對應前台首頁第二個展開區塊「最新消息」。"
                icon={<Newspaper className="w-5 h-5" />}
                items={cmsData.homeNews}
                sectionKey="homeNews"
                expanded={expandedSection === 'homeNews'}
                onToggle={() => setExpandedSection(expandedSection === 'homeNews' ? '' : 'homeNews')}
                onAdd={() => addItem('homeNews')}
                onDelete={(index) => deleteItem('homeNews', index)}
                onUpdate={(index, field, value) => updateItemField('homeNews', index, field, value)}
                renderItem={(item, index) => (
                  <NewsItemEditor
                    item={item}
                    onUpdate={(field, value) => updateItemField('homeNews', index, field, value)}
                    onImageUploaded={trackUploadedEditorImage}
                  />
                )}
              />
            </PageGroup>

            <PageGroup
              sectionId="page-group-activities"
              title="訓練與活動"
              route="/#/activities"
              description="這一組對應前台訓練與活動頁的課程與活動內容。"
            >
              <SectionEditor
                sectionId="section-courseItems"
                title="訓練與活動 / 課程與活動項目"
                pageLabel="訓練與活動 / 課程清單"
                description="對應前台訓練與活動頁中的課程卡片、特色與招生狀態。"
                icon={<Edit3 className="w-5 h-5" />}
                items={cmsData.courseItems || []}
                sectionKey="courseItems"
                expanded={expandedSection === 'courseItems'}
                onToggle={() => setExpandedSection(expandedSection === 'courseItems' ? '' : 'courseItems')}
                onAdd={() => addItem('courseItems')}
                onDelete={(index) => deleteItem('courseItems', index)}
                onUpdate={(index, field, value) => updateItemField('courseItems', index, field, value)}
                helperContent={(
                  <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-blue-900">前台排序預覽</h4>
                        <p className="mt-1 text-xs text-blue-700">前台會依「自訂排序」由小到大，再依「排序日期」由新到舊顯示。未填自訂排序時，會自動排到後面再比日期，也可直接用右側上下按鈕快速調整。</p>
                      </div>
                      <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700">
                        共 {sortedCoursePreview.length} 筆
                      </span>
                    </div>
                    {sortedCoursePreview.length ? (
                      <div className="mt-3 space-y-2">
                        {sortedCoursePreview.map((course, index) => (
                          <div key={course.id} className="flex flex-col gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-bold text-white">
                                  {index + 1}
                                </span>
                                <span className="font-medium text-slate-800">{course.title}</span>
                                {course.isRecruiting === false ? (
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">未招生</span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                                排序：{typeof course.sortOrder === 'number' ? course.sortOrder : '未設定'}
                              </span>
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                                日期：{course.date || '未設定'}
                              </span>
                              <div className="ml-0 flex items-center gap-1 md:ml-2">
                                <button
                                  type="button"
                                  onClick={() => moveCourseItemByPreview(course.id, 'up')}
                                  disabled={index === 0}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                  title="往前移一格"
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveCourseItemByPreview(course.id, 'down')}
                                  disabled={index === sortedCoursePreview.length - 1}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                  title="往後移一格"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-blue-700">目前尚無課程資料。</p>
                    )}
                  </div>
                )}
                renderItem={(item, index) => (
                  <CourseItemEditor
                    item={item}
                    onUpdate={(field, value) => updateItemField('courseItems', index, field, value)}
                    onImageUploaded={trackUploadedEditorImage}
                  />
                )}
              />
            </PageGroup>

            <PageGroup
              sectionId="page-group-results"
              title="訓練成果"
              route="/#/results"
              description="前台訓練成果頁目前由兩個後台區塊組成：訓練紀錄與學員心得。"
            >
              <SectionEditor
                sectionId="section-trainingRecords"
                title="訓練成果 / 訓練紀錄"
                pageLabel="訓練成果 / 訓練紀錄"
                description="對應前台訓練成果頁中的訓練紀錄列表。"
                icon={<Newspaper className="w-5 h-5" />}
                items={cmsData.trainingRecords}
                sectionKey="trainingRecords"
                expanded={expandedSection === 'trainingRecords'}
                onToggle={() => setExpandedSection(expandedSection === 'trainingRecords' ? '' : 'trainingRecords')}
                onAdd={() => addItem('trainingRecords')}
                onDelete={(index) => deleteItem('trainingRecords', index)}
                onUpdate={(index, field, value) => updateItemField('trainingRecords', index, field, value)}
                renderItem={(item, index) => (
                  <TrainingRecordEditor
                    item={item}
                    onUpdate={(field, value) => updateItemField('trainingRecords', index, field, value)}
                    onImageUploaded={trackUploadedEditorImage}
                  />
                )}
              />

              <SectionEditor
                sectionId="section-testimonials"
                title="訓練成果 / 學員心得"
                pageLabel="訓練成果 / 學員心得"
                description="對應前台訓練成果頁中的學員心得區塊。"
                icon={<MessageSquare className="w-5 h-5" />}
                items={cmsData.testimonials}
                sectionKey="testimonials"
                expanded={expandedSection === 'testimonials'}
                onToggle={() => setExpandedSection(expandedSection === 'testimonials' ? '' : 'testimonials')}
                onAdd={() => addItem('testimonials')}
                onDelete={(index) => deleteItem('testimonials', index)}
                onUpdate={(index, field, value) => updateItemField('testimonials', index, field, value)}
                renderItem={(item, index) => (
                  <TestimonialItemEditor
                    item={item}
                    onUpdate={(field, value) => updateItemField('testimonials', index, field, value)}
                  />
                )}
              />
            </PageGroup>

            <PageGroup
              sectionId="page-group-media"
              title="媒體報導"
              route="/#/media"
              description="前台媒體報導頁目前由媒體報導與獲獎紀錄兩個資料區塊組成。"
            >
              <SectionEditor
                sectionId="section-mediaReports"
                title="媒體報導 / 媒體報導列表"
                pageLabel="媒體報導 / 媒體報導"
                description="對應前台媒體報導頁中的媒體報導列表。"
                icon={<Newspaper className="w-5 h-5" />}
                items={cmsData.mediaReports || []}
                sectionKey="mediaReports"
                expanded={expandedSection === 'mediaReports'}
                onToggle={() => setExpandedSection(expandedSection === 'mediaReports' ? '' : 'mediaReports')}
                onAdd={() => addItem('mediaReports')}
                onDelete={(index) => deleteItem('mediaReports', index)}
                onUpdate={(index, field, value) => updateItemField('mediaReports', index, field, value)}
                renderItem={(item, index) => (
                  <MediaItemEditor
                    item={item}
                    onUpdate={(field, value) => updateItemField('mediaReports', index, field, value)}
                  />
                )}
              />

              <SectionEditor
                sectionId="section-awards"
                title="媒體報導 / 獲獎紀錄"
                pageLabel="媒體報導 / 獲獎紀錄"
                description="對應前台媒體報導頁中的獲獎紀錄區塊。"
                icon={<Award className="w-5 h-5" />}
                items={cmsData.awards}
                sectionKey="awards"
                expanded={expandedSection === 'awards'}
                onToggle={() => setExpandedSection(expandedSection === 'awards' ? '' : 'awards')}
                onAdd={() => addItem('awards')}
                onDelete={(index) => deleteItem('awards', index)}
                onUpdate={(index, field, value) => updateItemField('awards', index, field, value)}
                renderItem={(item, index) => (
                  <AwardItemEditor
                    item={item}
                    onUpdate={(field, value) => updateItemField('awards', index, field, value)}
                    onImageUploaded={trackUploadedEditorImage}
                  />
                )}
              />
            </PageGroup>

            <PageGroup
              sectionId="page-group-gallery"
              title="活動剪影"
              route="/#/gallery"
              description="這一組對應前台活動剪影頁的相簿與輪播內容。"
            >
              <GalleryActivitiesEditor
                sectionId="section-galleryItems"
                items={cmsData.galleryItems || []}
                expanded={expandedSection === 'galleryItems'}
                onToggle={() => setExpandedSection(expandedSection === 'galleryItems' ? '' : 'galleryItems')}
                onAdd={() => addItem('galleryItems')}
                onDeleteActivity={deleteGalleryActivity}
                onUpdateActivity={updateGalleryActivityField}
                onSetCoverPhoto={setGalleryCoverPhoto}
                onUploadPhotos={uploadGalleryPhotos}
                onDeletePhoto={deleteGalleryPhoto}
                onMoveActivity={moveGalleryActivity}
                onMovePhoto={moveGalleryPhoto}
                uploadingActivityId={uploadingGalleryActivityId}
              />
            </PageGroup>

            <PageGroup
              sectionId="page-group-thankyou"
              title="感恩有您"
              route="/#/thankyou"
              description="這一組主要對應前台感恩有您頁；目前首頁下方也會同步顯示這份名單。"
            >
              <ThankYouSectionEditor
                sectionId="section-thankYouItems"
                title="感恩有您 / 名單內容"
                pageLabel="感恩有您頁 / 首頁下方名單"
                description="對應前台感恩有您頁，並同步顯示於首頁下方感恩名單；系統會依民國年度自動分組。"
                icon={<CheckCircle className="w-5 h-5" />}
                items={cmsData.thankYouItems || []}
                expanded={expandedSection === 'thankYouItems'}
                onToggle={() => setExpandedSection(expandedSection === 'thankYouItems' ? '' : 'thankYouItems')}
                onAdd={() => addItem('thankYouItems')}
                onDelete={deleteThankYouItem}
                onUpdate={updateThankYouItemField}
                onMove={moveThankYouItem}
              />
            </PageGroup>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            無法載入資料
          </div>
        )}
      </main>
    </div>
  );
};

// 區塊編輯器元件
interface SectionEditorProps {
  sectionId?: string;
  title: string;
  pageLabel?: string;
  description?: string;
  icon: React.ReactNode;
  items: any[];
  sectionKey: string;
  expanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
  onUpdate: (index: number, field: string, value: any) => void;
  renderItem: (item: any, index: number) => React.ReactNode;
  helperContent?: React.ReactNode;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  sectionId,
  title,
  pageLabel,
  description,
  icon,
  items,
  expanded,
  onToggle,
  onAdd,
  onDelete,
  renderItem,
  helperContent
}) => {
  return (
    <div id={sectionId} className="bg-white rounded-xl shadow-sm overflow-hidden scroll-mt-24">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3 text-left">
          <span className="text-blue-600 self-start mt-0.5">{icon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-800">{title}</span>
              {pageLabel && (
                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-100">
                  前台：{pageLabel}
                </span>
              )}
              <span className="bg-gray-100 text-gray-600 text-sm px-2 py-0.5 rounded-full">
                {items.length} 項
              </span>
            </div>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      
      {expanded && (
        <div className="px-6 pb-6">
          <button
            onClick={onAdd}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-2 mb-4"
          >
            <Plus className="w-5 h-5" />
            新增項目
          </button>

          {helperContent ? (
            <div className="mb-4">{helperContent}</div>
          ) : null}
          
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 relative group">
                <button
                  onClick={() => onDelete(index)}
                  className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition"
                  title="刪除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface PageGroupProps {
  sectionId?: string;
  title: string;
  route: string;
  description: string;
  children: React.ReactNode;
}

const PageGroup: React.FC<PageGroupProps> = ({ sectionId, title, route, description, children }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <section id={sectionId} className="space-y-4 scroll-mt-24">
      <div className="overflow-hidden rounded-xl bg-slate-800 text-white shadow-sm">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="flex w-full items-start justify-between gap-4 px-6 py-4 text-left transition hover:bg-white/5"
        >
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold">前台頁面：{title}</h2>
              <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs">
                {route}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-200">{description}</p>
          </div>
          <span className="mt-0.5 inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-100">
            {expanded ? '收合' : '展開'}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>
      </div>
      {expanded ? children : null}
    </section>
  );
};

// 消息項目編輯器
interface NewsItemEditorProps {
  item: NewsItem;
  onUpdate: (field: string, value: any) => void;
  onImageUploaded?: (url: string) => void;
}

const NewsItemEditor: React.FC<NewsItemEditorProps> = ({ item, onUpdate, onImageUploaded }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">日期</label>
        <input
          type="date"
          value={item.date}
          onChange={(e) => onUpdate('date', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={item.isNew || false}
            onChange={(e) => onUpdate('isNew', e.target.checked)}
            className="rounded"
          />
          顯示 NEW
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={item.isPinned || false}
            onChange={(e) => onUpdate('isPinned', e.target.checked)}
            className="rounded"
          />
          置頂
        </label>
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs text-gray-500 mb-1">標題</label>
        <input
          type="text"
          value={item.title}
          onChange={(e) => onUpdate('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs text-gray-500 mb-1">說明（選填）</label>
        <RichTextEditor
          value={item.description || ''}
          onChange={(content) => onUpdate('description', content)}
          onImageUploaded={onImageUploaded}
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs text-gray-500 mb-1">連結（選填）</label>
        <input
          type="url"
          value={item.link || ''}
          onChange={(e) => onUpdate('link', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          placeholder="https://..."
        />
      </div>
    </div>
  );
};

interface TrainingRecordEditorProps {
  item: TrainingRecordItem;
  onUpdate: (field: string, value: any) => void;
  onImageUploaded?: (url: string) => void;
}

const TrainingRecordEditor: React.FC<TrainingRecordEditorProps> = ({ item, onUpdate, onImageUploaded }) => {
  const detailBlocks = item.detailBlocks || [];

  const updateDetailBlock = (blockId: string, content: string) => {
    onUpdate('detailBlocks', detailBlocks.map((block) => (
      block.id === blockId ? { ...block, content } : block
    )));
  };

  const addDetailBlock = () => {
    onUpdate('detailBlocks', [...detailBlocks, createTrainingRecordDetailBlock()]);
  };

  const deleteDetailBlock = (blockId: string) => {
    onUpdate('detailBlocks', detailBlocks.filter((block) => block.id !== blockId));
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label className="block text-xs text-gray-500 mb-1">日期</label>
        <input
          type="date"
          value={item.date}
          onChange={(e) => onUpdate('date', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={item.isNew || false}
            onChange={(e) => onUpdate('isNew', e.target.checked)}
            className="rounded"
          />
          顯示 NEW
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={item.isPinned || false}
            onChange={(e) => onUpdate('isPinned', e.target.checked)}
            className="rounded"
          />
          置頂
        </label>
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs text-gray-500 mb-1">Master 標題</label>
        <input
          type="text"
          value={item.title}
          onChange={(e) => onUpdate('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs text-gray-500 mb-1">Master 摘要</label>
        <RichTextEditor
          value={item.description || ''}
          onChange={(content) => onUpdate('description', content)}
          onImageUploaded={onImageUploaded}
        />
        <p className="mt-1 text-xs text-gray-400">這一段會顯示在訓練紀錄卡片摘要，也會顯示在 detail 頁開頭。</p>
      </div>
      <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Detail 內容區塊</h4>
            <p className="mt-1 text-xs text-slate-500">前台點選卡片後會進入 detail 頁，以下內容會依序顯示，可新增多筆富文字區塊。</p>
          </div>
          <button
            type="button"
            onClick={addDetailBlock}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            新增 Detail 區塊
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {detailBlocks.length ? detailBlocks.map((block, index) => (
            <div key={block.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">內容 {index + 1}</span>
                <button
                  type="button"
                  onClick={() => deleteDetailBlock(block.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  刪除
                </button>
              </div>
              <RichTextEditor
                value={block.content}
                onChange={(content) => updateDetailBlock(block.id, content)}
                onImageUploaded={onImageUploaded}
              />
            </div>
          )) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
              尚未新增 detail 內容，請按上方「新增 Detail 區塊」。
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ThankYouSectionEditorProps {
  sectionId?: string;
  title: string;
  pageLabel?: string;
  description?: string;
  icon: React.ReactNode;
  items: ThankYouItem[];
  expanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onDelete: (itemId: string) => void;
  onUpdate: (itemId: string, field: string, value: any) => void;
  onMove: (draggedId: string, targetId: string) => void;
}

const ThankYouSectionEditor: React.FC<ThankYouSectionEditorProps> = ({
  sectionId,
  title,
  pageLabel,
  description,
  icon,
  items,
  expanded,
  onToggle,
  onAdd,
  onDelete,
  onUpdate,
  onMove
}) => {
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const groups = React.useMemo(() => {
    const grouped = new Map<string, ThankYouItem[]>();

    normalizeThankYouAdminItems(items).forEach((item) => {
      const year = item.year || '未分類';
      const bucket = grouped.get(year);
      if (bucket) {
        bucket.push(item);
      } else {
        grouped.set(year, [item]);
      }
    });

    return Array.from(grouped.entries()).map(([year, entries]) => ({ year, entries }));
  }, [items]);

  return (
    <div id={sectionId} className="bg-white rounded-xl shadow-sm overflow-hidden scroll-mt-24">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3 text-left">
          <span className="text-blue-600 self-start mt-0.5">{icon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-800">{title}</span>
              {pageLabel ? (
                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-100">
                  前台：{pageLabel}
                </span>
              ) : null}
              <span className="bg-gray-100 text-gray-600 text-sm px-2 py-0.5 rounded-full">
                {items.length} 項
              </span>
            </div>
            {description ? <p className="text-sm text-gray-500 mt-1">{description}</p> : null}
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {expanded ? (
        <div className="px-6 pb-6">
          <button
            onClick={onAdd}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-2 mb-4"
          >
            <Plus className="w-5 h-5" />
            新增項目
          </button>

          <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            載入時會依民國年度自動聚合；拖曳排序只會調整同年度內的順序，跨年度請直接修改年度欄位。
          </div>

          <div className="space-y-5">
            {groups.map((group, groupIndex) => (
              <section
                key={group.year}
                className={`overflow-hidden rounded-2xl border ${groupIndex % 2 === 0 ? 'border-sky-200 bg-sky-50/70' : 'border-amber-200 bg-amber-50/80'}`}
              >
                <div className={`flex items-center justify-between gap-3 px-4 py-3 ${groupIndex % 2 === 0 ? 'bg-sky-100/80' : 'bg-amber-100/90'}`}>
                  <div className="text-lg font-bold text-slate-800">{group.year === '未分類' ? group.year : `${group.year}年`}</div>
                  <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">{group.entries.length} 項</div>
                </div>

                <div className="space-y-3 p-4">
                  {group.entries.map((item, index) => (
                    <div
                      key={item.id}
                      className={`group relative rounded-xl border bg-white p-4 transition ${draggingItemId === item.id ? 'border-blue-300 shadow-md' : 'border-gray-200'}`}
                      draggable
                      onDragStart={() => setDraggingItemId(item.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (draggingItemId && draggingItemId !== item.id) {
                          onMove(draggingItemId, item.id);
                        }
                        setDraggingItemId(null);
                      }}
                      onDragEnd={() => setDraggingItemId(null)}
                    >
                      <button
                        onClick={() => onDelete(item.id)}
                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition"
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                        <GripVertical className="h-4 w-4 text-slate-400" />
                        拖曳調整同年度排序
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">排序 {item.sortOrder ?? '未設定'}</span>
                        <div className="ml-auto flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveThankYouItemByDirection(item.id, 'up')}
                            disabled={index === 0}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            title="往前移一格"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveThankYouItemByDirection(item.id, 'down')}
                            disabled={index === group.entries.length - 1}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            title="往後移一格"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <ThankYouItemEditor
                        item={item}
                        onUpdate={(field, value) => onUpdate(item.id, field, value)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

// 獎項編輯器
interface AwardItemEditorProps {
  item: AwardItem;
  onUpdate: (field: string, value: any) => void;
  onImageUploaded?: (url: string) => void;
}

const AwardItemEditor: React.FC<AwardItemEditorProps> = ({ item, onUpdate, onImageUploaded }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">年份</label>
        <input
          type="text"
          value={item.year}
          onChange={(e) => onUpdate('year', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">圖示</label>
        <input
          type="text"
          value={item.icon || '🏆'}
          onChange={(e) => onUpdate('icon', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-xl"
        />
      </div>
      <div></div>
      <div className="md:col-span-3">
        <label className="block text-xs text-gray-500 mb-1">獎項名稱</label>
        <input
          type="text"
          value={item.title}
          onChange={(e) => onUpdate('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <div className="md:col-span-3">
        <label className="block text-xs text-gray-500 mb-1">說明</label>
        <RichTextEditor
          value={item.description || ''}
          onChange={(content) => onUpdate('description', content)}
          onImageUploaded={onImageUploaded}
        />
      </div>
    </div>
  );
};

// 心得編輯器
interface TestimonialItemEditorProps {
  item: TestimonialItem;
  onUpdate: (field: string, value: any) => void;
}

const TestimonialItemEditor: React.FC<TestimonialItemEditorProps> = ({ item, onUpdate }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">姓名</label>
        <input
          type="text"
          value={item.author}
          onChange={(e) => onUpdate('author', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">身份</label>
        <input
          type="text"
          value={item.role || ''}
          onChange={(e) => onUpdate('role', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs text-gray-500 mb-1">心得內容</label>
        <textarea
          value={item.content}
          onChange={(e) => onUpdate('content', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          rows={3}
        />
      </div>
    </div>
  );
};

export default Admin;
