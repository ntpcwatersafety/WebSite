import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { History, Mail, Plus, Send, X } from 'lucide-react';
import { ActivityRegistrationRecord, MailLogRecord, MailTemplate } from '../../types';
import {
  MAIL_MERGE_FIELDS,
  MailRecipient,
  getMailLogs,
  getMailTemplates,
  sendRegistrationEmails,
} from '../../services/mailTemplate';
import { useToast } from '../../contexts/ToastContext';

interface SendRegistrationMailDialogProps {
  activity: { id: string; title: string };
  isOpen: boolean;
  initialRecipients: ActivityRegistrationRecord[];
  onClose: () => void;
}

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-TW');
};

const recipientFromRecord = (record: ActivityRegistrationRecord): MailRecipient => ({
  key: record.id,
  name: record.name,
  email: record.email,
  record,
});

const SendRegistrationMailDialog: React.FC<SendRegistrationMailDialogProps> = ({
  activity,
  isOpen,
  initialRecipients,
  onClose,
}) => {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'compose' | 'logs'>('compose');
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [recipients, setRecipients] = useState<MailRecipient[]>([]);
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<MailLogRecord[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTab('compose');
    setSelectedTemplateId('');
    setRecipients(initialRecipients.map(recipientFromRecord));
    setNewRecipientName('');
    setNewRecipientEmail('');
    setSubject('');
    setContent('');
    void loadTemplates();
  }, [isOpen, activity.id, initialRecipients]);

  const loadTemplates = async () => {
    try {
      const data = await getMailTemplates();
      setTemplates(data);
    } catch {
      showToast('載入信件樣版失敗', 'error');
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await getMailLogs(activity.id);
      setLogs(data);
    } catch {
      showToast('載入寄信紀錄失敗', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isOpen && tab === 'logs') void loadLogs();
  }, [isOpen, tab]);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((item) => item.id === templateId);
    if (template) {
      setSubject(template.subject);
      setContent(template.content);
    }
  };

  const handleAddRecipient = () => {
    const name = newRecipientName.trim();
    const email = newRecipientEmail.trim();
    if (!email) {
      showToast('請輸入收件者 Email', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Email 格式不正確', 'error');
      return;
    }
    if (recipients.some((item) => item.email.toLowerCase() === email.toLowerCase())) {
      showToast('此 Email 已在收件者清單中', 'error');
      return;
    }

    setRecipients((prev) => [...prev, { key: `manual-${Date.now()}`, name: name || email, email }]);
    setNewRecipientName('');
    setNewRecipientEmail('');
  };

  const handleRemoveRecipient = (key: string) => {
    setRecipients((prev) => prev.filter((item) => item.key !== key));
  };

  const handleSend = async () => {
    if (recipients.length === 0) {
      showToast('請至少新增一位收件者', 'error');
      return;
    }
    if (!subject.trim()) {
      showToast('請輸入主旨', 'error');
      return;
    }
    if (!content.trim()) {
      showToast('請輸入內文', 'error');
      return;
    }
    if (!window.confirm(`確定要寄出 ${recipients.length} 封信嗎？`)) return;

    const selectedTemplate = templates.find((item) => item.id === selectedTemplateId);

    setSending(true);
    try {
      const result = await sendRegistrationEmails(recipients, subject, content, {
        activityId: activity.id,
        activityTitle: activity.title,
        templateId: selectedTemplate?.id,
        templateName: selectedTemplate?.name,
      });

      if (result.failed === 0) {
        showToast(`已成功寄出 ${result.success} 封信`, 'success');
      } else {
        showToast(`寄出 ${result.success} 封成功，${result.failed} 封失敗`, 'error');
      }

      setTab('logs');
      void loadLogs();
    } catch (error: any) {
      showToast(error?.message || '寄信失敗', 'error');
    } finally {
      setSending(false);
    }
  };

  const mergeFieldHint = useMemo(() => MAIL_MERGE_FIELDS, []);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] bg-black/55 px-4 py-6" onClick={onClose}>
      <div
        className="mx-auto max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="寄信"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{activity.title} - 寄信</h3>
            <p className="mt-1 text-sm text-gray-500">選擇樣版自動帶入主旨及內文，也可自行編輯收件者、主旨及內文。</p>
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

        <div className="flex gap-2 border-b border-gray-200 px-6 pt-3">
          <button
            onClick={() => setTab('compose')}
            className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium ${tab === 'compose' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Mail size={14} />
            寄送
          </button>
          <button
            onClick={() => setTab('logs')}
            className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium ${tab === 'logs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <History size={14} />
            寄信紀錄
          </button>
        </div>

        {tab === 'compose' ? (
          <div className="space-y-5 px-6 py-5">
            <div>
              <label className="block text-xs text-gray-500 mb-1">套用樣版</label>
              <select
                value={selectedTemplateId}
                onChange={(event) => handleSelectTemplate(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">不使用樣版（自行輸入）</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <label className="text-sm text-gray-600">收件者（{recipients.length} 人）</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {recipients.map((recipient) => (
                  <span
                    key={recipient.key}
                    className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3 py-1 text-xs text-cyan-700"
                  >
                    {recipient.name} &lt;{recipient.email}&gt;
                    <button onClick={() => handleRemoveRecipient(recipient.key)} className="text-cyan-700 hover:text-cyan-900" title="移除">
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {recipients.length === 0 && <span className="text-xs text-gray-400">尚無收件者，請從報名紀錄勾選或於下方新增</span>}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  type="text"
                  value={newRecipientName}
                  onChange={(event) => setNewRecipientName(event.target.value)}
                  placeholder="姓名（選填）"
                  className="flex-1 min-w-[120px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="email"
                  value={newRecipientEmail}
                  onChange={(event) => setNewRecipientEmail(event.target.value)}
                  placeholder="Email"
                  className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={handleAddRecipient}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                >
                  <Plus size={14} />
                  新增收件者
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">主旨</label>
              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">內文</label>
              <textarea
                rows={8}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600">
              可用參數（依各收件者報名資料自動替換）：
              <div className="mt-1 flex flex-wrap gap-2">
                {mergeFieldHint.map((field) => (
                  <code key={field.key} className="px-1.5 py-0.5 rounded bg-white border border-gray-200">
                    {`{{${field.key}}}`} {field.label}
                  </code>
                ))}
              </div>
              <p className="mt-2 text-gray-500">手動新增的收件者僅有姓名、Email 可替換，其他參數會維持原文。</p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white ${sending ? 'cursor-not-allowed bg-slate-400' : 'bg-cyan-600 hover:bg-cyan-500'}`}
              >
                <Send size={14} />
                {sending ? '寄送中...' : '寄出'}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-5">
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 text-sm text-gray-600">共 {logs.length} 筆寄信紀錄</div>

              {loadingLogs ? (
                <div className="p-10 text-center text-gray-500">載入中...</div>
              ) : logs.length === 0 ? (
                <div className="p-10 text-center text-gray-500">尚無寄信紀錄</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[800px] w-full text-sm">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left">寄送時間</th>
                        <th className="px-3 py-2 text-left">收件者</th>
                        <th className="px-3 py-2 text-left">主旨</th>
                        <th className="px-3 py-2 text-left">樣版</th>
                        <th className="px-3 py-2 text-left">狀態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, index) => (
                        <tr key={log.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}>
                          <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{log.toName} &lt;{log.toEmail}&gt;</td>
                          <td className="px-3 py-2">{log.subject}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{log.templateName || '-'}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {log.status === 'success' ? (
                              <span className="text-emerald-600">成功</span>
                            ) : (
                              <span className="text-red-600" title={log.errorMessage}>失敗</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default SendRegistrationMailDialog;
