import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Clock, CheckCircle2, AlertCircle, Trophy, RotateCcw, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Sample question bank – replace with real data / props
// ---------------------------------------------------------------------------
const SAMPLE_QUESTIONS = [
  {
    id: 1,
    subject: 'Physics',
    topic: 'Kinematics',
    difficulty: 'Medium',
    question: 'A ball is thrown vertically upward with an initial velocity of 20 m/s. What is the maximum height reached by the ball? (g = 10 m/s²)',
    options: ['10 m', '20 m', '40 m', '80 m'],
    correct: 1,
    explanation: 'Using v² = u² − 2gh, at max height v = 0. So h = u²/2g = (20)²/(2×10) = 20 m.',
  },
  {
    id: 2,
    subject: 'Chemistry',
    topic: 'Atomic Structure',
    difficulty: 'Easy',
    question: 'Which quantum number determines the shape of an orbital?',
    options: ['Principal (n)', 'Azimuthal (l)', 'Magnetic (m)', 'Spin (s)'],
    correct: 1,
    explanation: 'The azimuthal quantum number (l) determines the shape of the orbital (s, p, d, f).',
  },
  {
    id: 3,
    subject: 'Maths',
    topic: 'Calculus',
    difficulty: 'Hard',
    question: 'What is the value of ∫₀^π sin(x) dx?',
    options: ['0', '1', '2', 'π'],
    correct: 2,
    explanation: '∫sin(x)dx = −cos(x). Evaluating from 0 to π: −cos(π) − (−cos(0)) = 1 + 1 = 2.',
  },
  {
    id: 4,
    subject: 'Physics',
    topic: "Newton's Laws",
    difficulty: 'Easy',
    question: 'A 5 kg object experiences a net force of 20 N. What is its acceleration?',
    options: ['2 m/s²', '4 m/s²', '10 m/s²', '100 m/s²'],
    correct: 1,
    explanation: 'By Newton\'s second law: a = F/m = 20/5 = 4 m/s².',
  },
  {
    id: 5,
    subject: 'Chemistry',
    topic: 'Chemical Bonding',
    difficulty: 'Medium',
    question: 'What type of bond is present in the NaCl crystal lattice?',
    options: ['Covalent', 'Metallic', 'Ionic', 'Hydrogen'],
    correct: 2,
    explanation: 'NaCl is held together by ionic bonds — electrostatic attraction between Na⁺ and Cl⁻ ions.',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const SUBJECT_COLORS = {
  Physics:   { dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-600 border-amber-200' },
  Chemistry: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  Maths:     { dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-600 border-blue-200' },
  Biology:   { dot: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-600 border-rose-200' },
};

const DIFFICULTY_COLORS = {
  Easy:   'bg-green-50 text-green-600 border-green-200',
  Medium: 'bg-amber-50 text-amber-600 border-amber-200',
  Hard:   'bg-red-50 text-red-600 border-red-200',
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function ScoreRing({ score, total }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 75 ? '#f97316' : pct >= 50 ? '#3b82f6' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg width="144" height="144" className="-rotate-90">
        <circle cx="72" cy="72" r={radius} strokeWidth="10" fill="none" className="stroke-brand-navy/10" />
        <circle
          cx="72" cy="72" r={radius} strokeWidth="10" fill="none"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-black text-brand-navy leading-none">{pct}%</span>
        <span className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest mt-0.5">Score</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function AssessmentModal({
  isOpen,
  onClose,
  questions = SAMPLE_QUESTIONS,
  title = 'Quick Assessment',
  timeLimitSeconds = 600,
}) {
  const [phase, setPhase] = useState('intro');         // intro | quiz | review | results
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});          // { questionId: optionIndex }
  const [flagged, setFlagged] = useState(new Set());
  const [revealed, setRevealed] = useState(false);     // show explanation for current q
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);

  const totalQuestions = questions.length;
  const currentQ = questions[current];

  // ---------- timer ----------
  useEffect(() => {
    if (phase !== 'quiz') return;
    if (timeLeft <= 0) { setPhase('results'); return; }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, timeLeft]);

  const resetAll = useCallback(() => {
    setCurrent(0);
    setAnswers({});
    setFlagged(new Set());
    setRevealed(false);
    setTimeLeft(timeLimitSeconds);
    setPhase('intro');
  }, [timeLimitSeconds]);

  // ---------- derived ----------
  const answered = Object.keys(answers).length;
  const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0), 0);
  const timerWarning = timeLeft <= 60;
  const selectedOption = answers[currentQ?.id] ?? null;
  const isFlagged = flagged.has(currentQ?.id);

  const handleSelect = (idx) => {
    if (phase !== 'quiz') return;
    setRevealed(false);
    setAnswers(prev => ({ ...prev, [currentQ.id]: idx }));
  };

  const toggleFlag = () => {
    setFlagged(prev => {
      const next = new Set(prev);
      next.has(currentQ.id) ? next.delete(currentQ.id) : next.add(currentQ.id);
      return next;
    });
  };

  const goNext = () => {
    setRevealed(false);
    if (current < totalQuestions - 1) setCurrent(c => c + 1);
    else setPhase('review');
  };

  const goPrev = () => {
    setRevealed(false);
    if (current > 0) setCurrent(c => c - 1);
  };

  if (!isOpen) return null;

  // -----------------------------------------------------------------------
  const subjectColor = SUBJECT_COLORS[currentQ?.subject] ?? SUBJECT_COLORS.Physics;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-navy/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-brand-navy/10 overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── TOP BAR ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-navy/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center">
              <Trophy size={17} className="text-brand-orange" />
            </div>
            <div>
              <h2 className="text-sm font-black text-brand-navy font-heading tracking-tight">{title}</h2>
              {phase === 'quiz' && (
                <p className="text-[10px] text-brand-navy/40 font-medium">
                  {answered}/{totalQuestions} answered
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            {phase === 'quiz' && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs transition-all ${
                timerWarning
                  ? 'bg-red-50 text-red-500 border border-red-200 animate-pulse'
                  : 'bg-brand-navy/5 text-brand-navy/60 border border-brand-navy/10'
              }`}>
                <Clock size={12} />
                {formatTime(timeLeft)}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-brand-navy/30 hover:text-brand-navy hover:bg-brand-navy/5 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── PROGRESS BAR (quiz only) ── */}
        {phase === 'quiz' && (
          <div className="px-6 pt-4">
            <div className="flex gap-1">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => { setCurrent(i); setRevealed(false); }}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                    i === current
                      ? 'bg-brand-orange'
                      : answers[q.id] !== undefined
                        ? 'bg-brand-orange/40'
                        : flagged.has(q.id)
                          ? 'bg-amber-300'
                          : 'bg-brand-navy/10'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-brand-navy/30 font-bold">Q{current + 1} of {totalQuestions}</span>
              {flagged.size > 0 && (
                <span className="text-[10px] text-amber-500 font-bold">{flagged.size} flagged</span>
              )}
            </div>
          </div>
        )}

        {/* ── SCROLLABLE BODY ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ════ INTRO SCREEN ════ */}
          {phase === 'intro' && (
            <div className="p-8 flex flex-col items-center text-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-brand-orange/10 border-2 border-brand-orange/20 flex items-center justify-center">
                <Trophy size={36} className="text-brand-orange" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-brand-navy font-heading tracking-tighter">{title}</h3>
                <p className="text-brand-navy/50 text-sm mt-2 leading-relaxed max-w-sm mx-auto">
                  Test your understanding across multiple subjects. Each question carries equal marks.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                {[
                  { label: 'Questions', value: totalQuestions },
                  { label: 'Time Limit', value: formatTime(timeLimitSeconds) },
                  { label: 'Passing', value: '60%' },
                ].map(stat => (
                  <div key={stat.label} className="bg-brand-navy/[0.03] border border-brand-navy/8 rounded-2xl p-4">
                    <p className="text-xl font-black text-brand-navy">{stat.value}</p>
                    <p className="text-[10px] text-brand-navy/40 font-bold uppercase tracking-widest mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => setPhase('quiz')}
                className="h-12 px-10 rounded-2xl bg-brand-orange text-white font-bold shadow-lg shadow-brand-orange/20 hover:bg-brand-orange-hover hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Start Assessment
                <ChevronRight size={18} className="ml-1" />
              </Button>
            </div>
          )}

          {/* ════ QUIZ SCREEN ════ */}
          {phase === 'quiz' && currentQ && (
            <div className="p-6 space-y-5">
              {/* Question header badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${subjectColor.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${subjectColor.dot}`} />
                  {currentQ.subject}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${DIFFICULTY_COLORS[currentQ.difficulty]}`}>
                  {currentQ.difficulty}
                </span>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-brand-navy/5 text-brand-navy/50 border border-brand-navy/8">
                  {currentQ.topic}
                </span>
                <button
                  onClick={toggleFlag}
                  className={`ml-auto flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                    isFlagged
                      ? 'bg-amber-50 text-amber-500 border-amber-200'
                      : 'bg-transparent text-brand-navy/30 border-brand-navy/10 hover:border-amber-200 hover:text-amber-400'
                  }`}
                >
                  <Flag size={11} />
                  {isFlagged ? 'Flagged' : 'Flag'}
                </button>
              </div>

              {/* Question text */}
              <p className="text-base font-semibold text-brand-navy leading-relaxed">
                {currentQ.question}
              </p>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect  = idx === currentQ.correct;

                  let style = 'border-brand-navy/12 text-brand-navy/70 hover:border-brand-navy/25 hover:bg-brand-navy/[0.02]';
                  if (isSelected && !revealed)
                    style = 'border-brand-orange bg-brand-orange/8 text-brand-orange shadow-sm';
                  if (revealed && isCorrect)
                    style = 'border-emerald-400 bg-emerald-50 text-emerald-700';
                  if (revealed && isSelected && !isCorrect)
                    style = 'border-red-400 bg-red-50 text-red-600';

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 font-medium text-sm text-left transition-all ${style}`}
                    >
                      <span className={`w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all ${
                        isSelected && !revealed
                          ? 'border-brand-orange bg-brand-orange text-white'
                          : revealed && isCorrect
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : revealed && isSelected && !isCorrect
                              ? 'border-red-500 bg-red-500 text-white'
                              : 'border-brand-navy/20 text-brand-navy/40'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {revealed && isCorrect && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
                      {revealed && isSelected && !isCorrect && <AlertCircle size={16} className="text-red-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation (after reveal) */}
              {revealed && (
                <div className="bg-brand-navy/[0.03] border border-brand-navy/10 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <p className="text-xs font-bold text-brand-navy/40 uppercase tracking-widest mb-1.5">Explanation</p>
                  <p className="text-sm text-brand-navy/80 leading-relaxed">{currentQ.explanation}</p>
                </div>
              )}

              {/* Reveal hint */}
              {selectedOption !== null && !revealed && (
                <button
                  onClick={() => setRevealed(true)}
                  className="text-xs font-bold text-brand-orange/70 hover:text-brand-orange underline underline-offset-2 transition-colors"
                >
                  Show explanation
                </button>
              )}
            </div>
          )}

          {/* ════ REVIEW SCREEN ════ */}
          {phase === 'review' && (
            <div className="p-6 space-y-4">
              <div className="mb-2">
                <h3 className="text-lg font-black text-brand-navy font-heading">Review Answers</h3>
                <p className="text-xs text-brand-navy/40 mt-0.5">{answered}/{totalQuestions} answered · {flagged.size} flagged</p>
              </div>

              {questions.map((q, i) => {
                const userAns = answers[q.id];
                const isCorrect = userAns === q.correct;
                const isAnswered = userAns !== undefined;
                const subC = SUBJECT_COLORS[q.subject] ?? SUBJECT_COLORS.Physics;

                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border p-4 cursor-pointer hover:shadow-sm transition-all ${
                      !isAnswered
                        ? 'border-brand-navy/10 bg-brand-navy/[0.02]'
                        : isCorrect
                          ? 'border-emerald-200 bg-emerald-50/60'
                          : 'border-red-200 bg-red-50/60'
                    }`}
                    onClick={() => { setCurrent(i); setPhase('quiz'); setRevealed(true); }}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black mt-0.5 ${
                        !isAnswered ? 'bg-brand-navy/10 text-brand-navy/40'
                          : isCorrect ? 'bg-emerald-500 text-white'
                            : 'bg-red-500 text-white'
                      }`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${subC.badge}`}>{q.subject}</span>
                          {flagged.has(q.id) && <Flag size={10} className="text-amber-400" />}
                          {!isAnswered && <span className="text-[10px] font-bold text-brand-navy/40">Unanswered</span>}
                        </div>
                        <p className="text-xs font-semibold text-brand-navy/70 leading-snug line-clamp-2">{q.question}</p>
                        {isAnswered && (
                          <p className={`text-[10px] font-bold mt-1 ${isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                            Your answer: {q.options[userAns]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ════ RESULTS SCREEN ════ */}
          {phase === 'results' && (
            <div className="p-8 flex flex-col items-center text-center gap-6">
              <ScoreRing score={score} total={totalQuestions} />

              <div>
                <h3 className="text-2xl font-black text-brand-navy font-heading tracking-tighter">
                  {score >= totalQuestions * 0.75
                    ? 'Excellent Work!'
                    : score >= totalQuestions * 0.5
                      ? 'Good Effort!'
                      : 'Keep Practising!'}
                </h3>
                <p className="text-brand-navy/50 text-sm mt-1">
                  You scored <span className="font-bold text-brand-navy">{score}/{totalQuestions}</span> correct answers.
                </p>
              </div>

              {/* Per-subject breakdown */}
              <div className="w-full max-w-sm space-y-2">
                {Object.keys(SUBJECT_COLORS).map(subj => {
                  const subQs = questions.filter(q => q.subject === subj);
                  if (subQs.length === 0) return null;
                  const subScore = subQs.reduce((a, q) => a + (answers[q.id] === q.correct ? 1 : 0), 0);
                  const pct = Math.round((subScore / subQs.length) * 100);
                  const { dot, badge } = SUBJECT_COLORS[subj];
                  return (
                    <div key={subj} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${badge}`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                      <span className="text-xs font-bold flex-1 text-left">{subj}</span>
                      <span className="text-xs font-bold">{subScore}/{subQs.length}</span>
                      <div className="w-20 h-1.5 rounded-full bg-black/10 overflow-hidden">
                        <div className={`h-full ${dot} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-bold w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 w-full max-w-sm">
                <Button
                  variant="outline"
                  onClick={resetAll}
                  className="flex-1 h-11 rounded-2xl border-brand-navy/20 text-brand-navy/60 font-bold hover:bg-brand-navy/5"
                >
                  <RotateCcw size={15} className="mr-1.5" />
                  Retry
                </Button>
                <Button
                  onClick={() => { setPhase('review'); }}
                  className="flex-1 h-11 rounded-2xl bg-brand-orange text-white font-bold shadow-lg shadow-brand-orange/20 hover:bg-brand-orange-hover transition-all"
                >
                  Review Answers
                  <ChevronRight size={15} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── BOTTOM NAV (quiz only) ── */}
        {phase === 'quiz' && (
          <div className="flex items-center gap-3 px-6 py-4 border-t border-brand-navy/8 bg-white">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={current === 0}
              className="h-10 px-5 rounded-xl border-brand-navy/20 text-brand-navy/50 font-bold hover:bg-brand-navy/5 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={16} className="mr-1" />
              Prev
            </Button>

            <div className="flex-1 flex justify-center gap-1">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrent(i); setRevealed(false); }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === current
                      ? 'bg-brand-orange scale-125'
                      : answers[questions[i].id] !== undefined
                        ? 'bg-brand-orange/40'
                        : 'bg-brand-navy/15'
                  }`}
                />
              ))}
            </div>

            {current < totalQuestions - 1 ? (
              <Button
                onClick={goNext}
                className="h-10 px-5 rounded-xl bg-brand-orange text-white font-bold shadow-md shadow-brand-orange/15 hover:bg-brand-orange-hover transition-all"
              >
                Next
                <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button
                onClick={() => setPhase('review')}
                className="h-10 px-5 rounded-xl bg-brand-navy text-white font-bold hover:bg-brand-navy/90 transition-all"
              >
                Finish
                <CheckCircle2 size={15} className="ml-1.5" />
              </Button>
            )}
          </div>
        )}

        {/* ── BOTTOM NAV (review only) ── */}
        {phase === 'review' && (
          <div className="flex gap-3 px-6 py-4 border-t border-brand-navy/8 bg-white">
            <Button
              variant="outline"
              onClick={() => { setCurrent(0); setPhase('quiz'); setRevealed(false); }}
              className="flex-1 h-10 rounded-xl border-brand-navy/20 text-brand-navy/60 font-bold hover:bg-brand-navy/5"
            >
              Back to Quiz
            </Button>
            <Button
              onClick={() => setPhase('results')}
              className="flex-1 h-10 rounded-xl bg-brand-orange text-white font-bold shadow-md shadow-brand-orange/15 hover:bg-brand-orange-hover transition-all"
            >
              Submit & See Results
              <CheckCircle2 size={15} className="ml-1.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
