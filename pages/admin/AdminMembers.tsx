import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Plus, Pencil, Trash2, Save, X, Download, Upload,
  RefreshCw, Search, FileSpreadsheet,
} from 'lucide-react';
import { MemberIdentity, MemberProfile } from '../../types';
import {
  adminCreateMember,
  adminDeleteMember,
  adminUpdateMember,
  getAllMembers,
} from '../../services/memberService';
import MemberDatePicker from '../../components/MemberDatePicker';
import { TAIWAN_DISTRICTS } from '../../services/memberService';
import { useToast } from '../../contexts/ToastContext';

// ── 常數對照 ──────────────────────────────────────────────────
const IDENTITY_LABEL: Record<MemberIdentity, string> = {
  coach:  '教練',
  team:   '隊員',
  member: '會員',
  new:    '新入會',
};

const IDENTITY_OPTIONS: { value: MemberIdentity; label: string }[] = [
  { value: 'coach',  label: '教練' },
  { value: 'team',   label: '隊員（具有本會救生員證）' },
  { value: 'member', label: '會員（尚未具有本會救生員證）' },
  { value: 'new',    label: '新入會（首次繳交入會費及會員費）' },
];

const IDENTITY_FROM_LABEL: Record<string, MemberIdentity> = {
  '教練': 'coach', '隊員': 'team', '會員': 'member', '新入會': 'new',
};

const EXCEL_HEADERS = [
  'Email', '姓名', '行動電話', '縣市', '區域', '詳細地址',
  '身分證字號', '生日(民國)', '身分', '教練證年份(民國)',
  '緊急聯絡人', '緊急聯絡人電話', '關係', '本年度紀念品', '紀念品領取日期(民國)',
];

const RELATION_OPTIONS = ['父母', '配偶', '子女', '兄弟姊妹', '朋友', '同事', '其他'];

// ── 空白 form ─────────────────────────────────────────────────
const emptyProfile = (): MemberProfile => ({
  email: '', name: '', phone: '',
  addressCounty: '', addressDistrict: '', addressDetail: '',
  idNumber: '', birthDate: '', identity: 'member', coachCertYear: '',
  emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
  souvenirReceived: false, souvenirReceiveDate: '',
});

// ── Excel 範本下載 ────────────────────────────────────────────
const downloadTemplate = () => {
  const exampleRow = [
    'example@email.com', '王小明', '0912345678', '新北市', '板橋區', '中山路一段1號',
    'A123456789', '800101', '會員', '',
    '王大明', '0987654321', '父母', '未領取', '',
  ];
  const ws = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS, exampleRow]);
  ws['!cols'] = EXCEL_HEADERS.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '會員資料');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a'); a.href = url; a.download = '會員資料匯入範本.xlsx';
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};

// ── Excel 匯出 ────────────────────────────────────────────────
const exportToExcel = (members: MemberProfile[]) => {
  const rows = members.map(m => [
    m.email, m.name, m.phone,
    m.addressCounty, m.addressDistrict, m.addressDetail,
    m.idNumber, m.birthDate,
    IDENTITY_LABEL[m.identity] || m.identity,
    m.coachCertYear,
    m.emergencyContactName, m.emergencyContactPhone, m.emergencyContactRelation,
    m.souvenirReceived ? '已領取' : '未領取',
    m.souvenirReceiveDate,
  ]);
  const ws = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS, ...rows]);
  ws['!cols'] = EXCEL_HEADERS.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '會員資料');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const dateTag = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a'); a.href = url; a.download = `會員資料_${dateTag}.xlsx`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};

// ── row → MemberProfile ───────────────────────────────────────
const rowToImportProfile = (row: any[]): MemberProfile => ({
  email: String(row[0] || '').trim().toLowerCase(),
  name: String(row[1] || '').trim(),
  phone: String(row[2] || '').trim(),
  addressCounty: String(row[3] || '').trim(),
  addressDistrict: String(row[4] || '').trim(),
  addressDetail: String(row[5] || '').trim(),
  idNumber: String(row[6] || '').trim().toUpperCase(),
  birthDate: String(row[7] || '').trim().replace(/\D/g, ''),
  identity: IDENTITY_FROM_LABEL[String(row[8] || '').trim()] || 'member',
  coachCertYear: String(row[9] || '').trim().replace(/\D/g, ''),
  emergencyContactName: String(row[10] || '').trim(),
  emergencyContactPhone: String(row[11] || '').trim().replace(/\D/g, ''),
  emergencyContactRelation: String(row[12] || '').trim(),
  souvenirReceived: String(row[13] || '').trim() === '已領取',
  souvenirReceiveDate: String(row[14] || '').trim().replace(/\D/g, ''),
});

