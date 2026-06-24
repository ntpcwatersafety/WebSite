import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface MemberDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const CURRENT_ROC_YEAR = new Date().getFullYear() - 1911;

const getDaysInMonth = (rocYear: number, month: number): number => {
  if (!rocYear || !month) return 31;
  const adYear = rocYear + 1911;
  return new Date(adYear, month, 0).getDate();
};

const parseRocDate = (value: string): { y: string; m: string; d: string } => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 7) {
    return { y: digits.slice(0, 3), m: digits.slice(3, 5), d: digits.slice(5, 7) };
  }
  if (digits.length === 6) {
    return { y: digits.slice(0, 2), m: digits.slice(2, 4), d: digits.slice(4, 6) };
  }
  return { y: '', m: '', d: '' };
};

const MemberDatePicker: React.FC<MemberDatePickerProps> = ({
  value,
  onChange,
  placeholder = '請選擇日期',
  disabled = false,
}) => {
  const parsed = parseRocDate(value);
  const [year, setYear] = useState(parsed.y);
  const [month, setMonth] = useState(parsed.m);
  const [day, setDay] = useState(parsed.d);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = parseRocDate(value);
    setYear(p.y);
    setMonth(p.m);
    setDay(p.d);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleConfirm = () => {
    if (!year || !month || !day) return;
    const y = year.padStart(year.length <= 2 ? 2 : 3, '0');
    const m = month.padStart(2, '0');
    const d = day.padStart(2, '0');
    onChange(`${y}${m}${d}`);
    setOpen(false);
  };

  const displayText = () => {
    if (!year && !month && !day) return '';
    const y = year || '__';
    const m = month ? month.padStart(2, '0') : '__';
    const d = day ? day.padStart(2, '0') : '__';
    return `民國 ${y} 年 ${m} 月 ${d} 日`;
  };

  const rocYears = Array.from({ length: CURRENT_ROC_YEAR - 39 }, (_, i) => CURRENT_ROC_YEAR - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: getDaysInMonth(Number(year), Number(month)) }, (_, i) => i + 1);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 px-3 py-2.5 text-left text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:bg-gray-50 disabled:text-gray-400"
      >
        <span className={displayText() ? 'text-gray-900' : 'text-gray-400'}>
          {displayText() || placeholder}
        </span>
        <span className="flex items-center gap-1 text-gray-400">
          <Calendar size={15} />
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[280px] rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">民國年</label>
              <select
                value={year}
                onChange={e => { setYear(e.target.value); setDay(''); }}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-cyan-500"
              >
                <option value="">年</option>
                {rocYears.map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">月</label>
              <select
                value={month}
                onChange={e => { setMonth(e.target.value); setDay(''); }}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-cyan-500"
              >
                <option value="">月</option>
                {months.map(m => (
                  <option key={m} value={String(m)}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">日</label>
              <select
                value={day}
                onChange={e => setDay(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-cyan-500"
              >
                <option value="">日</option>
                {days.map(d => (
                  <option key={d} value={String(d)}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!year || !month || !day}
              className="rounded bg-cyan-600 px-4 py-1.5 text-sm text-white hover:bg-cyan-700 disabled:bg-gray-300"
            >
              確定
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDatePicker;
