import { ActivityRegistrationFormData, ActivityRegistrationRecord } from '../types';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';

const GENDER_LABEL: Record<ActivityRegistrationFormData['gender'], string> = {
  male: '生理男',
  female: '生理女',
};

const IDENTITY_LABEL: Record<ActivityRegistrationFormData['identity'], string> = {
  member: '有效會員',
  memberFamily: '會員回娘家',
  newMember: '新入會(欲加入會員)',
  nonMember: '非會員',
};

const REFERRAL_LABEL: Record<ActivityRegistrationFormData['referralSource'], string> = {
  member: '本身是會員',
  friend: '朋友介紹',
  flyer: '臉書看到',
  officialSite: '本會官網看到',
  beclass: 'BeClass網站看到',
  other: '其他',
};

export const ACTIVITY_REGISTRATION_LABELS = {
  gender: GENDER_LABEL,
  identity: IDENTITY_LABEL,
  referral: REFERRAL_LABEL,
};

const normalizeBirthDate = (birthDate: string): string => birthDate.replace(/\D/g, '');

const normalizeSelectedPeriods = (selectedPeriods: string[] = []): string[] => Array.from(new Set(
  selectedPeriods
    .map((item) => String(item || '').trim())
    .filter(Boolean)
));

const parseSelectedPeriods = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return normalizeSelectedPeriods(raw as string[]);
  if (typeof raw !== 'string' || !raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeSelectedPeriods(parsed as string[]) : [];
  } catch {
    return [];
  }
};

export const buildActivityRegistrationInitialForm = (
  activityId: string = '',
  activityTitle: string = ''
): ActivityRegistrationFormData => ({
  activityId,
  activityTitle,
  selectedPeriods: [],
  name: '',
  email: '',
  gender: 'male',
  birthDate: '',
  identity: 'member',
  phone: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  referralSource: 'member',
  referralSourceOther: '',
  notes: '',
});

const toRegistrationPayload = (data: ActivityRegistrationFormData) => ({
  activity_id: data.activityId,
  activity_title: data.activityTitle,
  selected_periods_json: JSON.stringify(normalizeSelectedPeriods(data.selectedPeriods || [])),
  name: data.name.trim(),
  email: data.email.trim(),
  gender: data.gender,
  birth_date: normalizeBirthDate(data.birthDate),
  identity: data.identity,
  phone: data.phone.trim(),
  emergency_contact_name: data.emergencyContactName.trim(),
  emergency_contact_phone: data.emergencyContactPhone.trim(),
  referral_source: data.referralSource,
  referral_source_other: data.referralSourceOther?.trim() || null,
  notes: data.notes?.trim() || null,
});

export const validateActivityRegistration = (
  data: ActivityRegistrationFormData,
  availablePeriodOptions: string[] = []
): string | null => {
  if (!data.activityId.trim()) return '請選擇活動';
  if (!data.activityTitle.trim()) return '活動名稱不可空白';

  const normalizedAvailablePeriods = normalizeSelectedPeriods(availablePeriodOptions);
  const selectedPeriods = normalizeSelectedPeriods(data.selectedPeriods || []);
  if (normalizedAvailablePeriods.length > 0) {
    if (selectedPeriods.length === 0) return '請至少勾選一個期數';

    const periodSet = new Set(normalizedAvailablePeriods);
    if (selectedPeriods.some((period) => !periodSet.has(period))) {
      return '期數資料有誤，請重新勾選';
    }
  }

  if (!data.name.trim()) return '請填寫姓名';
  if (!data.email.trim()) return '請填寫 Email';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return 'Email 格式不正確';

  const birthDate = normalizeBirthDate(data.birthDate);
  if (!/^\d{6,7}$/.test(birthDate)) return '出生日期請使用民國格式 701123 或 1000102';

  if (!/^09\d{8}$/.test(data.phone.trim())) return '手機號碼請使用 09 開頭的 10 碼格式';
  if (!data.emergencyContactName.trim()) return '請填寫緊急聯絡人姓名';
  if (!/^09\d{8}$/.test(data.emergencyContactPhone.trim())) return '緊急聯絡人手機號碼格式錯誤';

  if (data.referralSource === 'other' && !data.referralSourceOther?.trim()) {
    return '請填寫「其他」來源內容';
  }

  return null;
};

