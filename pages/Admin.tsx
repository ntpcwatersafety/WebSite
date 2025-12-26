import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { useNavigate } from 'react-router-dom';
import { 
  LogIn, LogOut, Save, Plus, Trash2, Edit3, 
  Settings, Home, Newspaper, Award, MessageSquare,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle,
  Key, RefreshCw, Download, Eye
} from 'lucide-react';
import { login, logout, isAuthenticated } from '../services/adminAuth';
import { 
  saveGitHubToken, 
  getGitHubToken, 
  hasGitHubToken, 
  removeGitHubToken,
  getFileContent,
  updateCmsData,
  validateToken
} from '../services/githubApi';
import { NewsItem, AwardItem, TestimonialItem, GalleryItem } from '../types';

// CMS 資料結構
interface CmsData {
  lastUpdated: string;
  homeNews: NewsItem[];
  mediaReports: any[];
  awards: AwardItem[];
  testimonials: TestimonialItem[];
  trainingRecords: NewsItem[];
  galleryItems: GalleryItem[];
}
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
  
  // 登入狀態
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // GitHub Token
  const [showTokenSetup, setShowTokenSetup] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  
  // 資料狀態
  const [cmsData, setCmsData] = useState<CmsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // 展開的區塊
  const [expandedSection, setExpandedSection] = useState<string>('homeNews');
  
  // 編輯中的項目
  const [editingItem, setEditingItem] = useState<{ section: string; index: number } | null>(null);

  // 檢查登入狀態
  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  // 載入資料
  useEffect(() => {
    if (authenticated && hasGitHubToken()) {
      loadData();
      checkToken();
    }
  }, [authenticated]);

  const checkToken = async () => {
    const valid = await validateToken();
    setTokenValid(valid);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 嘗試從 GitHub 載入
      if (hasGitHubToken()) {
        const result = await getFileContent();
        if (result) {
          // galleryItems 預設為空陣列
          setCmsData({
            ...result.content,
            galleryItems: Array.isArray(result.content.galleryItems) ? result.content.galleryItems : []
          });
          setLoading(false);
          return;
        }
      }
      
      // 否則從本地載入
      const response = await fetch(`${import.meta.env.BASE_URL}cms-data.json`);
      if (response.ok) {
        const data = await response.json();
        setCmsData({
          ...data,
          galleryItems: Array.isArray(data.galleryItems) ? data.galleryItems : []
        });
      }
    } catch (error) {
      console.error('載入資料失敗:', error);
      showMessage('error', '載入資料失敗');
    }
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      setAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('帳號或密碼錯誤');
    }
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    setCmsData(null);
  };

  const handleSaveToken = () => {
    if (githubToken.trim()) {
      saveGitHubToken(githubToken.trim());
      setGithubToken('');
      setShowTokenSetup(false);
      showMessage('success', 'GitHub Token 已儲存');
      loadData();
      checkToken();
    }
  };

  const handleRemoveToken = () => {
    removeGitHubToken();
    setTokenValid(null);
    showMessage('success', 'GitHub Token 已移除');
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    if (!cmsData) return;
    
    setSaving(true);
    try {
      await updateCmsData(cmsData, `📝 管理員更新網站內容 - ${new Date().toLocaleString('zh-TW')}`);
      showMessage('success', '儲存成功！網站將在 1-2 分鐘內更新');
    } catch (error: any) {
      showMessage('error', error.message || '儲存失敗');
    }
    setSaving(false);
  };

  // 下載 JSON 檔案（本地預覽用）
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
    a.download = 'cms-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('success', '已下載 cms-data.json，請放到 public/ 資料夾');
  };

  // 新增項目
  const addItem = (section: keyof CmsData) => {
    if (!cmsData) return;
    const newId = `${section}-${Date.now()}`;
    let newItem: any;
    switch (section) {
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
          isActive: true
        };
        break;
      default:
        return;
    }
    setCmsData({
      ...cmsData,
      [section]: [newItem, ...(cmsData[section] as any[])]
    });
  };

  // 刪除項目
  const deleteItem = (section: keyof CmsData, index: number) => {
    if (!cmsData || !confirm('確定要刪除此項目嗎？')) return;
    
    const items = [...(cmsData[section] as any[])];
    items.splice(index, 1);
    
    setCmsData({
      ...cmsData,
      [section]: items
    });
  };

  // 更新項目欄位
  const updateItemField = (section: keyof CmsData, index: number, field: string, value: any) => {
    if (!cmsData) return;
    
    const items = [...(cmsData[section] as any[])];
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
            {/* Token 狀態 */}
            {hasGitHubToken() && (
              <span className={`flex items-center gap-1 text-sm ${tokenValid ? 'text-green-600' : 'text-yellow-600'}`}>
                <Key className="w-4 h-4" />
                {tokenValid ? 'Token 有效' : '檢查中...'}
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
            
            {/* 儲存按鈕 */}
            <button
              onClick={handleSave}
              disabled={saving || !hasGitHubToken()}
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
              GitHub Token 設定
            </h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                <p className="font-medium mb-2">如何取得 GitHub Token：</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>前往 GitHub → Settings → Developer settings</li>
                  <li>選擇 Personal access tokens → Tokens (classic)</li>
                  <li>點擊 Generate new token</li>
                  <li>勾選 <code className="bg-blue-100 px-1">repo</code> 權限</li>
                  <li>複製產生的 Token 貼到下方</li>
                </ol>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Personal Access Token
                </label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="ghp_xxxxxxxxxxxx"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleSaveToken}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  儲存 Token
                </button>
                {hasGitHubToken() && (
                  <button
                    onClick={handleRemoveToken}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    移除
                  </button>
                )}
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
        {!hasGitHubToken() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">請先設定 GitHub Token</p>
              <p className="text-sm text-yellow-700 mt-1">
                需要設定 Token 才能將修改發布到網站。
                <button 
                  onClick={() => setShowTokenSetup(true)}
                  className="underline ml-1"
                >
                  點此設定
                </button>
              </p>
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
            {/* 活動剪影管理 */}
            <SectionEditor
              title="活動剪影"
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
            {/* 首頁最新消息 */}
            <SectionEditor
              title="首頁最新消息"
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
                />
              )}
            />

            {/* 獲獎紀錄 */}
            <SectionEditor
              title="獲獎紀錄"
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
                />
              )}
            />

            {/* 學員心得 */}
            <SectionEditor
              title="學員心得"
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

            {/* 訓練紀錄 */}
            <SectionEditor
              title="訓練紀錄"
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
                />
              )}
            />
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
  title: string;
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
  title,
  icon,
  items,
  expanded,
  onToggle,
  onAdd,
  onDelete,
  renderItem
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-blue-600">{icon}</span>
          <span className="font-bold text-gray-800">{title}</span>
          <span className="bg-gray-100 text-gray-600 text-sm px-2 py-0.5 rounded-full">
            {items.length} 項
          </span>
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

