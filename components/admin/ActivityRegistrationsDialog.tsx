import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Filter, Pencil, Plus, RefreshCw, Save, Search, Trash2, X } from 'lucide-react';
import { ActivityRegistrationFormData, ActivityRegistrationRecord, GalleryItem } from '../../types';
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
import { useToast } from '../../contexts/ToastContext';
import ActivityRegistrationFormFields from '../ActivityRegistrationFormFields';

interface ActivityRegistrationsDialogProps {
  activity: GalleryItem;
  isOpen: boolean;
  openMode: 'list' | 'add';
  onClose: () => void;
  onChanged?: () => Promise<void> | void;
}

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-TW');
};

const ActivityRegistrationsDialog: React.FC<ActivityRegistrationsDialogProps> = ({
  activity,
  isOpen,
  openMode,
  onClose,
  onChanged,
}) => {
  const { showToast } = useToast();
  const [items, setItems] = useState<ActivityRegistrationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [editorMode, setEditorMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ActivityRegistrationFormData | null>(null);

  const loadItems = async () => {
    if (!isOpen) return;

    setLoading(true);
    try {
      const allRecords = await getActivityRegistrations();
      setItems(allRecords.filter((entry) => entry.activityId === activity.id));
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || '載入報名資料失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setKeyword('');
    setEditingId(null);
    setDraft(null);
    setEditorMode(openMode === 'add' ? 'add' : null);
    if (openMode === 'add') {
      setDraft(buildActivityRegistrationInitialForm(activity.id, activity.title));
    }
    void loadItems();
  }, [isOpen, activity.id, activity.title, openMode]);

  const filteredItems = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    if (!key) return items;

    return items.filter((item) => [
      item.name,
      item.email,
      item.phone,
      item.emergencyContactName,
      item.emergencyContactPhone,
      (item.selectedPeriods || []).join(' '),
      item.notes || '',
    ].join(' ').toLowerCase().includes(key));
  }, [items, keyword]);

  const startAdd = () => {
    setEditorMode('add');
    setEditingId(null);
    setDraft(buildActivityRegistrationInitialForm(activity.id, activity.title));
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
      selectedPeriods: [...(item.selectedPeriods || [])],
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

    const validationError = validateActivityRegistration(draft, activity.periodOptions || []);
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
      if (onChanged) await onChanged();
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
      if (onChanged) await onChanged();
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

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[75] bg-black/55 px-4 py-6" onClick={onClose}>
      <div
        className="mx-auto max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="活動報名管理"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{activity.title} - 報名紀錄</h3>
            <p className="mt-1 text-sm text-gray-500">可新增、編輯、刪除報名資料，並下載 Excel。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="關閉"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
              <Filter size={15} />
              僅顯示此活動報名資料
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={startAdd}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                <Plus size={16} />
                新增紀錄
              </button>
              <button
                onClick={() => void loadItems()}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw size={16} />
                重新整理
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
              >
                <Download size={16} />
                下載 Excel
              </button>
            </div>
          </div>

          {editorMode && draft ? (
            <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <h4 className="text-lg font-semibold text-gray-900">{editorMode === 'add' ? '新增報名紀錄' : '編輯報名紀錄'}</h4>
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
                  periodOptions={activity.periodOptions || []}
                  showActivitySelect={false}
                  namePrefix={`admin-activity-${editorMode}-${editingId || 'new'}`}
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
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white ${saving ? 'cursor-not-allowed bg-slate-400' : 'bg-cyan-600 hover:bg-cyan-500'}`}
                  >
                    <Save size={14} />
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <label className="text-sm text-gray-600">搜尋（姓名、Email、電話）</label>
            <div className="mt-2 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="輸入關鍵字"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 text-sm text-gray-600">共 {filteredItems.length} 筆</div>

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
                      <th className="px-3 py-2 text-left">姓名</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">性別</th>
                      <th className="px-3 py-2 text-left">出生日期</th>
                      <th className="px-3 py-2 text-left">期數</th>
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
                        <td className="px-3 py-2 whitespace-nowrap">{item.name}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.email}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{ACTIVITY_REGISTRATION_LABELS.gender[item.gender]}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.birthDate}</td>
                        <td className="px-3 py-2">{item.selectedPeriods.length > 0 ? item.selectedPeriods.join('、') : '-'}</td>
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
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-white ${deletingId === item.id ? 'cursor-not-allowed bg-red-300' : 'bg-red-600 hover:bg-red-700'}`}
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
      </div>
    </div>,
    document.body
  );
};

export default ActivityRegistrationsDialog;