import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle, Save, Mail } from 'lucide-react';
import { MailTemplate } from '../../types';
import {
  MAIL_MERGE_FIELDS,
  createMailTemplate,
  deleteMailTemplate,
  getMailTemplates,
  updateMailTemplate,
} from '../../services/mailTemplate';
import { useToast } from '../../contexts/ToastContext';

type EditorMode = 'add' | 'edit' | null;

interface TemplateDraft {
  name: string;
  subject: string;
  content: string;
}

const emptyDraft: TemplateDraft = { name: '', subject: '', content: '' };

interface TemplateFormProps {
  mode: Exclude<EditorMode, null>;
  draft: TemplateDraft;
  onChange: (next: TemplateDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ mode, draft, onChange, onCancel, onSave }) => (
  <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-4">
    <div className="text-sm font-medium text-gray-700">
      {mode === 'add' ? '新增樣版' : '編輯樣版'}
    </div>

    <div>
      <label className="block text-xs text-gray-500 mb-1">樣版名稱</label>
      <input
        type="text"
        value={draft.name}
        onChange={(event) => onChange({ ...draft, name: event.target.value })}
        placeholder="例如：報名成功通知"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
    </div>

    <div>
      <label className="block text-xs text-gray-500 mb-1">主旨</label>
      <input
        type="text"
        value={draft.subject}
        onChange={(event) => onChange({ ...draft, subject: event.target.value })}
        placeholder="例如：{{Activity}} 報名成功通知"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
    </div>

    <div>
      <label className="block text-xs text-gray-500 mb-1">內文</label>
      <textarea
        rows={8}
        value={draft.content}
        onChange={(event) => onChange({ ...draft, content: event.target.value })}
        placeholder={'{{Name}} 您好，\n\n感謝您報名「{{Activity}}」，我們已收到您的報名資料。'}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
    </div>

    <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600">
      可用參數（會自動替換成報名者的資料）：
      <div className="mt-1 flex flex-wrap gap-2">
        {MAIL_MERGE_FIELDS.map((field) => (
          <code key={field.key} className="px-1.5 py-0.5 rounded bg-white border border-gray-200">
            {`{{${field.key}}}`} {field.label}
          </code>
        ))}
      </div>
    </div>

    <div className="flex justify-end gap-2">
      <button
        onClick={onCancel}
        className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
      >
        取消
      </button>
      <button
        onClick={onSave}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <Save size={16} />
        保存
      </button>
    </div>
  </div>
);

const AdminMailTemplates: React.FC = () => {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TemplateDraft>(emptyDraft);

  useEffect(() => {
    void loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getMailTemplates();
      setTemplates(data);
    } catch {
      showToast('載入信件樣版失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startAdd = () => {
    setEditorMode('add');
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const startEdit = (item: MailTemplate) => {
    setEditorMode('edit');
    setEditingId(item.id);
    setDraft({ name: item.name, subject: item.subject, content: item.content });
  };

  const cancelEdit = () => {
    setEditorMode(null);
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      showToast('請輸入樣版名稱', 'error');
      return;
    }
    if (!draft.subject.trim()) {
      showToast('請輸入主旨', 'error');
      return;
    }
    if (!draft.content.trim()) {
      showToast('請輸入內文', 'error');
      return;
    }

    try {
      if (editorMode === 'add') {
        await createMailTemplate(draft);
        showToast('樣版已新增', 'success');
      } else if (editorMode === 'edit' && editingId) {
        await updateMailTemplate(editingId, draft);
        showToast('樣版已更新', 'success');
      }

      await loadTemplates();
      cancelEdit();
    } catch {
      showToast(editorMode === 'add' ? '新增失敗' : '更新失敗', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('確定要刪除此樣版嗎？')) return;
    try {
      await deleteMailTemplate(id);
      setTemplates((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) cancelEdit();
      showToast('樣版已刪除', 'success');
    } catch {
      showToast('刪除失敗', 'error');
    }
  };

  if (loading) return <div className="text-center py-8">載入中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">信件樣版</h2>
        <button
          onClick={startAdd}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={18} />
          新增樣版
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 text-sm text-gray-600">
          共 {templates.length} 個樣版
        </div>

        {templates.length === 0 ? (
          <div className="p-8 text-center text-gray-600">尚無信件樣版</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {templates.map((item) => (
              <li key={item.id} className={`px-4 py-3 ${editingId === item.id ? 'bg-blue-50' : 'bg-white'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="mt-1 text-xs text-gray-500 truncate">主旨：{item.subject}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(item)}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editorMode && (
        <TemplateForm
          mode={editorMode}
          draft={draft}
          onChange={setDraft}
          onCancel={cancelEdit}
          onSave={handleSave}
        />
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <Mail size={18} className="mt-0.5 flex-shrink-0" />
        <p>樣版可在「報名資訊」的報名紀錄列表中，透過「寄信」功能選用，並可在寄送前自行調整收件者、主旨及內文。</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700 flex items-start gap-3">
        <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
        <p>若尚未設定資料表或 EmailJS 樣版，請參考 docs/MAIL_TEMPLATES_SQL.md 完成設定。</p>
      </div>
    </div>
  );
};

export default AdminMailTemplates;
