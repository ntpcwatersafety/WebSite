import { ActivityRegistrationFormData, ActivityRegistrationRecord } from '../types';
import { supabase } from './supabaseClient';

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

export const validateActivityRegistration = (data: ActivityRegistrationFormData): string | null => {
  if (!data.name.trim()) return '請填寫姓名';
  if (!data.email.trim()) return '請填寫 Email';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return 'Email 格式不正確';

  const birthDate = normalizeBirthDate(data.birthDate);
  if (!/^\d{6}$/.test(birthDate)) return '出生日期請使用民國格式 701123';

  if (!/^09\d{8}$/.test(data.phone.trim())) return '手機號碼請使用 09 開頭的 10 碼格式';
  if (!data.emergencyContactName.trim()) return '請填寫緊急聯絡人姓名';
  if (!/^09\d{8}$/.test(data.emergencyContactPhone.trim())) return '緊急聯絡人手機號碼格式錯誤';

  if (data.referralSource === 'other' && !data.referralSourceOther?.trim()) {
    return '請填寫「其他」來源內容';
  }

  return null;
};

export const submitActivityRegistration = async (data: ActivityRegistrationFormData): Promise<void> => {
  const { error } = await supabase
    .from('activity_registrations')
    .insert({
      activity_id: data.activityId,
      activity_title: data.activityTitle,
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

  if (error) {
    if (error.message?.includes('activity_registrations')) {
      throw new Error('報名資料表尚未建立，請先建立 activity_registrations 資料表。');
    }
    throw error;
  }
};

const convertRegistrationRow = (row: any): ActivityRegistrationRecord => ({
  id: row.id,
  createdAt: row.created_at,
  activityId: row.activity_id,
  activityTitle: row.activity_title,
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

export const getActivityRegistrations = async (): Promise<ActivityRegistrationRecord[]> => {
  const { data, error } = await supabase
    .from('activity_registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(convertRegistrationRow);
};

const escapeCsvCell = (value: string): string => {
  const normalized = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  if (/[",]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
};

export const downloadActivityRegistrationsCsv = (records: ActivityRegistrationRecord[]) => {
  const header = [
    '報名時間',
    '活動名稱',
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
    item.name,
    item.email,
    GENDER_LABEL[item.gender],
    item.birthDate,
    IDENTITY_LABEL[item.identity],
    item.phone,
    item.emergencyContactName,
    item.emergencyContactPhone,
    REFERRAL_LABEL[item.referralSource],
    item.referralSource === 'other' ? (item.referralSourceOther || '') : '',
    item.notes || '',
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(String(cell))).join(','))
    .join('\r\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateTag = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `activity-registrations-${dateTag}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
