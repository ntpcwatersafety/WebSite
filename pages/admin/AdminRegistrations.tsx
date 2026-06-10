import React, { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, Search, Filter, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { ActivityRegistrationFormData, ActivityRegistrationRecord } from '../../types';
import {
  ACTIVITY_REGISTRATION_LABELS,
  buildActivityRegistrationInitialForm,
  createActivityRegistration,
  deleteActivityRegistration,
  downloadActivityRegistrationsXlsx,
  getActivityRegistrations,
  updateActivityRegistration,
  validateActivityRegistration,
} from '../../services/activityRegistration';
import { getActivityGalleryItems } from '../../services/cmsLoader';
import { useToast } from '../../contexts/ToastContext';
import ActivityRegistrationFormFields, { RegistrationActivityOption } from '../../components/ActivityRegistrationFormFields';

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-TW');
};

const AdminRegistrations: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<ActivityRegistrationRecord[]>([]);
  const [activityChoices, setActivityChoices] = useState<RegistrationActivityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('all');
  const [editorMode, setEditorMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ActivityRegistrationFormData | null>(null);

  const loadActivityChoices = async () => {
    try {
      const activityItems = await getActivityGalleryItems();
      const options = activityItems
        .map((item) => ({ id: item.id, title: item.title.trim() }))
        .filter((item) => item.id && item.title);
      setActivityChoices(options);
    } catch (error) {
      console.error(error);
      showToast('載入活動清單失敗', 'error');
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getActivityRegistrations();
      setItems(data);
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || '載入報名資料失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
    void loadActivityChoices();
  }, []);

  const filteredItems = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    return items.filter((item) => {
      const matchesActivity = selectedActivity === 'all' || item.activityId === selectedActivity;
      if (!matchesActivity) return false;

      if (!key) return true;

      return [
      item.activityTitle,
      item.name,
      item.email,
      item.phone,
      item.emergencyContactName,
      item.emergencyContactPhone,
      item.notes || '',
      ].join(' ').toLowerCase().includes(key);
    });
  }, [items, keyword, selectedActivity]);

  const activityOptions = useMemo(() => {
    const seen = new Set<string>();
    return items
      .filter((item) => {
        if (seen.has(item.activityId)) return false;
        seen.add(item.activityId);
        return true;
      })
      .map((item) => ({ id: item.activityId, title: item.activityTitle }));
  }, [items]);

  const editorActivityOptions = useMemo(() => {
    const map = new Map<string, string>();

    activityChoices.forEach((item) => {
      if (!item.id || !item.title) return;
      map.set(item.id, item.title);
    });

    activityOptions.forEach((item) => {
      if (!item.id || !item.title) return;
      if (!map.has(item.id)) map.set(item.id, item.title);
    });

    if (draft?.activityId && draft.activityTitle && !map.has(draft.activityId)) {
      map.set(draft.activityId, draft.activityTitle);
    }

    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [activityChoices, activityOptions, draft]);

  const startAdd = () => {
    const defaultActivity = editorActivityOptions[0];
    setEditorMode('add');
    setEditingId(null);
    setDraft(buildActivityRegistrationInitialForm(defaultActivity?.id || '', defaultActivity?.title || ''));
  };

  const startEdit = (item: ActivityRegistrationRecord) => {
    setEditorMode('edit');
    setEditingId(item.id);
    setDraft({
      activityId: item.activityId,
      activityTitle: item.activityTitle,
      name: item.name,
      email: item.email,
      gender: item.gender,
      birthDate: item.birthDate,
      identity: item.identity,
      phone: item.phone,
      emergencyContactName: item.emergencyContactName,
      emergencyContactPhone: item.emergencyContactPhone,
      referralSource: item.referralSource,
      referralSourceOther: item.referralSourceOther || '',
      notes: item.notes || '',
    });
  };

  const closeEditor = () => {
    setEditorMode(null);
    setEditingId(null);
    setDraft(null);
  };

  const updateDraftField = <K extends keyof ActivityRegistrationFormData>(field: K, value: ActivityRegistrationFormData[K]) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;

    const validationError = validateActivityRegistration(draft);
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    setSaving(true);
    try {
      if (editorMode === 'edit' && editingId) {
        await updateActivityRegistration(editingId, draft);
        showToast('報名資料已更新', 'success');
      } else {
        await createActivityRegistration(draft);
        showToast('報名資料已新增', 'success');
      }
      closeEditor();
      await loadItems();
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || '保存報名資料失敗', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ActivityRegistrationRecord) => {
    if (!window.confirm(`確定刪除 ${item.name} 的報名紀錄？`)) return;

    setDeletingId(item.id);
    try {
      await deleteActivityRegistration(item.id);
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
      if (editingId === item.id) closeEditor();
      showToast('報名紀錄已刪除', 'success');
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || '刪除報名紀錄失敗', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    if (filteredItems.length === 0) {
      showToast('沒有可匯出的資料', 'error');
      return;
    }

    downloadActivityRegistrationsXlsx(filteredItems);
    showToast(`已匯出 ${filteredItems.length} 筆報名資料`, 'success');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">報名管理</h2>
          <p className="text-sm text-gray-500 mt-1">查看、建立、編輯與刪除活動報名資料，支援依活動篩選並下載 .xlsx 檔。</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={startAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            新增報名
          </button>
          <button
            onClick={() => void loadItems()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            重新整理
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Download size={16} />
            下載 Excel
          </button>
        </div>
      </div>

      {editorMode && draft ? (
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <h3 className="text-lg font-semibold text-gray-900">{editorMode === 'add' ? '新增報名紀錄' : '編輯報名紀錄'}</h3>
            <button
              type="button"
              onClick={closeEditor}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <X size={14} />
              關閉
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSave}>
            <ActivityRegistrationFormFields
              formData={draft}
              onChange={updateDraftField}
              activityOptions={editorActivityOptions}
              showActivitySelect
              namePrefix={`admin-${editorMode}-${editingId || 'new'}`}
            />

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white ${saving ? 'bg-slate-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500'}`}
              >
                <Save size={14} />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div>
          <label className="text-sm text-gray-600 flex items-center gap-2">
            <Filter size={16} />
            依活動篩選
          </label>
          <div className="mt-2">
            <select
              value={selectedActivity}
              onChange={(event) => setSelectedActivity(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="all">全部活動</option>
              {activityOptions.map((activity) => (
                <option key={activity.id} value={activity.id}>{activity.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600">搜尋（姓名、Email、電話）</label>
          <div className="mt-2 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="輸入關鍵字"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 text-sm text-gray-600">
          共 {filteredItems.length} 筆
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">載入中...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-10 text-center text-gray-500">尚無報名資料</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left">報名時間</th>
                  <th className="px-3 py-2 text-left">活動</th>
                  <th className="px-3 py-2 text-left">姓名</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">性別</th>
                  <th className="px-3 py-2 text-left">出生日期</th>
                  <th className="px-3 py-2 text-left">身分別</th>
                  <th className="px-3 py-2 text-left">手機</th>
                  <th className="px-3 py-2 text-left">緊急聯絡人</th>
                  <th className="px-3 py-2 text-left">緊急聯絡人手機</th>
                  <th className="px-3 py-2 text-left">來源</th>
                  <th className="px-3 py-2 text-left">備註</th>
                  <th className="px-3 py-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}>
                    <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(item.createdAt)}</td>
                    <td className="px-3 py-2">{item.activityTitle}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.email}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{ACTIVITY_REGISTRATION_LABELS.gender[item.gender]}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.birthDate}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{ACTIVITY_REGISTRATION_LABELS.identity[item.identity]}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.phone}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.emergencyContactName}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{item.emergencyContactPhone}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {ACTIVITY_REGISTRATION_LABELS.referral[item.referralSource]}
                      {item.referralSource === 'other' && item.referralSourceOther ? ` (${item.referralSourceOther})` : ''}
                    </td>
                    <td className="px-3 py-2">{item.notes || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(item)}
                          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-white hover:bg-blue-700"
                          title="編輯"
                        >
                          <Pencil size={12} />
                          編輯
                        </button>
                        <button
                          onClick={() => void handleDelete(item)}
                          disabled={deletingId === item.id}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-white ${deletingId === item.id ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                          title="刪除"
                        >
                          <Trash2 size={12} />
                          {deletingId === item.id ? '刪除中' : '刪除'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRegistrations;
