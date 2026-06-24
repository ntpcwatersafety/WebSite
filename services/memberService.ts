import { MemberProfile, MemberSession } from '../types';
import { supabase } from './supabaseClient';

const MEMBER_SESSION_KEY = 'member_session';

// ── 密碼 hash（Web Crypto API）────────────────────────────────
const generateSalt = (): string => {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
};

const hashPassword = async (password: string, salt: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

// ── Session ───────────────────────────────────────────────────
export const getMemberSession = (): MemberSession | null => {
  const raw = localStorage.getItem(MEMBER_SESSION_KEY);
  if (!raw) return null;
  try {
    const session: MemberSession = JSON.parse(raw);
    if (Date.now() - session.timestamp > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(MEMBER_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

const saveSession = (email: string, name: string) => {
  const session: MemberSession = { email, name, timestamp: Date.now() };
  localStorage.setItem(MEMBER_SESSION_KEY, JSON.stringify(session));
};

export const logoutMember = () => {
  localStorage.removeItem(MEMBER_SESSION_KEY);
};

// ── DB row → MemberProfile ────────────────────────────────────
const rowToProfile = (row: any): MemberProfile => ({
  id: row.id,
  email: row.email,
  name: row.name || '',
  phone: row.phone || '',
  addressCounty: row.address_county || '',
  addressDistrict: row.address_district || '',
  addressDetail: row.address_detail || '',
  idNumber: row.id_number || '',
  birthDate: row.birth_date || '',
  identity: row.identity || 'member',
  coachCertYear: row.coach_cert_year || '',
  emergencyContactName: row.emergency_contact_name || '',
  emergencyContactPhone: row.emergency_contact_phone || '',
  emergencyContactRelation: row.emergency_contact_relation || '',
  souvenirReceived: row.souvenir_received ?? false,
  souvenirReceiveDate: row.souvenir_receive_date || '',
  createdAt: row.created_at,
});

// ── 會員登入 ──────────────────────────────────────────────────
export const loginMember = async (email: string, password: string): Promise<MemberProfile> => {
  const { data, error } = await supabase
    .from('water_members')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .single();

  if (error || !data) throw new Error('帳號或密碼錯誤');

  const hash = await hashPassword(password, data.password_salt);
  if (hash !== data.password_hash) throw new Error('帳號或密碼錯誤');

  saveSession(data.email, data.name);
  return rowToProfile(data);
};

// ── 會員註冊 ──────────────────────────────────────────────────
export const registerMember = async (
  profile: MemberProfile,
  password: string
): Promise<void> => {
  const emailKey = profile.email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from('water_members')
    .select('id')
    .eq('email', emailKey)
    .maybeSingle();

  if (existing) throw new Error('此 Email 已被註冊');

  const salt = generateSalt();
  const hash = await hashPassword(password, salt);

  const { error } = await supabase.from('water_members').insert({
    email: emailKey,
    password_hash: hash,
    password_salt: salt,
    name: profile.name.trim(),
    phone: profile.phone.trim(),
    address_county: profile.addressCounty,
    address_district: profile.addressDistrict,
    address_detail: profile.addressDetail.trim(),
    id_number: profile.idNumber.trim(),
    birth_date: profile.birthDate,
    identity: profile.identity,
    coach_cert_year: profile.coachCertYear.trim(),
    emergency_contact_name: profile.emergencyContactName.trim(),
    emergency_contact_phone: profile.emergencyContactPhone.trim(),
    emergency_contact_relation: profile.emergencyContactRelation.trim(),
    souvenir_received: profile.souvenirReceived,
    souvenir_receive_date: profile.souvenirReceiveDate,
  });

  if (error) throw error;
  saveSession(emailKey, profile.name.trim());
};

// ── 取得會員資料 ──────────────────────────────────────────────
export const getMemberProfile = async (email: string): Promise<MemberProfile | null> => {
  const { data, error } = await supabase
    .from('water_members')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .single();

  if (error || !data) return null;
  return rowToProfile(data);
};

// ── 更新會員資料（Email 不可改）────────────────────────────────
export const updateMemberProfile = async (
  email: string,
  profile: Omit<MemberProfile, 'id' | 'email' | 'createdAt'>
): Promise<void> => {
  const { error } = await supabase
    .from('water_members')
    .update({
      name: profile.name.trim(),
      phone: profile.phone.trim(),
      address_county: profile.addressCounty,
      address_district: profile.addressDistrict,
      address_detail: profile.addressDetail.trim(),
      id_number: profile.idNumber.trim(),
      birth_date: profile.birthDate,
      identity: profile.identity,
      coach_cert_year: profile.coachCertYear.trim(),
      emergency_contact_name: profile.emergencyContactName.trim(),
      emergency_contact_phone: profile.emergencyContactPhone.trim(),
      emergency_contact_relation: profile.emergencyContactRelation.trim(),
      souvenir_received: profile.souvenirReceived,
      souvenir_receive_date: profile.souvenirReceiveDate,
      updated_at: new Date().toISOString(),
    })
    .eq('email', email.trim().toLowerCase());

  if (error) throw error;

  const session = getMemberSession();
  if (session && session.email === email.trim().toLowerCase()) {
    saveSession(session.email, profile.name.trim());
  }
};

// ── 修改密碼（已登入） ────────────────────────────────────────
export const changeMemberPassword = async (
  email: string,
  oldPassword: string,
  newPassword: string
): Promise<void> => {
  const { data, error } = await supabase
    .from('water_members')
    .select('password_hash, password_salt')
    .eq('email', email.trim().toLowerCase())
    .single();

  if (error || !data) throw new Error('找不到會員資料');

  const oldHash = await hashPassword(oldPassword, data.password_salt);
  if (oldHash !== data.password_hash) throw new Error('目前密碼不正確');

  const newSalt = generateSalt();
  const newHash = await hashPassword(newPassword, newSalt);

  const { error: updateError } = await supabase
    .from('water_members')
    .update({ password_hash: newHash, password_salt: newSalt, updated_at: new Date().toISOString() })
    .eq('email', email.trim().toLowerCase());

  if (updateError) throw updateError;
};

// ── 忘記密碼：產生 token 並寫入 DB ────────────────────────────
export const requestPasswordReset = async (email: string): Promise<{ name: string; token: string }> => {
  const emailKey = email.trim().toLowerCase();

  const { data, error } = await supabase
    .from('water_members')
    .select('id, name')
    .eq('email', emailKey)
    .single();

  if (error || !data) throw new Error('此 Email 尚未註冊');

  const tokenArr = new Uint8Array(32);
  crypto.getRandomValues(tokenArr);
  const token = Array.from(tokenArr).map(b => b.toString(16).padStart(2, '0')).join('');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const { error: updateError } = await supabase
    .from('water_members')
    .update({ reset_token: token, reset_token_expires_at: expiresAt })
    .eq('email', emailKey);

  if (updateError) throw updateError;

  return { name: data.name, token };
};

// ── 重設密碼（用 token）────────────────────────────────────────
export const resetPasswordByToken = async (token: string, newPassword: string): Promise<void> => {
  const { data, error } = await supabase
    .from('water_members')
    .select('email, reset_token_expires_at')
    .eq('reset_token', token)
    .single();

  if (error || !data) throw new Error('重設連結無效或已過期');

  if (new Date(data.reset_token_expires_at) < new Date()) {
    throw new Error('重設連結已過期，請重新申請');
  }

  const newSalt = generateSalt();
  const newHash = await hashPassword(newPassword, newSalt);

  const { error: updateError } = await supabase
    .from('water_members')
    .update({
      password_hash: newHash,
      password_salt: newSalt,
      reset_token: null,
      reset_token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('email', data.email);

  if (updateError) throw updateError;
};

// ── 台灣縣市區域資料 ──────────────────────────────────────────
export const TAIWAN_DISTRICTS: Record<string, string[]> = {
  台北市: ['中正區','大同區','中山區','松山區','大安區','萬華區','信義區','士林區','北投區','內湖區','南港區','文山區'],
  新北市: ['板橋區','三重區','中和區','永和區','新莊區','新店區','樹林區','鶯歌區','三峽區','淡水區','汐止區','瑞芳區','土城區','蘆洲區','五股區','泰山區','林口區','深坑區','石碇區','坪林區','三芝區','石門區','八里區','平溪區','雙溪區','貢寮區','金山區','萬里區','烏來區'],
  基隆市: ['仁愛區','信義區','中正區','中山區','安樂區','暖暖區','七堵區'],
  桃園市: ['桃園區','中壢區','大溪區','楊梅區','蘆竹區','大園區','龜山區','八德區','龍潭區','平鎮區','新屋區','觀音區','復興區'],
  新竹市: ['東區','北區','香山區'],
  新竹縣: ['竹北市','竹東鎮','新埔鎮','關西鎮','湖口鄉','新豐鄉','峨眉鄉','寶山鄉','北埔鄉','橫山鄉','芎林鄉','尖石鄉','五峰鄉'],
  苗栗縣: ['苗栗市','苑裡鎮','通霄鎮','竹南鎮','頭份市','後龍鎮','卓蘭鎮','大湖鄉','公館鄉','銅鑼鄉','南庄鄉','獅潭鄉','西湖鄉','造橋鄉','三義鄉','三灣鄉','泰安鄉'],
  台中市: ['中區','東區','南區','西區','北區','西屯區','南屯區','北屯區','豐原區','東勢區','大甲區','清水區','沙鹿區','梧棲區','后里區','神岡區','潭子區','大雅區','新社區','石岡區','外埔區','大安區','烏日區','大肚區','龍井區','霧峰區','太平區','大里區','和平區'],
  彰化縣: ['彰化市','鹿港鎮','和美鎮','北斗鎮','員林市','溪湖鎮','田中鎮','大村鄉','埔鹽鄉','埔心鄉','永靖鄉','社頭鄉','二水鄉','線西鄉','伸港鄉','福興鄉','秀水鄉','花壇鄉','芬園鄉','二林鎮','大城鄉','芳苑鄉','竹塘鄉','溪州鄉'],
  南投縣: ['南投市','埔里鎮','草屯鎮','竹山鎮','集集鎮','名間鄉','鹿谷鄉','中寮鄉','魚池鄉','國姓鄉','水里鄉','信義鄉','仁愛鄉'],
  雲林縣: ['斗六市','斗南鎮','虎尾鎮','西螺鎮','土庫鎮','北港鎮','古坑鄉','大埤鄉','莿桐鄉','林內鄉','二崙鄉','崙背鄉','麥寮鄉','東勢鄉','褒忠鄉','台西鄉','元長鄉','四湖鄉','口湖鄉','水林鄉'],
  嘉義市: ['東區','西區'],
  嘉義縣: ['太保市','朴子市','布袋鎮','大林鎮','民雄鄉','溪口鄉','新港鄉','六腳鄉','東石鄉','義竹鄉','鹿草鄉','水上鄉','中埔鄉','竹崎鄉','梅山鄉','番路鄉','大埔鄉','阿里山鄉'],
  台南市: ['中西區','東區','南區','北區','安平區','安南區','永康區','歸仁區','新化區','左鎮區','玉井區','楠西區','南化區','仁德區','關廟區','龍崎區','官田區','麻豆區','佳里區','西港區','七股區','將軍區','學甲區','北門區','新市區','善化區','下營區','六甲區','柳營區','後壁區','白河區','東山區','鹽水區','新營區','山上區'],
  高雄市: ['楠梓區','左營區','鼓山區','三民區','鹽埕區','前金區','苓雅區','前鎮區','旗津區','小港區','鳳山區','林園區','大寮區','大樹區','大社區','仁武區','鳥松區','岡山區','橋頭區','燕巢區','田寮區','阿蓮區','路竹區','湖內區','茄萣區','永安區','彌陀區','梓官區','旗山區','美濃區','六龜區','甲仙區','杉林區','內門區','茂林區','桃源區','那瑪夏區'],
  屏東縣: ['屏東市','潮州鎮','東港鎮','恆春鎮','萬丹鄉','長治鄉','麟洛鄉','九如鄉','里港鄉','鹽埔鄉','高樹鄉','萬巒鄉','內埔鄉','竹田鄉','新埤鄉','枋寮鄉','新園鄉','崁頂鄉','林邊鄉','南州鄉','佳冬鄉','琉球鄉','車城鄉','滿州鄉','枋山鄉','三地門鄉','霧台鄉','瑪家鄉','泰武鄉','來義鄉','春日鄉','獅子鄉','牡丹鄉'],
  宜蘭縣: ['宜蘭市','羅東鎮','蘇澳鎮','頭城鎮','礁溪鄉','壯圍鄉','員山鄉','冬山鄉','五結鄉','三星鄉','大同鄉','南澳鄉'],
  花蓮縣: ['花蓮市','鳳林鎮','玉里鎮','新城鄉','吉安鄉','壽豐鄉','光復鄉','豐濱鄉','瑞穗鄉','富里鄉','秀林鄉','萬榮鄉','卓溪鄉'],
  台東縣: ['台東市','成功鎮','關山鎮','卑南鄉','鹿野鄉','池上鄉','東河鄉','長濱鄉','太麻里鄉','大武鄉','綠島鄉','海端鄉','延平鄉','金峰鄉','蘭嶼鄉','達仁鄉'],
  澎湖縣: ['馬公市','湖西鄉','白沙鄉','西嶼鄉','望安鄉','七美鄉'],
  金門縣: ['金城鎮','金湖鎮','金沙鎮','金寧鄉','烈嶼鄉','烏坵鄉'],
  連江縣: ['南竿鄉','北竿鄉','莒光鄉','東引鄉'],
};