// ── 主元件 ────────────────────────────────────────────────────
const AdminMembers: React.FC = () => {
  const { showToast } = useToast();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [editorMode, setEditorMode] = useState<'add' | 'edit' | null>(null);
  const [draft, setDraft] = useState<MemberProfile>(emptyProfile());
  const [initPassword, setInitPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMembers(await getAllMembers());
    } catch (err: any) {
      showToast(err.message || '載入失敗', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = members.filter(m => {
    if (!keyword) return true;
    const kw = keyword.toLowerCase();
    return (
      m.name.toLowerCase().includes(kw) ||
      m.email.toLowerCase().includes(kw) ||
      m.phone.includes(kw) ||
      m.idNumber.toLowerCase().includes(kw)
    );
  });

  const setField = <K extends keyof MemberProfile>(k: K, v: MemberProfile[K]) =>
    setDraft(prev => ({ ...prev, [k]: v }));

  const openAdd = () => {
    setDraft(emptyProfile());
    setInitPassword('');
    setEditorMode('add');
  };

  const openEdit = (m: MemberProfile) => {
    setDraft({ ...m });
    setInitPassword('');
    setEditorMode('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.email.trim()) { showToast('請填寫 Email', 'error'); return; }
    if (!draft.name.trim()) { showToast('請填寫姓名', 'error'); return; }
    setSaving(true);
    try {
      if (editorMode === 'add') {
        const pwd = initPassword.trim() || Math.random().toString(36).slice(2, 10);
        await adminCreateMember(draft, pwd);
        showToast('會員已新增', 'success');
      } else {
        await adminUpdateMember(draft.id!, draft);
        showToast('會員資料已更新', 'success');
      }
      setEditorMode(null);
      load();
    } catch (err: any) {
      showToast(err.message || '儲存失敗', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`確定要刪除會員「${name}」？此操作無法復原。`)) return;
    setDeletingId(id);
    try {
      await adminDeleteMember(id);
      setMembers(prev => prev.filter(m => m.id !== id));
      showToast('會員已刪除', 'success');
    } catch (err: any) {
      showToast(err.message || '刪除失敗', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const dataRows = rows.slice(1).filter(r => r.some(c => c !== '' && c != null));

      let created = 0; let updated = 0; let errors = 0;
      for (const row of dataRows) {
        const profile = rowToImportProfile(row);
        if (!profile.email || !profile.name) { errors++; continue; }
        try {
          const existing = members.find(m => m.email === profile.email);
          if (existing?.id) {
            await adminUpdateMember(existing.id, profile);
            updated++;
          } else {
            const pwd = Math.random().toString(36).slice(2, 10);
            await adminCreateMember(profile, pwd);
            created++;
          }
        } catch { errors++; }
      }
      showToast(`匯入完成：新增 ${created} 筆、更新 ${updated} 筆${errors ? `、失敗 ${errors} 筆` : ''}`, errors ? 'error' : 'success');
      load();
    } catch (err: any) {
      showToast(err.message || '匯入失敗', 'error');
    } finally {
      setImporting(false);
    }
  };

  const districts = draft.addressCounty ? (TAIWAN_DISTRICTS[draft.addressCounty] || []) : [];
  const inputCls = 'w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-100';

  return (
    <div>
      {/* ── 標題列 ────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-gray-800">會員管理</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            <FileSpreadsheet size={15} />範本下載
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            <Upload size={15} />{importing ? '匯入中...' : 'Excel 匯入'}
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          <button onClick={() => exportToExcel(filtered)} disabled={filtered.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            <Download size={15} />Excel 匯出
          </button>
          <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            <RefreshCw size={15} />重新整理
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
            <Plus size={15} />新增會員
          </button>
        </div>
      </div>

      {/* ── 搜尋 ──────────────────────────────── */}
      <div className="relative mb-4 max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={keyword} onChange={e => setKeyword(e.target.value)}
          placeholder="搜尋姓名、Email、電話…"
          className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-cyan-500" />
      </div>

      {/* ── 新增/編輯表單 ─────────────────────── */}
      {editorMode && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-blue-800">{editorMode === 'add' ? '新增會員' : '編輯會員'}</h3>
            <button onClick={() => setEditorMode(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <form onSubmit={handleSave}>
            <div className="grid gap-3 md:grid-cols-3">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Email *</label>
                <input required type="email" value={draft.email}
                  readOnly={editorMode === 'edit'}
                  onChange={e => setField('email', e.target.value)}
                  className={`${inputCls} ${editorMode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
              </div>
              {/* 初始密碼（新增時） */}
              {editorMode === 'add' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">初始密碼（空白自動產生）</label>
                  <input type="text" value={initPassword} onChange={e => setInitPassword(e.target.value)}
                    className={inputCls} placeholder="留空自動產生" />
                </div>
              )}
              {/* 姓名 */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">姓名 *</label>
                <input required value={draft.name} onChange={e => setField('name', e.target.value)} className={inputCls} />
              </div>
              {/* 電話 */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">行動電話</label>
                <input value={draft.phone} onChange={e => setField('phone', e.target.value.replace(/\D/g, ''))} maxLength={10} className={inputCls} placeholder="09xxxxxxxx" />
              </div>
              {/* 縣市 */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">縣市</label>
                <select value={draft.addressCounty} onChange={e => { setField('addressCounty', e.target.value); setField('addressDistrict', ''); }} className={inputCls}>
                  <option value="">請選擇</option>
                  {Object.keys(TAIWAN_DISTRICTS).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* 區域 */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">區域</label>
                <select value={draft.addressDistrict} onChange={e => setField('addressDistrict', e.target.value)} className={inputCls} disabled={!draft.addressCounty}>
                  <option value="">請選擇</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {/* 詳細地址 */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-gray-600">詳細地址</label>
                <input value={draft.addressDetail} onChange={e => setField('addressDetail', e.target.value)} className={inputCls} placeholder="路、街、巷、弄、號" />
              </div>
              {/* 身分證 */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">身分證字號</label>
                <input value={draft.idNumber} onChange={e => setField('idNumber', e.target.value.toUpperCase())} maxLength={10} className={inputCls} placeholder="A123456789" />
              </div>
              {/* 生日 */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">生日（民國）</label>
                <MemberDatePicker value={draft.birthDate} onChange={v => setField('birthDate', v)} placeholder="請選擇" />
              </div>
              {/* 身分 */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">身分</label>
                <select value={draft.identity} onChange={e => setField('identity', e.target.value as MemberIdentity)} className={inputCls}>
                  {IDENTITY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              {/* 教練證年份 */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">教練證年份（民國）</label>
                <input value={draft.coachCertYear} onChange={e => setField('coachCertYear', e.target.value.replace(/\D/g, ''))} maxLength={3} className={inputCls} placeholder="112" />
              </div>
              {/* 緊急聯絡人 */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">緊急聯絡人</label>
                <input value={draft.emergencyContactName} onChange={e => setField('emergencyContactName', e.target.value)} className={inputCls} />
              </div>
              {/* 緊急聯絡人電話 */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">緊急聯絡人電話</label>
                <input value={draft.emergencyContactPhone} onChange={e => setField('emergencyContactPhone', e.target.value.replace(/\D/g, ''))} maxLength={10} className={inputCls} />
              </div>
              {/* 關係 */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">關係</label>
                <select value={draft.emergencyContactRelation} onChange={e => setField('emergencyContactRelation', e.target.value)} className={inputCls}>
                  <option value="">請選擇</option>
                  {RELATION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {/* 本年度紀念品 */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">本年度紀念品</label>
                <select value={draft.souvenirReceived ? '已領取' : '未領取'} onChange={e => setField('souvenirReceived', e.target.value === '已領取')} className={inputCls}>
                  <option>未領取</option>
                  <option>已領取</option>
                </select>
              </div>
              {/* 紀念品領取日期 */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">紀念品領取日期</label>
                <MemberDatePicker value={draft.souvenirReceiveDate} onChange={v => setField('souvenirReceiveDate', v)} placeholder="選填" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-gray-300">
                <Save size={15} />{saving ? '儲存中...' : '儲存'}
              </button>
              <button type="button" onClick={() => setEditorMode(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 列表 ──────────────────────────────── */}
      {loading ? (
        <p className="py-8 text-center text-gray-400">載入中…</p>
      ) : (
        <>
          <p className="mb-2 text-sm text-gray-500">共 {filtered.length} 位會員</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600">
                  <th className="px-3 py-2">姓名</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">電話</th>
                  <th className="px-3 py-2">身分</th>
                  <th className="px-3 py-2">生日(民國)</th>
                  <th className="px-3 py-2">緊急聯絡人</th>
                  <th className="px-3 py-2">紀念品</th>
                  <th className="px-3 py-2 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-400">尚無會員資料</td></tr>
                ) : filtered.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{m.name}</td>
                    <td className="px-3 py-2 text-gray-600">{m.email}</td>
                    <td className="px-3 py-2 text-gray-600">{m.phone}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                        {IDENTITY_LABEL[m.identity] || m.identity}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{m.birthDate}</td>
                    <td className="px-3 py-2 text-gray-600">{m.emergencyContactName}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${m.souvenirReceived ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {m.souvenirReceived ? '已領取' : '未領取'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => openEdit(m)} title="編輯"
                          className="rounded p-1.5 text-blue-600 hover:bg-blue-50">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(m.id!, m.name)} disabled={deletingId === m.id}
                          title="刪除" className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-40">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminMembers;
