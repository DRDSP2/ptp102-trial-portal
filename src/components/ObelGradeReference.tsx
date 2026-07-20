import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CheckCircle, Activity, Pause, Play } from 'lucide-react';

export type ObelGradeValue = '0' | '1' | '2' | '3' | '4';

type ObelGradeReferenceProps = {
  value: string;
  onChange: (value: ObelGradeValue) => void;
  patientName?: string;
};

type GradeMetric = {
  val: string;
  pct: number;
  color: string;
};

type GradeData = {
  name: string;
  badgeClass: string;
  desc: string;
  video: string;
  metrics: Record<string, GradeMetric>;
  annotation: string;
};

const OBEL_DATA: Record<ObelGradeValue, GradeData> = {
  '0': {
    name: 'Sound',
    badgeClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    desc: 'No apparent lameness — horse moves freely with rhythmic, symmetrical gait. Head remains level. Full stride length with confident toe-first landing.',
    video: '/videos/video-grade0.mp4',
    metrics: {
      stride: { val: '100%', pct: 100, color: '#4ade80' },
      hoof: { val: 'Toe-first', pct: 90, color: '#4ade80' },
      head: { val: 'None', pct: 5, color: 'rgba(255,255,255,0.15)' },
      weight: { val: 'None', pct: 5, color: 'rgba(255,255,255,0.15)' },
      contact: { val: 'Normal', pct: 50, color: '#4ade80' },
      gait: { val: 'Normal', pct: 95, color: '#4ade80' },
    },
    annotation:
      'Horse lands toe-first with even weight distribution. Strides are symmetrical and rhythmic. Head remains stable without nodding. This is the baseline normal gait.',
  },
  '1': {
    name: 'Mild',
    badgeClass: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    desc: 'Subtle lameness only visible at trot or on hard surfaces. Slightly shortened stride on affected limb. Minimal head nod as hoof contacts ground. Horse still mobile and alert.',
    video: '/videos/video-grade1.mp4',
    metrics: {
      stride: { val: '92%', pct: 92, color: '#fcd34d' },
      hoof: { val: 'Slight flat', pct: 70, color: '#fcd34d' },
      head: { val: 'Subtle', pct: 15, color: '#fcd34d' },
      weight: { val: 'Minimal', pct: 12, color: '#fcd34d' },
      contact: { val: 'Slightly long', pct: 60, color: '#fcd34d' },
      gait: { val: 'Near-normal', pct: 80, color: '#fcd34d' },
    },
    annotation:
      'Look for a subtle head rise as the affected front hoof contacts the ground. Stride may be slightly shorter on one side. Lameness may only be visible at trot — watch closely at the walk too.',
  },
  '2': {
    name: 'Moderate',
    badgeClass: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
    desc: 'Obvious lameness at walk on hard surface. Distinctly shortened, choppy gait with clear head nod. Flat-footed landing on affected hoof. Reluctant weight-bearing — classic laminitis presentation.',
    video: '/videos/video-grade2.mp4',
    metrics: {
      stride: { val: '72%', pct: 72, color: '#fdba74' },
      hoof: { val: 'Flat-footed', pct: 40, color: '#f59e0b' },
      head: { val: 'Clear nod', pct: 40, color: '#f59e0b' },
      weight: { val: 'Frequent', pct: 40, color: '#f59e0b' },
      contact: { val: 'Prolonged', pct: 75, color: '#f59e0b' },
      gait: { val: 'Asymmetric', pct: 50, color: '#f59e0b' },
    },
    annotation:
      'Classic laminitis gait: Head rises markedly when affected hoof strikes the ground. Short, choppy strides. Horse shifts weight to hindquarters (“pony stance”). Flat-footed or heel-first landing. This is the most common presentation for PTP-102 subjects.',
  },
  '3': {
    name: 'Severe',
    badgeClass: 'bg-red-500/15 border-red-500/30 text-red-300',
    desc: 'Severe lameness even at walk on soft surface. Very short shuffling gait. Pronounced head nod with dramatic rise. Horse dragging affected hoof, barely willing to move forward.',
    video: '/videos/video-grade3.mp4',
    metrics: {
      stride: { val: '45%', pct: 45, color: '#fca5a5' },
      hoof: { val: 'Heel-drag', pct: 20, color: '#ef4444' },
      head: { val: 'Pronounced', pct: 70, color: '#ef4444' },
      weight: { val: 'Constant', pct: 75, color: '#ef4444' },
      contact: { val: 'Very long', pct: 90, color: '#ef4444' },
      gait: { val: 'Severely off', pct: 25, color: '#ef4444' },
    },
    annotation:
      'Horse is barely mobile with severely shortened shuffling strides. Dramatic head nodding. Horse may “pony stance” with hindquarters under body to shift weight off front feet. This severity requires immediate AE reporting.',
  },
  '4': {
    name: 'Very Severe',
    badgeClass: 'bg-red-500/25 border-red-500/50 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.2)]',
    desc: 'Horse is reluctant to move or recumbent. Affected hoof may be planted — extreme reluctance to lift. Rocking back on hindquarters. Minimal forward movement. Emergency intervention likely required.',
    video: '/videos/video-grade4.mp4',
    metrics: {
      stride: { val: '15%', pct: 15, color: '#fecaca' },
      hoof: { val: 'Planted', pct: 5, color: '#ef4444' },
      head: { val: 'Severe', pct: 95, color: '#ef4444' },
      weight: { val: 'Unable', pct: 95, color: '#ef4444' },
      contact: { val: 'Extreme', pct: 98, color: '#ef4444' },
      gait: { val: 'Non-ambulatory', pct: 5, color: '#ef4444' },
    },
    annotation:
      'Horse is barely mobile or non-ambulatory. Affected hoof is planted — extreme reluctance to bear any weight. Horse rocks back on hindquarters. This is a Serious Adverse Event requiring immediate sponsor notification within 24 hours per protocol.',
  },
};

