import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Clock, CheckCircle2, AlertCircle, Trophy, RotateCcw, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    explanation: "By Newton's second law: a = F/m = 20/5 = 4 m/s².",
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
  // indigo for high, blue for mid, red for low
  const color = pct >= 75 ? '#3B47C2' : pct >= 50 ? '#3b82f6' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg width="144" height="144" className="-rotate-90">
        <circle cx="72" cy="72" r={radius} strokeWidth="8" fill="none" className="stroke-brand-navy/8" />
        <circle
          cx="72" cy="72" r={radius} strokeWidth="8" fill="none"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-brand-navy leading-none">{pct}%</span>
        <span className="text-xs font-medium text-brand-navy/35 mt-0.5">Score</span>
      </div>
    </div>
  );
}

export default function AssessmentModal({
  isOpen,
  onClose,
  questions = SAMPLE_QUESTIONS,
  title = 'Quick Assessment',
  timeLimitSeconds = 600,
}) {
  const [phase, setPhase] = useState('intro');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);

  const totalQuestions = questions.length;
  const currentQ = questions[current];

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

  const subjectColor = SUBJECT_COLORS[currentQ?.subject] ?? SUBJECT_COLORS.Physics;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-navy/25 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-modal border border-brand-navy/8 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-navy/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-orange/10 flex items-center justify-center">
              <Trophy size={15} className="text-brand-orange" />
            </div>
            <div>
              <h2 className="text-[13px] font-semibold text-brand-navy font-heading">{title}</h2>
              {phase === 'quiz' && (
                <p className="text-xs text-brand-navy/35 font-medium">
                  {answered}/{totalQuestions} answered
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {phase === 'quiz' && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                timerWarning
                  ? 'bg-red-50 text-red-500 border border-red-200 animate-pulse'
                  : 'bg-brand-navy/5 text-brand-navy/50 border border-brand-navy/8'
              }`}>
                <Clock size={11} />
                {formatTime(timeLeft)}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-brand-navy/25 hover:text-brand-navy hover:bg-brand-navy/5 transition-colors duration-150"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Progress bar (quiz only) */}
        {phase === 'quiz' && (
          <div className="px-6 pt-4">
            <div className="flex gap-1">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => { setCurrent(i); setRevealed(false); }}
                  className={`flex-1 h-1 rounded-full transition-colors duration-200 ${
                    i === current
                      ? 'bg-brand-orange'
                      : answers[q.id] !== undefined
                        ? 'bg-brand-orange/35'
                        : flagged.has(q.id)
                          ? 'bg-amber-300'
                          : 'bg-brand-navy/8'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-brand-navy/25 font-medium">Q{current + 1} of {totalQuestions}</span>
              {flagged.size > 0 && (
                <span className="text-xs text-amber-500 font-medium">{flagged.size} flagged</span>
              )}
            </div>
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* Intro */}
          {phase === 'intro' && (
            <div className="p-8 flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
                <Trophy size={30} className="text-brand-orange" />
              </div>
              <div>
                <h3 className="text-display text-brand-navy font-heading">{title}</h3>
                <p className="text-brand-navy/45 text-[13px] mt-2 leading-relaxed max-w-sm mx-auto">
                  Test your understanding across subjects. Each question carries equal marks.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                {[
                  { label: 'Questions', value: totalQuestions },
                  { label: 'Time Limit', value: formatTime(timeLimitSeconds) },
                  { label: 'Passing',   value: '60%' },
                ].map(stat => (
                  <div key={stat.label} className="bg-[#F7F7FB] border border-brand-navy/8 rounded-2xl p-4">
                    <p className="text-xl font-bold text-brand-navy">{stat.value}</p>
                    <p className="text-xs text-brand-navy/35 font-medium uppercase tracking-widest mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => setPhase('quiz')}
                className="h-11 px-8 rounded-2xl bg-brand-orange text-white font-semibold shadow-card hover:bg-brand-orange-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
              >
                Start Assessment
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          )}

          {/* Quiz */}
          {phase === 'quiz' && currentQ && (
            <div className="p-6 space-y-5">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${subjectColor.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${subjectColor.dot}`} />
                  {currentQ.subject}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${DIFFICULTY_COLORS[currentQ.difficulty]}`}>
                  {currentQ.difficulty}
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-navy/5 text-brand-navy/45 border border-brand-navy/8">
                  {currentQ.topic}
                </span>
                <button
                  onClick={toggleFlag}
                  className={`ml-auto flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors duration-150 ${
                    isFlagged
                      ? 'bg-amber-50 text-amber-500 border-amber-200'
                      : 'text-brand-navy/25 border-brand-navy/8 hover:border-amber-200 hover:text-amber-400'
                  }`}
                >
                  <Flag size={11} />
                  {isFlagged ? 'Flagged' : 'Flag'}
                </button>
              </div>

              {/* Question */}
              <p className="text-[15px] font-semibold text-brand-navy leading-relaxed">
                {currentQ.question}
              </p>

              {/* Options */}
              <div className="space-y-2">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect  = idx === currentQ.correct;

                  let style = 'border-brand-navy/10 text-brand-navy/65 hover:border-brand-navy/20 hover:bg-brand-navy/[0.02]';
                  if (isSelected && !revealed)
                    style = 'border-brand-orange bg-brand-orange/8 text-brand-navy';
                  if (revealed && isCorrect)
                    style = 'border-emerald-300 bg-emerald-50 text-emerald-700';
                  if (revealed && isSelected && !isCorrect)
                    style = 'border-red-300 bg-red-50 text-red-600';

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border-2 font-medium text-[13px] text-left transition-all duration-150 ${style}`}
                    >
                      <span className={`w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center text-xs font-bold transition-colors duration-150 ${
                        isSelected && !revealed
                          ? 'border-brand-orange bg-brand-orange text-white'
                          : revealed && isCorrect
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : revealed && isSelected && !isCorrect
                              ? 'border-red-500 bg-red-500 text-white'
                              : 'border-brand-navy/15 text-brand-navy/35'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {revealed && isCorrect && <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />}
                      {revealed && isSelected && !isCorrect && <AlertCircle size={15} className="text-red-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {revealed && (
                <div className="bg-[#F7F7FB] border border-brand-navy/8 rounded-2xl p-4 animate-message-in">
                  <p className="text-xs font-semibold text-brand-navy/35 uppercase tracking-widest mb-1.5">Explanation</p>
                  <p className="text-[13px] text-brand-navy/70 leading-relaxed">{currentQ.explanation}</p>
                </div>
              )}

              {selectedOption !== null && !revealed && (
                <button
                  onClick={() => setRevealed(true)}
                  className="text-xs font-semibold text-brand-orange/65 hover:text-brand-orange underline underline-offset-2 transition-colors duration-150"
                >
                  Show explanation
                </button>
              )}
            </div>
          )}

          {/* Review */}
          {phase === 'review' && (
            <div className="p-6 space-y-3">
              <div className="mb-3">
                <h3 className="text-heading text-brand-navy font-heading">Review</h3>
                <p className="text-xs text-brand-navy/35 mt-0.5">{answered}/{totalQuestions} answered · {flagged.size} flagged</p>
              </div>

              {questions.map((q, i) => {
                const userAns = answers[q.id];
                const isCorrect = userAns === q.correct;
                const isAnswered = userAns !== undefined;
                const subC = SUBJECT_COLORS[q.subject] ?? SUBJECT_COLORS.Physics;

                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border p-4 cursor-pointer hover:-translate-y-px hover:shadow-card transition-all duration-150 ${
                      !isAnswered
                        ? 'border-brand-navy/8 bg-brand-navy/[0.015]'
                        : isCorrect
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-red-200 bg-red-50/50'
                    }`}
                    onClick={() => { setCurrent(i); setPhase('quiz'); setRevealed(true); }}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-xs font-bold mt-0.5 ${
                        !isAnswered
                          ? 'bg-brand-navy/8 text-brand-navy/35'
                          : isCorrect
                            ? 'bg-emerald-500 text-white'
                            : 'bg-red-500 text-white'
                      }`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${subC.badge}`}>{q.subject}</span>
                          {flagged.has(q.id) && <Flag size={10} className="text-amber-400" />}
                          {!isAnswered && <span className="text-xs font-medium text-brand-navy/35">Unanswered</span>}
                        </div>
                        <p className="text-xs font-medium text-brand-navy/65 leading-snug line-clamp-2">{q.question}</p>
                        {isAnswered && (
                          <p className={`text-xs font-semibold mt-1 ${isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
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

          {/* Results */}
          {phase === 'results' && (
            <div className="p-8 flex flex-col items-center text-center gap-6">
              <ScoreRing score={score} total={totalQuestions} />

              <div>
                <h3 className="text-display text-brand-navy font-heading">
                  {score >= totalQuestions * 0.75
                    ? 'Excellent Work!'
                    : score >= totalQuestions * 0.5
                      ? 'Good Effort!'
                      : 'Keep Practising!'}
                </h3>
                <p className="text-brand-navy/45 text-[13px] mt-1">
                  You scored <span className="font-semibold text-brand-navy">{score}/{totalQuestions}</span> correct.
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
                      <span className="text-xs font-semibold flex-1 text-left">{subj}</span>
                      <span className="text-xs font-semibold">{subScore}/{subQs.length}</span>
                      <div className="w-20 h-1 rounded-full bg-black/8 overflow-hidden">
                        <div className={`h-full ${dot} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 w-full max-w-sm">
                <Button
                  variant="outline"
                  onClick={resetAll}
                  className="flex-1 h-10 rounded-xl border-brand-navy/15 text-brand-navy/55 font-medium hover:bg-brand-navy/5 transition-colors duration-150"
                >
                  <RotateCcw size={14} className="mr-1.5" />
                  Retry
                </Button>
                <Button
                  onClick={() => setPhase('review')}
                  className="flex-1 h-10 rounded-xl bg-brand-orange text-white font-semibold shadow-card hover:bg-brand-orange-hover transition-colors duration-150"
                >
                  Review
                  <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav — quiz */}
        {phase === 'quiz' && (
          <div className="flex items-center gap-3 px-6 py-4 border-t border-brand-navy/8 bg-white">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={current === 0}
              className="h-9 px-4 rounded-xl border-brand-navy/15 text-brand-navy/45 font-medium hover:bg-brand-navy/5 disabled:opacity-25 transition-colors duration-150"
            >
              <ChevronLeft size={15} className="mr-1" />
              Prev
            </Button>

            <div className="flex-1 flex justify-center gap-1.5">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrent(i); setRevealed(false); }}
                  className={`rounded-full transition-all duration-150 ${
                    i === current
                      ? 'w-4 h-2 bg-brand-orange'
                      : answers[questions[i].id] !== undefined
                        ? 'w-2 h-2 bg-brand-orange/35'
                        : 'w-2 h-2 bg-brand-navy/12'
                  }`}
                />
              ))}
            </div>

            {current < totalQuestions - 1 ? (
              <Button
                onClick={goNext}
                className="h-9 px-4 rounded-xl bg-brand-orange text-white font-semibold shadow-card hover:bg-brand-orange-hover transition-colors duration-150"
              >
                Next
                <ChevronRight size={15} className="ml-1" />
              </Button>
            ) : (
              <Button
                onClick={() => setPhase('review')}
                className="h-9 px-4 rounded-xl bg-brand-navy text-white font-semibold hover:bg-brand-navy/85 transition-colors duration-150"
              >
                Finish
                <CheckCircle2 size={14} className="ml-1.5" />
              </Button>
            )}
          </div>
        )}

        {/* Bottom nav — review */}
        {phase === 'review' && (
          <div className="flex gap-3 px-6 py-4 border-t border-brand-navy/8 bg-white">
            <Button
              variant="outline"
              onClick={() => { setCurrent(0); setPhase('quiz'); setRevealed(false); }}
              className="flex-1 h-9 rounded-xl border-brand-navy/15 text-brand-navy/55 font-medium hover:bg-brand-navy/5 transition-colors duration-150"
            >
              Back to Quiz
            </Button>
            <Button
              onClick={() => setPhase('results')}
              className="flex-1 h-9 rounded-xl bg-brand-orange text-white font-semibold shadow-card hover:bg-brand-orange-hover transition-colors duration-150"
            >
              Submit & Results
              <CheckCircle2 size={14} className="ml-1.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
