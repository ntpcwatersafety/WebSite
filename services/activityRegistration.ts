import { ActivityRegistrationFormData } from '../types';
import { sendContactEmail } from './cms';

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

const toEmailMessage = (data: ActivityRegistrationFormData): string => {
  const referral = data.referralSource === 'other'
    ? `其他 (${data.referralSourceOther?.trim() || '未填寫'})`
    : REFERRAL_LABEL[data.referralSource];

  return [
    `活動名稱：${data.activityTitle}`,
    `活動 ID：${data.activityId}`,
    '',
    `姓名：${data.name}`,
    `Email：${data.email}`,
    `性別：${GENDER_LABEL[data.gender]}`,
    `出生日期(民國)：${normalizeBirthDate(data.birthDate)}`,
    `身分別：${IDENTITY_LABEL[data.identity]}`,
    `手機號碼：${data.phone}`,
    `緊急聯絡人：${data.emergencyContactName}`,
    `緊急聯絡人手機：${data.emergencyContactPhone}`,
    `得知活動來源：${referral}`,
    `備註：${data.notes?.trim() || '無'}`,
  ].join('\n');
};

export const submitActivityRegistration = async (data: ActivityRegistrationFormData): Promise<void> => {
  const subject = `活動報名｜${data.activityTitle}｜${data.name}`;

  await sendContactEmail({
    name: data.name,
    email: data.email,
    subject,
    message: toEmailMessage(data),
  });
};