export const createActivityRegistration = async (data: ActivityRegistrationFormData): Promise<void> => {
  const { error } = await supabase
    .from('activity_registrations')
    .insert(toRegistrationPayload(data));

  if (error) {
    if (error.message?.includes('selected_periods_json')) {
      throw new Error('報名資料表缺少 selected_periods_json 欄位，請先套用 docs/ACTIVITY_REGISTRATIONS_SQL.md 的更新語法。');
    }
    if (error.message?.includes('activity_registrations')) {
      throw new Error('報名資料表尚未建立，請先建立 activity_registrations 資料表。');
    }
    throw error;
  }
};

export const submitActivityRegistration = async (data: ActivityRegistrationFormData): Promise<void> => {
  await createActivityRegistration(data);
};

export const updateActivityRegistration = async (id: string, data: ActivityRegistrationFormData): Promise<void> => {
  const { error } = await supabase
    .from('activity_registrations')
    .update(toRegistrationPayload(data))
    .eq('id', id);

  if (error) throw error;
};

export const deleteActivityRegistration = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('activity_registrations')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

const convertRegistrationRow = (row: any): ActivityRegistrationRecord => ({
  id: row.id,
  createdAt: row.created_at,
  activityId: row.activity_id,
  activityTitle: row.activity_title,
  selectedPeriods: parseSelectedPeriods(row.selected_periods_json),
  name: row.name,
  email: row.email,
  gender: row.gender,
  birthDate: row.birth_date,
  identity: row.identity,
  phone: row.phone,
  emergencyContactName: row.emergency_contact_name,
  emergencyContactPhone: row.emergency_contact_phone,
  referralSource: row.referral_source,
  referralSourceOther: row.referral_source_other || '',
  notes: row.notes || '',
});

export const getLatestRegistrationByActivityAndEmail = async (
  activityId: string,
  email: string
): Promise<ActivityRegistrationRecord | null> => {
  const { data, error } = await supabase
    .from('activity_registrations')
    .select('*')
    .eq('activity_id', activityId)
    .eq('email', email.trim().toLowerCase())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return convertRegistrationRow(data);
};

export const getActivityRegistrations = async (): Promise<ActivityRegistrationRecord[]> => {
  const { data, error } = await supabase
    .from('activity_registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(convertRegistrationRow);
};

const formatReferralLabel = (record: ActivityRegistrationRecord) => {
  const label = REFERRAL_LABEL[record.referralSource];
  return record.referralSource === 'other' && record.referralSourceOther
    ? `${label} (${record.referralSourceOther})`
    : label;
};

export const downloadActivityRegistrationsXlsx = (records: ActivityRegistrationRecord[]) => {
  const header = [
    '報名時間',
    '活動名稱',
    '期數',
    '姓名',
    'Email',
    '性別',
    '出生日期(民國)',
    '身分別',
    '手機',
    '緊急聯絡人',
    '緊急聯絡人手機',
    '來源',
    '來源其他',
    '備註',
  ];

  const rows = records.map((item) => [
    new Date(item.createdAt).toLocaleString('zh-TW'),
    item.activityTitle,
    normalizeSelectedPeriods(item.selectedPeriods || []).join('、'),
    item.name,
    item.email,
    GENDER_LABEL[item.gender],
    item.birthDate,
    IDENTITY_LABEL[item.identity],
    item.phone,
    item.emergencyContactName,
    item.emergencyContactPhone,
    formatReferralLabel(item),
    item.referralSource === 'other' ? (item.referralSourceOther || '') : '',
    item.notes || '',
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  worksheet['!cols'] = [
    { wch: 22 },
    { wch: 24 },
    { wch: 30 },
    { wch: 12 },
    { wch: 28 },
    { wch: 10 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '報名資料');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateTag = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `activity-registrations-${dateTag}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