const GRADE_ORDER: ObelGradeValue[] = ['0', '1', '2', '3', '4'];

const gradeNumClass: Record<ObelGradeValue, string> = {
  '0': 'bg-emerald-500/20 text-emerald-300',
  '1': 'bg-amber-500/20 text-amber-300',
  '2': 'bg-orange-500/20 text-orange-300',
  '3': 'bg-red-500/20 text-red-300',
  '4': 'bg-red-500/30 text-red-200 border border-red-500/50',
};

const metricLabels: Record<string, string> = {
  stride: 'Stride Length',
  hoof: 'Hoof Placement',
  head: 'Head Nod',
  weight: 'Weight Shifting',
  contact: 'Ground Contact Time',
  gait: 'Gait Symmetry',
};

export function ObelGradeReference({ value, onChange, patientName }: ObelGradeReferenceProps) {
  const safeValue = useMemo<ObelGradeValue>(() => {
    if (value === '0' || value === '1' || value === '2' || value === '3' || value === '4') {
      return value;
    }
    return '2';
  }, [value]);

  const [currentGrade, setCurrentGrade] = useState<ObelGradeValue>(safeValue);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoOpacity, setVideoOpacity] = useState(1);
  const [descOpacity, setDescOpacity] = useState(1);
  const [annOpacity, setAnnOpacity] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const listId = useId();
  const labelId = useId();

  useEffect(() => {
    setCurrentGrade(safeValue);
  }, [safeValue]);

  const data = OBEL_DATA[currentGrade];

  const handleSetGrade = (grade: ObelGradeValue) => {
    if (grade === currentGrade) return;
    setDescOpacity(0);
    setAnnOpacity(0);
    setVideoOpacity(0);
    setTimeout(() => {
      setCurrentGrade(grade);
      onChange(grade);
      setDescOpacity(1);
      setAnnOpacity(1);
    }, 200);
    setTimeout(() => {
      void videoRef.current?.play();
      setVideoOpacity(1);
    }, 300);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      void video.play();
    }
    setIsPlaying((p) => !p);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handler = () => setIsPlaying(!video.paused);
    video.addEventListener('play', handler);
    video.addEventListener('pause', handler);
    return () => {
      video.removeEventListener('play', handler);
      video.removeEventListener('pause', handler);
    };
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0f0c] text-white"
      aria-labelledby={labelId}
    >
      {/* Demo video background */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          key={data.video}
          src={data.video}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover transition-opacity duration-500"
          style={{ opacity: videoOpacity }}
          aria-label={`Demo video for Obel grade ${currentGrade}: ${data.name}`}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 30%, rgba(10,15,12,0.7) 70%, rgba(10,15,12,0.95) 100%), linear-gradient(to right, rgba(10,15,12,0.85) 0%, transparent 40%, transparent 60%, rgba(10,15,12,0.85) 100%), linear-gradient(to top, rgba(10,15,12,0.9) 0%, transparent 35%)',
          }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
          style={{
            background: 'linear-gradient(to top, #0a0f0c 0%, transparent 100%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold">
              OB
            </div>
            <div>
              <h2 id={labelId} className="text-sm font-semibold">
                Obel Score Reference
              </h2>
              <p className="text-[11px] text-white/60">PTP-102 Laminitis Trial</p>
            </div>
          </div>
          {patientName ? (
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.4)]" />
              {patientName}
            </div>
          ) : null}
        </div>

        {/* Hero badge + description */}
        <div className="px-5 pb-5 text-center">
          <div
            className={`inline-block rounded-full border px-5 py-2 text-sm font-semibold tracking-wide backdrop-blur-md transition-colors duration-300 ${data.badgeClass}`}
            aria-live="polite"
          >
            Obel Grade {currentGrade} — {data.name}
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-[0.15em] text-white/40">
            Visual Gait Reference
          </p>
          <p
            className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-white/70 transition-opacity duration-300"
            style={{ opacity: descOpacity, minHeight: '3rem' }}
          >
            {data.desc}
          </p>
        </div>

        {/* Main 3-column layout */}
        <div className="grid grid-cols-1 gap-4 px-5 pb-6 md:grid-cols-[280px_1fr_260px] lg:grid-cols-[280px_1fr_280px]">
          {/* Left: Grade selector */}
          <div
            className="rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md transition-colors hover:bg-white/[0.08]"
            role="radiogroup"
            aria-label="Select Obel grade"
          >
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/50">
              <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Select Obel Grade
            </h3>
            <div className="flex flex-col gap-1.5" id={listId}>
              {GRADE_ORDER.map((grade) => {
                const active = grade === currentGrade;
                const info = OBEL_DATA[grade];
                return (
                  <button
                    key={grade}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => handleSetGrade(grade)}
                    className={`flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left transition-all ${
                      active
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'hover:border-white/[0.08] hover:bg-white/[0.04]'
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${gradeNumClass[grade]}`}
                      aria-hidden="true"
                    >
                      {grade}
                    </span>
                    <div>
                      <div className="text-sm font-semibold leading-tight">{info.name}</div>
                      <div className="text-[10px] leading-tight text-white/50">
                        {grade === '0' && 'No lameness at any gait'}
                        {grade === '1' && 'Lameness at trot / hard surface'}
                        {grade === '2' && 'Lame at walk on hard surface'}
                        {grade === '3' && 'Lame at walk on soft surface'}
                        {grade === '4' && 'Reluctant to move / recumbent'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center: Gait metrics */}
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/50">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              Gait Analysis
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.entries(metricLabels).map(([key, label]) => {
                const metric = data.metrics[key];
                const alert = metric.pct < 30;
                const highlight = metric.pct > 80;
                return (
                  <div
                    key={key}
                    className={`rounded-lg border p-3 transition-colors ${
                      alert
                        ? 'border-red-500/30 bg-red-500/[0.08]'
                        : highlight
                          ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
                          : 'border-white/[0.06] bg-white/[0.03]'
                    }`}
                  >
                    <div className="mb-1.5 text-[10px] uppercase tracking-wider text-white/50">
                      {label}
                    </div>
                    <div
                      className="mb-2 text-lg font-bold"
                      style={{ color: metric.color }}
                      aria-label={`${label}: ${metric.val}`}
                    >
                      {metric.val}
                    </div>
                    <div className="h-1 overflow-hidden rounded bg-white/[0.08]">
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{ width: `${metric.pct}%`, backgroundColor: metric.color }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className={`mt-4 rounded-lg border p-3 text-xs leading-relaxed text-white/70 transition-opacity duration-300 ${
                Number(currentGrade) >= 3
                  ? 'border-red-500/25 bg-red-500/[0.08]'
                  : 'border-emerald-500/20 bg-emerald-500/[0.06]'
              }`}
              style={{ opacity: annOpacity }}
              aria-live="polite"
            >
              <strong className="text-white">
                {Number(currentGrade) >= 3 ? 'Critical observation:' : 'What to observe:'}
              </strong>{' '}
              {data.annotation}
            </div>

            <div className="mt-4 flex items-center gap-3 border-t border-white/[0.06] pt-4">
              <button
                type="button"
                onClick={togglePlay}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:border-white/25 hover:bg-white/10"
                aria-label={isPlaying ? 'Pause demo video' : 'Play demo video'}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
                ) : (
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                )}
              </button>
              <span className="text-xs text-white/50">
                {isPlaying ? 'Demo video playing' : 'Demo video paused'}
              </span>
            </div>
          </div>

          {/* Right: Entry summary */}
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/50">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Selected Grade
            </h3>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-[11px] text-white/50">Obel Score (0–4)</p>
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${gradeNumClass[currentGrade]}`}
                  >
                    {currentGrade}
                  </span>
                  <span>{data.name}</span>
                </div>
              </div>
              <div>
                <p className="mb-1 text-[11px] text-white/50">Clinical Meaning</p>
                <p className="text-xs leading-relaxed text-white/70">
                  {currentGrade === '0' && 'No lameness — baseline normal gait.'}
                  {currentGrade === '1' && 'Mild lameness, often only visible at trot.'}
                  {currentGrade === '2' && 'Obvious lameness at walk on hard surface.'}
                  {currentGrade === '3' && 'Severe lameness even on soft surface.'}
                  {currentGrade === '4' && 'Very severe — non-ambulatory or recumbent.'}
                </p>
              </div>
              {Number(currentGrade) >= 3 && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-200">
                  <strong className="text-white">AE Alert:</strong> Grade {currentGrade} requires
                  adverse event assessment per protocol.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
