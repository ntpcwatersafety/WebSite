import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ExternalLink, FileText } from 'lucide-react';
import Hero from '../components/Hero';
import { PAGE_CONTENT } from '../services/cms';
import { loadCmsData } from '../services/cmsLoader';
import { TrainingRecordItem } from '../types';
import { sortTrainingRecords } from '../services/cmsData';

const TrainingRecordDetail: React.FC = () => {
  const { recordId } = useParams();
  const [records, setRecords] = useState<TrainingRecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const cmsData = await loadCmsData();
        setRecords(sortTrainingRecords(cmsData?.trainingRecords || []));
      } catch (error) {
        console.error('載入訓練紀錄 detail 失敗:', error);
      }
      setLoading(false);
    };

    loadRecords();
  }, []);

  const record = useMemo(() => records.find((item) => item.id === recordId), [records, recordId]);

  return (
    <>
      <Hero
        title={PAGE_CONTENT.results.title}
        subtitle={PAGE_CONTENT.results.subtitle}
        imageUrl={PAGE_CONTENT.results.imageUrl}
      />
      <main className="container mx-auto my-8 max-w-[1000px] px-4 sm:px-5">
        <Link to="/results" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900">
          <ChevronLeft className="h-4 w-4" />
          返回訓練成果
        </Link>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">載入中...</div>
        ) : !record ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            找不到這筆訓練紀錄。
          </div>
        ) : (
          <article className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {record.date ? (
                <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
                  {record.date}
                </span>
              ) : null}
              {record.isNew ? <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">NEW</span> : null}
              {record.isPinned ? <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">置頂</span> : null}
            </div>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900">{record.title}</h1>
            {record.description ? (
              <div
                className="cms-richtext mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700"
                dangerouslySetInnerHTML={{ __html: record.description }}
              />
            ) : null}

            {record.link ? (
              <a
                href={record.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
              >
                查看外部資料 <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}

            <div className="mt-6 space-y-4">
              {(record.detailBlocks?.length ? record.detailBlocks : []).map((block, index) => (
                <section key={block.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <FileText className="h-4 w-4" />
                    內容 {index + 1}
                  </div>
                  <div className="cms-richtext text-slate-700" dangerouslySetInnerHTML={{ __html: block.content }} />
                </section>
              ))}
              {record.detailBlocks?.length ? null : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  這筆訓練紀錄目前尚未設定詳細內容區塊。
                </div>
              )}
            </div>
          </article>
        )}
      </main>
    </>
  );
};

export default TrainingRecordDetail;