// 消息項目編輯器
interface NewsItemEditorProps {
  item: NewsItem;
  onUpdate: (field: string, value: any) => void;
}

const NewsItemEditor: React.FC<NewsItemEditorProps> = ({ item, onUpdate }) => {
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
        <Editor
          apiKey="r5if44rv4x9bo1fan9i5rj3wyy782zuqkqd4lkhkomddqngo"
          value={item.description || ''}
          init={{
            height: 240,
            menubar: true,
            plugins: [
              'advlist autolink lists link charmap preview anchor',
              'searchreplace visualblocks code',
              'insertdatetime table paste help wordcount',
              'code',
              'textcolor',
              'colorpicker'
            ],
            toolbar:
              'undo redo | formatselect | fontselect fontsizeselect | bold italic underline forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | code | removeformat | help',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:15px }'
          }}
          onEditorChange={(content) => onUpdate('description', content)}
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
}

const AwardItemEditor: React.FC<AwardItemEditorProps> = ({ item, onUpdate }) => {
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
        <Editor
          apiKey="r5if44rv4x9bo1fan9i5rj3wyy782zuqkqd4lkhkomddqngo"
          value={item.description || ''}
          init={{
            height: 240,
            menubar: true,
            plugins: [
              'advlist autolink lists link charmap preview anchor',
              'searchreplace visualblocks code',
              'insertdatetime table paste help wordcount',
              'code',
              'textcolor',
              'colorpicker'
            ],
            toolbar:
              'undo redo | formatselect | fontselect fontsizeselect | bold italic underline forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | code | removeformat | help',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:15px }'
          }}
          onEditorChange={(content) => onUpdate('description', content)}
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
