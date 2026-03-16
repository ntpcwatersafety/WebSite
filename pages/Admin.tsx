// 媒體報導編輯器
interface MediaItemEditorProps {
  item: MediaItem;
  onUpdate: (field: string, value: any) => void;
}

const MediaItemEditor: React.FC<MediaItemEditorProps> = ({ item, onUpdate }) => {
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
  Key, RefreshCw, Download, Eye
} from 'lucide-react';
import { login, logout, isAuthenticated } from '../services/adminAuth';
import { cleanupEditorImages, EditorImageAsset, getFileContent, listEditorImages, updateCmsData, uploadEditorImage, validateToken } from '../services/githubApi';
import { loadCmsData } from '../services/cmsLoader';
import { CmsCollectionKey, CmsData, CourseItem, MediaItem, NewsItem, AwardItem, TestimonialItem, GalleryItem, ThankYouItem } from '../types';
import { CmsFileShas, normalizeCmsData } from '../services/cmsData';

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

const buildRichTextEditorInit = (height: number) => {
  const minEditorHeight = Math.min(height, 160);

  return {
    language: TINYMCE_LANGUAGE,
    language_url: TINYMCE_LANGUAGE_URL,
    menubar: true,
    branding: false,
    promotion: false,
    resize: false,
    plugins: [
      'advlist autolink lists link image charmap preview anchor template',
      'searchreplace visualblocks visualchars code fullscreen autoresize',
      'insertdatetime media table paste help wordcount quickbars',
      'directionality emoticons hr nonbreaking',
      'code'
    ],
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
        }}
        onEditorChange={onChange}
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
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
// 圖片上傳工具
const handleImageUpload = (file: File, callback: (url: string) => void) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target && typeof e.target.result === 'string') {
      callback(e.target.result);
    }
  };
  reader.readAsDataURL(file);
};
// 活動剪影編輯器
interface GalleryItemEditorProps {
  item: GalleryItem;
  onUpdate: (field: string, value: any) => void;
}

