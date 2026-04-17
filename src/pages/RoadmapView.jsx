import { useState } from 'react';
import { getStudyPlans, getStudyMaterials, downloadMaterial } from '../Services/api';
import {
  BookOpen, Map, ChevronDown, ChevronUp,
  AlertCircle, Loader2, CalendarDays, Download,
} from 'lucide-react';

// ─── Colour map by subject ────────────────────────────────────────────────────
const SUBJECT_STYLE = {
  Physics:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400' },
  Chemistry: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  Maths:     { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-400' },
  Biology:   { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-400' },
  default:   { bg: 'bg-brand-orange/8', text: 'text-brand-orange', border: 'border-brand-orange/20', dot: 'bg-brand-orange' },
};

function subjectStyle(subject) {
  return SUBJECT_STYLE[subject] ?? SUBJECT_STYLE.default;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 size={24} className="text-brand-orange animate-spin" />
      <p className="text-sm text-brand-navy/50">Loading…</p>
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mt-4">
      <AlertCircle size={16} className="text-red-400 shrink-0" />
      <p className="text-sm text-red-500 font-medium">{message}</p>
    </div>
  );
}

function Empty({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-brand-navy/5 flex items-center justify-center">
        <Icon size={20} className="text-brand-navy/30" />
      </div>
      <p className="text-sm text-brand-navy/40 font-medium">{message}</p>
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'plans',     label: 'Study Plans',    icon: Map },
    { id: 'materials', label: 'Study Materials', icon: BookOpen },
  ];
  return (
    <div className="flex gap-1 bg-brand-navy/5 p-1 rounded-xl w-fit">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            active === id
              ? 'bg-white text-brand-orange shadow-sm'
              : 'text-brand-navy/50 hover:text-brand-navy'
          }`}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Study Plans ──────────────────────────────────────────────────────────────

function WeekRow({ week, index, total }) {
  const [open, setOpen] = useState(false);
  const isLast = index === total - 1;

  return (
    <div className="flex gap-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center pt-2">
        <div className="w-8 h-8 rounded-full bg-brand-orange text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-md shadow-brand-orange/30 ring-4 ring-brand-orange/10">
          {week.weekNumber}
        </div>
        {!isLast && <div className="w-px flex-1 bg-brand-navy/10 mt-2" />}
      </div>

      {/* Card */}
      <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-5'}`}>
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between bg-white border border-brand-navy/8 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-brand-orange/25 transition-all text-left"
        >
          <div>
            <p className="text-sm font-bold text-brand-navy leading-tight">{week.title}</p>
            <p className="text-[11px] text-brand-navy/40 mt-1 font-medium">
              {week.topics?.length ?? 0} topic{week.topics?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
            open ? 'bg-brand-orange/10' : 'bg-brand-navy/5'
          }`}>
            {open
              ? <ChevronUp size={14} className="text-brand-orange" />
              : <ChevronDown size={14} className="text-brand-navy/40" />
            }
          </div>
        </button>

        {open && week.topics?.length > 0 && (
          <div className="mt-1.5 bg-white border border-brand-navy/8 rounded-2xl overflow-hidden shadow-sm">
            {week.topics.map((topic, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-5 py-2.5 ${
                  i < week.topics.length - 1 ? 'border-b border-brand-navy/[0.06]' : ''
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-navy/20 shrink-0" />
                <p className="text-[12px] text-brand-navy/60 font-medium">{topic}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function isUrl(str) {
  return typeof str === 'string' && (str.startsWith('http://') || str.startsWith('https://'));
}

function PlanCard({ plan }) {
  const [open, setOpen] = useState(false);
  const displayName = isUrl(plan.planName) ? 'Unnamed Plan' : (plan.planName || 'Unnamed Plan');

  return (
    <div className="bg-white border border-brand-navy/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-brand-navy/[0.02] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
            <Map size={16} className="text-brand-orange" />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-navy">{displayName}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[11px] text-brand-navy/40 font-medium">
                {plan.weeks?.length ?? 0} weeks
              </span>
              {plan.uploadedAt && (
                <span className="flex items-center gap-1 text-[11px] text-brand-navy/35">
                  <CalendarDays size={9} />
                  {formatDate(plan.uploadedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-2 shrink-0 ml-4`}>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-all ${
            open ? 'bg-brand-orange text-white' : 'bg-brand-orange/10 text-brand-orange'
          }`}>
            {open ? 'Hide' : 'View Plan'}
          </span>
          {open ? <ChevronUp size={14} className="text-brand-navy/30" /> : <ChevronDown size={14} className="text-brand-navy/30" />}
        </div>
      </button>

      {/* Weeks timeline */}
      {open && (
        <div className="px-5 pt-2 pb-5 border-t border-brand-navy/8 bg-brand-navy/[0.01]">
          {!plan.weeks?.length
            ? <p className="text-xs text-brand-navy/40 py-4 text-center">No weeks available.</p>
            : (
              <div className="mt-4 space-y-0">
                {plan.weeks.map((week, i) => (
                  <WeekRow key={week.weekNumber ?? i} week={week} index={i} total={plan.weeks.length} />
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}

function StudyPlansTab({ plans, loading, error }) {
  if (loading) return <Spinner />;
  if (error)   return <ErrorBox message={error} />;
  if (!plans.length) return <Empty icon={Map} message="No study plans found." />;

  return (
    <div className="space-y-3 mt-5">
      {plans.map(plan => <PlanCard key={plan._id} plan={plan} />)}
    </div>
  );
}

// ─── Study Materials ──────────────────────────────────────────────────────────

function MaterialCard({ material }) {
  const [downloading, setDownloading] = useState(false);
  const sc = subjectStyle(material.subject);

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await downloadMaterial(material._id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.fileName || `material-${material._id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white border border-brand-navy/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${sc.bg}`}>
            <BookOpen size={16} className={sc.text} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
                {material.subject}
              </span>
            </div>
            <p className="text-sm font-bold text-brand-navy mt-0.5 truncate">{material.fileName}</p>
            {material.uploadedAt && (
              <span className="flex items-center gap-1 text-[11px] text-brand-navy/35 mt-0.5">
                <CalendarDays size={9} />
                {formatDate(material.uploadedAt)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-orange/8 hover:bg-brand-orange/15 text-brand-orange text-[11px] font-bold transition-all disabled:opacity-50 shrink-0 ml-4"
        >
          {downloading
            ? <Loader2 size={12} className="animate-spin" />
            : <Download size={12} />
          }
          {downloading ? 'Downloading…' : 'PDF'}
        </button>
      </div>
    </div>
  );
}

function StudyMaterialsTab({ materials, loading, error }) {
  if (loading) return <Spinner />;
  if (error)   return <ErrorBox message={error} />;
  if (!materials.length) return <Empty icon={BookOpen} message="No study materials found." />;

  return (
    <div className="space-y-3 mt-5">
      {materials.map(mat => <MaterialCard key={mat._id} material={mat} />)}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function RoadmapView() {
  const [activeTab, setActiveTab] = useState('plans');

  const [plans, setPlans]               = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError]     = useState('');
  const [plansFetched, setPlansFetched] = useState(false);

  const [materials, setMaterials]                   = useState([]);
  const [materialsLoading, setMaterialsLoading]     = useState(false);
  const [materialsError, setMaterialsError]         = useState('');
  const [materialsFetched, setMaterialsFetched]     = useState(false);

  const fetchPlans = () => {
    if (plansFetched || plansLoading) return;
    setPlansLoading(true);
    setPlansError('');
    getStudyPlans()
      .then(res => { setPlans(res.data ?? []); setPlansFetched(true); })
      .catch(err => setPlansError(err.message || 'Failed to load study plans.'))
      .finally(() => setPlansLoading(false));
  };

  const fetchMaterials = () => {
    if (materialsFetched || materialsLoading) return;
    setMaterialsLoading(true);
    setMaterialsError('');
    getStudyMaterials()
      .then(res => { setMaterials(res.data ?? []); setMaterialsFetched(true); })
      .catch(err => setMaterialsError(err.message || 'Failed to load study materials.'))
      .finally(() => setMaterialsLoading(false));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'plans')     fetchPlans();
    if (tab === 'materials') fetchMaterials();
  };

  // Fetch the default tab on first render
  useState(() => { fetchPlans(); });

  return (
    <div className="flex-1 bg-background overflow-y-auto custom-scrollbar p-2">
      <div className="bg-white rounded-2xl border border-brand-navy/10 shadow-sm p-6 min-h-full">

        {/* Page header */}
        <div className="mb-5">
          <h1 className="text-xl font-black text-brand-navy font-heading tracking-tight">Roadmap</h1>
          <p className="text-xs text-brand-navy/45 mt-0.5">Your study plans and reference materials</p>
        </div>

        <div className="border-t border-brand-navy/8 mb-5" />

        {/* Tabs */}
        <TabBar active={activeTab} onChange={handleTabChange} />

        {/* Tab content */}
        {activeTab === 'plans' && (
          <StudyPlansTab plans={plans} loading={plansLoading} error={plansError} />
        )}
        {activeTab === 'materials' && (
          <StudyMaterialsTab materials={materials} loading={materialsLoading} error={materialsError} />
        )}

      </div>
    </div>
  );
}
