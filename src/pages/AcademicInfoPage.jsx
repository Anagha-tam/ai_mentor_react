import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Noise from '@/components/ui/noise'
// import Illustration from "@/assets/Online learning-bro.png"
import { getProfileData, saveOnboardingData } from '../Services/api'
import { ChevronRight, ChevronLeft, CheckCircle2, GraduationCap, Award, Target } from 'lucide-react'

export default function AcademicInfoPage({ user, onProfileComplete }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    stream: '',
    class: '11',
    marks: {
      physics: '',
      chemistry: '',
      maths: '',
      biology: ''
    },
    cgpa10: '',
    entranceExam: 'JEE'
  })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getProfileData()
        if (profile.success && profile.data) {
          let pData = profile.data;
          if (Array.isArray(pData) && pData.length > 0) {
            pData = pData[0];
          } else if (Array.isArray(pData)) {
            pData = null;
          }

          if (pData) {
            const academicData = pData.academic ? { ...pData, ...pData.academic } : pData;

            setFormData(prev => ({
              ...prev,
              stream: academicData.stream || prev.stream,
              class: academicData.class?.toString() || prev.class,
              cgpa10: academicData.cgpa10th || academicData.cgpa10 || prev.cgpa10,
              entranceExam: academicData.entrance?.examtype || academicData.entranceExam || prev.entranceExam,
              marks: {
                ...prev.marks,
                ...academicData.marks,
                ...academicData.marks10th
              }
            }))
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile data:", err)
      } finally {
        setFetching(false)
      }
    }
    fetchProfile()
  }, [])

  const [markErrors, setMarkErrors] = useState({})
  const [cgpaError, setCgpaError] = useState('')

  const handleInputChange = (field, value) => {
    if (field === 'cgpa10') {
      if (/^d*.?d{2,}$/.test(value)) return
      const num = parseFloat(value)
      if (value !== '' && (num < 0 || num > 10)) {
        setCgpaError('CGPA must be between 0 and 10')
        return
      }
      setCgpaError('')
    }
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleMarkChange = (subject, value) => {
    if (value.includes('.')) return
    const num = parseInt(value, 10)
    if (value !== '' && (num < 0 || num > 100)) {
      setMarkErrors(prev => ({ ...prev, [subject]: 'Max 100' }))
      return
    }
    setMarkErrors(prev => ({ ...prev, [subject]: '' }))
    setFormData(prev => ({
      ...prev,
      marks: { ...prev.marks, [subject]: value }
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await saveOnboardingData(formData)
      if (onProfileComplete) {
        onProfileComplete(formData)
      }
      navigate('/chat')
    } catch (err) {
      alert("Failed to save data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7FB]">
        <div className="w-8 h-8 border-2 border-brand-navy/10 border-t-brand-orange rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F7F7FB] font-sans overflow-hidden">
      {/* Left: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-24 bg-white">
        <div className="max-w-md w-full mx-auto">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-xl bg-brand-orange flex items-center justify-center shadow-card">
              <span className="text-white text-sm font-bold font-heading">M</span>
            </div>
            <span className="text-[15px] font-bold text-brand-navy font-heading">AI Mentor</span>
          </div>

          {/* Step progress bar */}
          <div className="flex gap-1.5 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-400 ${
                  s <= step ? 'bg-brand-orange' : 'bg-brand-navy/8'
                }`}
              />
            ))}
          </div>

          <div className="space-y-7">

            {/* Step 1 */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-7">
                  <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center mb-4">
                    <GraduationCap className="text-brand-orange" size={20} />
                  </div>
                  <h2 className="text-display text-brand-navy font-heading">Academic Path</h2>
                  <p className="text-[13px] text-brand-navy/45 mt-1.5 font-medium">Let's start with your current focus.</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-brand-navy">Your stream</Label>
                    <div className="flex flex-col gap-2">
                      {[
                        { value: 'Science (Biology)', label: 'Science', sub: 'Biology' },
                        { value: 'Science (Computer Science)', label: 'Science', sub: 'Computer Science' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleInputChange('stream', opt.value)}
                          className={`w-full h-12 rounded-xl border-2 px-4 flex items-center justify-between font-semibold text-[13px] transition-all duration-150 ${
                            formData.stream === opt.value
                              ? 'border-brand-orange bg-brand-orange/8 text-brand-navy'
                              : 'border-brand-navy/10 text-brand-navy/45 hover:border-brand-navy/20 hover:bg-brand-navy/[0.025]'
                          }`}
                        >
                          <span>
                            {opt.label}{' '}
                            <span className="font-normal opacity-60">({opt.sub})</span>
                          </span>
                          {formData.stream === opt.value && <CheckCircle2 size={16} className="text-brand-orange" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold text-brand-navy">Current class</Label>
                    <div className="flex gap-3">
                      {['11', '12'].map((c) => (
                        <button
                          key={c}
                          onClick={() => handleInputChange('class', c)}
                          className={`flex-1 h-14 rounded-xl border-2 font-bold text-xl transition-all duration-150 ${
                            formData.class === c
                              ? 'border-brand-orange bg-brand-orange/8 text-brand-navy'
                              : 'border-brand-navy/10 text-brand-navy/35 hover:border-brand-navy/20 hover:bg-brand-navy/[0.025]'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-7">
                  <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center mb-4">
                    <Award className="text-brand-orange" size={20} />
                  </div>
                  <h2 className="text-display text-brand-navy font-heading">Previous Records</h2>
                  <p className="text-[13px] text-brand-navy/45 mt-1.5 font-medium">Precision helps us tailor your plan.</p>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    {Object.keys(formData.marks).map((subject) => (
                      <div key={subject} className="space-y-1.5">
                        <Label className="text-xs font-semibold text-brand-navy/45 uppercase tracking-widest capitalize">{subject}</Label>
                        <Input
                          type="number" min="0" max="100" step="1"
                          className={`h-11 rounded-xl bg-[#F7F7FB] text-center text-base font-semibold focus:bg-white transition-all duration-150 ${
                            markErrors[subject]
                              ? 'border-red-300 focus:border-red-400'
                              : 'border-brand-navy/12 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15'
                          }`}
                          placeholder="00"
                          value={formData.marks[subject]}
                          onChange={(e) => handleMarkChange(subject, e.target.value)}
                        />
                        {markErrors[subject] && (
                          <p className="text-xs text-red-500 font-medium">{markErrors[subject]}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-brand-navy">10th CGPA / Percentage</Label>
                    <Input
                      type="number" step="0.1" min="0" max="10"
                      className={`h-11 rounded-xl bg-[#F7F7FB] text-base font-semibold focus:bg-white transition-all duration-150 ${
                        cgpaError
                          ? 'border-red-300 focus:border-red-400'
                          : 'border-brand-navy/12 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15'
                      }`}
                      placeholder="e.g. 9.7"
                      value={formData.cgpa10}
                      onChange={(e) => handleInputChange('cgpa10', e.target.value)}
                    />
                    {cgpaError && <p className="text-xs text-red-500 font-medium">{cgpaError}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-7">
                  <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center mb-4">
                    <Target className="text-brand-orange" size={20} />
                  </div>
                  <h2 className="text-display text-brand-navy font-heading">Your Goal</h2>
                  <p className="text-[13px] text-brand-navy/45 mt-1.5 font-medium">Which exam are you targeting?</p>
                </div>

                <div className="space-y-2">
                  {['JEE', 'NEET'].map((exam) => (
                    <button
                      key={exam}
                      onClick={() => handleInputChange('entranceExam', exam)}
                      className={`w-full h-12 rounded-xl border-2 px-5 flex items-center justify-between font-semibold text-[13px] transition-all duration-150 ${
                        formData.entranceExam === exam
                          ? 'border-brand-orange bg-brand-orange/8 text-brand-navy'
                          : 'border-brand-navy/10 text-brand-navy/45 hover:border-brand-navy/20 hover:bg-brand-navy/[0.025]'
                      }`}
                    >
                      {exam}
                      {formData.entranceExam === exam && <CheckCircle2 size={16} className="text-brand-orange" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nav buttons */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="h-11 px-5 rounded-xl border-brand-navy/15 text-brand-navy/50 font-medium hover:bg-brand-navy/5 transition-colors duration-150"
                >
                  <ChevronLeft size={16} className="mr-1.5" />
                  Back
                </Button>
              )}

              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && !formData.stream}
                  className="h-11 flex-1 rounded-xl bg-brand-orange text-white font-semibold shadow-card hover:bg-brand-orange-hover hover:-translate-y-px active:translate-y-0 transition-all duration-150 disabled:opacity-40"
                >
                  Continue
                  <ChevronRight size={16} className="ml-1.5" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="h-11 flex-1 rounded-xl bg-brand-orange text-white font-semibold shadow-card hover:bg-brand-orange-hover hover:-translate-y-px active:translate-y-0 transition-all duration-150"
                >
                  {loading ? 'Saving…' : 'Complete Setup'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Brand panel with step indicators */}
      <div className="hidden lg:flex relative w-1/2 flex-col justify-center items-center bg-brand-navy px-12 overflow-hidden">
        <Noise
          patternSize={250}
          patternScaleX={1}
          patternScaleY={1}
          patternRefreshInterval={2}
          patternAlpha={12}
        />
        <div className="relative z-10 max-w-md text-center">
          <h2 className="text-5xl font-bold text-white mb-5 tracking-tight leading-none font-heading">Your Journey</h2>
          <p className="text-lg text-white/45 font-medium leading-relaxed">
            Personalizing your academic path with AI.
          </p>
          <div className="mt-10 flex gap-3 justify-center">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s ? 'w-8 bg-brand-orange' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