const GalleryItemEditor: React.FC<GalleryItemEditorProps> = ({ item, onUpdate }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">圖片</label>
        {item.imageUrl && (
          <img src={item.imageUrl} alt="預覽" className="w-32 h-24 object-cover rounded mb-2 border" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              handleImageUpload(e.target.files[0], (url) => onUpdate('imageUrl', url));
            }
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="block text-xs text-gray-500 mb-1">標題（非必填）</label>
        <input
          type="text"
          value={item.title || ''}
          onChange={e => onUpdate('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
        <label className="block text-xs text-gray-500 mb-1 mt-2">內容描述（非必填）</label>
        <textarea
          value={item.description || ''}
          onChange={e => onUpdate('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          rows={2}
        />
        <label className="block text-xs text-gray-500 mb-1 mt-2">上架</label>
        <input
          type="checkbox"
          checked={item.isActive !== false}
          onChange={e => onUpdate('isActive', e.target.checked)}
        />
        <span className="text-xs text-gray-400">（未勾選則為下架，前台不顯示）</span>
      </div>
    </div>
  );
};


const Admin: React.FC = () => {
  const navigate = useNavigate();
  const pendingEditorImageUrlsRef = useRef<Set<string>>(new Set());
  
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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editorImages, setEditorImages] = useState<EditorImageAsset[]>([]);
  const [loadingEditorImages, setLoadingEditorImages] = useState(false);
  const [deletingEditorImages, setDeletingEditorImages] = useState(false);
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
    if (!confirm(`確定要刪除 ${selectedEditorImages.length} 張圖片嗎？`)) return;

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
  };

  const handleDeleteSingleEditorImage = async (url: string) => {
    if (!confirm('確定要刪除這張圖片嗎？')) return;

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
          setCmsData(normalizeCmsData(result.content as Partial<CmsData>));
          setCmsShas(result.shas || null);
          await loadEditorImageLibrary();
          setLoading(false);
          return;
        }
      } catch (ghErr) {
        console.warn('從後端 GitHub 代理載入失敗，回退至本地 cms/*.json', ghErr);
      }

      setCmsData(await loadCmsData());
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
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
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
    let newItem: CourseItem | NewsItem | MediaItem | AwardItem | TestimonialItem | GalleryItem | ThankYouItem;
    switch (section) {
      case 'courseItems':
        newItem = {
          id: newId,
          title: '新課程名稱',
          description: '<p>請輸入課程說明。</p>',
          schedule: '',
          location: '',
          price: '',
          features: [],
          isRecruiting: true
        };
        break;
      case 'homeNews':
      case 'trainingRecords':
        newItem = {
          id: newId,
          date: new Date().toISOString().split('T')[0],
          title: '新消息標題',
          description: '請輸入說明文字',
          isNew: true
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
        newItem = {
          id: newId,
          imageUrl: '',
          title: '',
          description: '',
          date: '',
          category: '',
          isActive: true
        };
        break;
      case 'thankYouItems':
        newItem = {
          id: newId,
          name: '請輸入姓名或單位',
          description: ''
        };
        break;
      default:
        return;
    }
    setCmsData({
      ...cmsData,
      [section]: [newItem, ...cmsData[section]]
    });
  };

  // 刪除項目
  const deleteItem = (section: CmsCollectionKey, index: number) => {
    if (!cmsData || !confirm('確定要刪除此項目嗎？')) return;
    
    const items = [...cmsData[section]];
    items.splice(index, 1);
    
    setCmsData({
      ...cmsData,
      [section]: items
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

      {/* 訊息提示 */}
      {message && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

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
                  <label className="block text-xs text-gray-500 mb-1 mt-2">活動日期（非必填）</label>
                  <input
                    type="date"
                    value={item.date || ''}
                    onChange={e => onUpdate('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <label className="block text-xs text-gray-500 mb-1 mt-2">分類（非必填）</label>
                  <input
                    type="text"
                    value={item.category || ''}
                    onChange={e => onUpdate('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="例：訓練、宣導、活動花絮"
                  />
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
                  <NewsItemEditor
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
              <SectionEditor
                sectionId="section-galleryItems"
                title="活動剪影 / 相簿內容"
                pageLabel="活動剪影 / 相簿"
                description="對應前台活動剪影頁的圖片輪播與相簿內容。"
                icon={<Eye className="w-5 h-5" />}
                items={cmsData.galleryItems || []}
                sectionKey="galleryItems"
                expanded={expandedSection === 'galleryItems'}
                onToggle={() => setExpandedSection(expandedSection === 'galleryItems' ? '' : 'galleryItems')}
                onAdd={() => addItem('galleryItems')}
                onDelete={(index) => deleteItem('galleryItems', index)}
                onUpdate={(index, field, value) => updateItemField('galleryItems', index, field, value)}
                renderItem={(item, index) => (
                  <GalleryItemEditor
                    item={item}
                    onUpdate={(field, value) => updateItemField('galleryItems', index, field, value)}
                  />
                )}
              />
            </PageGroup>

            <PageGroup
              sectionId="page-group-thankyou"
              title="感恩有您"
              route="/#/thankyou"
              description="這一組主要對應前台感恩有您頁；目前首頁下方也會同步顯示這份名單。"
            >
              <SectionEditor
                sectionId="section-thankYouItems"
                title="感恩有您 / 名單內容"
                pageLabel="感恩有您頁 / 首頁下方名單"
                description="對應前台感恩有您頁，並同步顯示於首頁下方感恩名單。"
                icon={<CheckCircle className="w-5 h-5" />}
                items={cmsData.thankYouItems || []}
                sectionKey="thankYouItems"
                expanded={expandedSection === 'thankYouItems'}
                onToggle={() => setExpandedSection(expandedSection === 'thankYouItems' ? '' : 'thankYouItems')}
                onAdd={() => addItem('thankYouItems')}
                onDelete={(index) => deleteItem('thankYouItems', index)}
                onUpdate={(index, field, value) => updateItemField('thankYouItems', index, field, value)}
                renderItem={(item, index) => (
                  <ThankYouItemEditor
                    item={item}
                    onUpdate={(field, value) => updateItemField('thankYouItems', index, field, value)}
                  />
                )}
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
  renderItem
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

const PageGroup: React.FC<PageGroupProps> = ({ sectionId, title, route, description, children }) => (
  <section id={sectionId} className="space-y-4 scroll-mt-24">
    <div className="bg-slate-800 text-white rounded-xl px-6 py-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold">前台頁面：{title}</h2>
        <span className="bg-white/10 border border-white/10 text-xs px-2 py-0.5 rounded-full">
          {route}
        </span>
      </div>
      <p className="text-sm text-slate-200 mt-2">{description}</p>
    </div>
    {children}
  </section>
);

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
