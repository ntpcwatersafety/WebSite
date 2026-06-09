import React, { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, Search, Filter } from 'lucide-react';
import { ActivityRegistrationRecord } from '../../types';
import {
  ACTIVITY_REGISTRATION_LABELS,
  downloadActivityRegistrationsXlsx,
  getActivityRegistrations,
} from '../../services/activityRegistration';
import { useToast } from '../../contexts/ToastContext';

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-TW');
};

const AdminRegistrations: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<ActivityRegistrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('all');

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
          <p className="text-sm text-gray-500 mt-1">查看活動報名資料，支援依活動篩選並下載 .xlsx 檔。</p>
        </div>

        <div className="flex items-center gap-2">
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
