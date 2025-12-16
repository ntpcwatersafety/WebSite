// 定義頁面或區塊的資料結構
export interface SectionContent {
  id: string;
  title: string;
  content?: string; // 純文字內容
  listItems?: string[]; // 列表內容 (如最新消息)
  type: 'text' | 'list' | 'contact_info';
  isOpenDefault?: boolean;
}

// 定義單一頁面的設定 (Banner, 標題等)
export interface PageConfig {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
}

// 定義聯絡表單資料結構
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// 導覽列項目結構
export interface NavItem {
  label: string;
  path: string;
}