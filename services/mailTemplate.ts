import { ActivityRegistrationRecord, MailLogRecord, MailTemplate } from '../types';
import { supabase } from './supabaseClient';
import { sendCustomEmail } from './cms';
import { ACTIVITY_REGISTRATION_LABELS } from './activityRegistration';

export interface MailRecipient {
  key: string;
  name: string;
  email: string;
  record?: ActivityRegistrationRecord;
}

export const MAIL_MERGE_FIELDS: { key: string; label: string }[] = [
  { key: 'Name', label: '姓名' },
  { key: 'Email', label: 'Email' },
  { key: 'Activity', label: '活動名稱' },
  { key: 'Phone', label: '手機' },
  { key: 'Periods', label: '期數' },
  { key: 'Gender', label: '性別' },
  { key: 'Identity', label: '身分別' },
  { key: 'BirthDate', label: '出生日期' },
  { key: 'EmergencyContactName', label: '緊急聯絡人' },
  { key: 'EmergencyContactPhone', label: '緊急聯絡人手機' },
];

export const buildMergeDataFromRecipient = (recipient: MailRecipient): Record<string, string> => {
  const record = recipient.record;
  if (!record) {
    return { Name: recipient.name, Email: recipient.email };
  }

  return {
    Name: record.name,
    Email: record.email,
    Activity: record.activityTitle,
    Phone: record.phone,
    Periods: (record.selectedPeriods || []).join('、'),
    Gender: ACTIVITY_REGISTRATION_LABELS.gender[record.gender],
    Identity: ACTIVITY_REGISTRATION_LABELS.identity[record.identity],
    BirthDate: record.birthDate,
    EmergencyContactName: record.emergencyContactName,
    EmergencyContactPhone: record.emergencyContactPhone,
  };
};

export const renderMailMergeFields = (text: string, data: Record<string, string>): string => (
  text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => (key in data ? data[key] : match))
);

const convertTemplateRow = (row: any): MailTemplate => ({
  id: row.id,
  name: row.name,
  subject: row.subject,
  content: row.content,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const getMailTemplates = async (): Promise<MailTemplate[]> => {
  const { data, error } = await supabase
    .from('mail_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(convertTemplateRow);
};

export const createMailTemplate = async (data: { name: string; subject: string; content: string }): Promise<void> => {
  const { error } = await supabase
    .from('mail_templates')
    .insert({
      name: data.name.trim(),
      subject: data.subject.trim(),
      content: data.content,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
};

export const updateMailTemplate = async (id: string, data: { name: string; subject: string; content: string }): Promise<void> => {
  const { error } = await supabase
    .from('mail_templates')
    .update({
      name: data.name.trim(),
      subject: data.subject.trim(),
      content: data.content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
};

export const deleteMailTemplate = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('mail_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

const convertLogRow = (row: any): MailLogRecord => ({
  id: row.id,
  createdAt: row.created_at,
  activityId: row.activity_id || undefined,
  activityTitle: row.activity_title || undefined,
  templateId: row.template_id || undefined,
  templateName: row.template_name || undefined,
  toEmail: row.to_email,
  toName: row.to_name || undefined,
  subject: row.subject,
  content: row.content,
  status: row.status,
  errorMessage: row.error_message || undefined,
});

export const getMailLogs = async (activityId?: string): Promise<MailLogRecord[]> => {
  let query = supabase
    .from('mail_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (activityId) query = query.eq('activity_id', activityId);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(convertLogRow);
};

interface SendMailContext {
  activityId?: string;
  activityTitle?: string;
  templateId?: string;
  templateName?: string;
}

export const sendRegistrationEmails = async (
  recipients: MailRecipient[],
  subject: string,
  content: string,
  context: SendMailContext = {}
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const mergeData = buildMergeDataFromRecipient(recipient);
    const renderedSubject = renderMailMergeFields(subject, mergeData);
    const renderedContent = renderMailMergeFields(content, mergeData);

    let status: 'success' | 'failed' = 'success';
    let errorMessage: string | undefined;

    try {
      await sendCustomEmail({
        toEmail: recipient.email,
        toName: recipient.name,
        subject: renderedSubject,
        message: renderedContent,
      });
      success += 1;
    } catch (error: any) {
      status = 'failed';
      errorMessage = error?.message || '寄送失敗';
      failed += 1;
    }

    const { error: logError } = await supabase.from('mail_logs').insert({
      activity_id: context.activityId || null,
      activity_title: context.activityTitle || null,
      template_id: context.templateId || null,
      template_name: context.templateName || null,
      to_email: recipient.email,
      to_name: recipient.name,
      subject: renderedSubject,
      content: renderedContent,
      status,
      error_message: errorMessage || null,
    });
    if (logError) console.error('[sendRegistrationEmails] 寫入寄信紀錄失敗:', logError);
  }

  return { success, failed };
};
