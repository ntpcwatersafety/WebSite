import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import { getIntroContent } from '../../services/cmsLoader';
import { updateIntroContent, uploadEditorImage } from '../../services/supabaseAdmin';

interface AdminIntroProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AdminIntro: React.FC<AdminIntroProps> = ({ onShowToast }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const intro = await getIntroContent();
      setContent(intro);
    } catch (error) {
      onShowToast('載入協會簡介失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateIntroContent(content);
      onShowToast('協會簡介已保存', 'success');
    } catch (error) {
      onShowToast('保存失敗', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (
    blobInfo: any,
    success: (url: string) => void,
    failure: (error: string) => void
  ) => {
    try {
      const file = blobInfo.blob();
      const url = await uploadEditorImage(file);
      success(url);
    } catch (error) {
      failure('圖片上傳失敗');
    }
  };

  if (loading) {
    return <div className="text-center py-8">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">協會簡介</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <Editor
          apiKey="r5if44rv4x9bo1fan9i5rj3wyy782zuqkqd4lkhkomddqngo"
          value={content}
          onEditorChange={setContent}
          init={{
            height: 500,
            menubar: 'file edit view insert format tools table help',
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
            ],
            toolbar:
              'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | code',
            image_upload_handler: handleImageUpload,
            language: 'zh_TW',
          }}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
        <p>使用編輯器編輯協會簡介。支援文字格式、圖片上傳等功能。保存後立即在前台顯示。</p>
      </div>
    </div>
  );
};

export default AdminIntro;
