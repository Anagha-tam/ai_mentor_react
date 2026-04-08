import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Noise from '@/components/ui/noise'
import Illustration from "@/assets/Online learning-bro.png"
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
            // Unpack nested "academic" wrapper if present
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
                ...academicData.marks10th // Fallbacks for backend variations
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleMarkChange = (subject, value) => {
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-white font-sans overflow-hidden">
      {/* Left Section: Conversational Multi-Step Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-24">
        <div className="max-w-md w-full mx-auto">
          
          {/* Progress Indicator */}
          <div className="flex gap-2 mb-12">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  s <= step ? 'bg-indigo-600' : 'bg-slate-100'
                }`} 
              />
            ))}
          </div>

          <div className="space-y-8">
            {/* Step 1: Base Identity */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="mb-8">
                   <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100">
                      <GraduationCap className="text-indigo-600" size={24} />
                   </div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Academic Path</h2>
                   <p className="text-slate-500 mt-2 font-medium">Let's start with your current focus.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 ml-1">What is your stream?</Label>
                    <Input 
                      className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg"
                      placeholder="e.g. Science, Commerce..."
                      value={formData.stream}
                      onChange={(e) => handleInputChange('stream', e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-slate-700 ml-1">Which class are you in?</Label>
                    <div className="flex gap-4">
                      {['11', '12'].map((c) => (
                        <button
                          key={c}
                          onClick={() => handleInputChange('class', c)}
                          className={`flex-1 h-16 rounded-2xl border-2 font-black text-xl transition-all ${
                            formData.class === c 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100' 
                              : 'border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
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

            {/* Step 2: Performance Data */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="mb-8">
                   <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100">
                      <Award className="text-indigo-600" size={24} />
                   </div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Previous Records</h2>
                   <p className="text-slate-500 mt-2 font-medium">Precision helps us tailor your plan.</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(formData.marks).map((subject) => (
                      <div key={subject} className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{subject}</Label>
                        <Input 
                          type="number"
                          className="h-12 rounded-xl border-slate-200 bg-slate-50/50 text-center text-lg font-bold"
                          placeholder="00"
                          value={formData.marks[subject]}
                          onChange={(e) => handleMarkChange(subject, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 ml-1">10th CGPA / Percentage</Label>
                    <Input 
                      type="number"
                      step="0.1"
                      className="h-12 rounded-xl border-slate-200 bg-slate-50/50 text-lg font-bold"
                      placeholder="e.g. 9.8"
                      value={formData.cgpa10}
                      onChange={(e) => handleInputChange('cgpa10', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Goals */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="mb-8">
                   <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100">
                      <Target className="text-indigo-600" size={24} />
                   </div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Your Ambition</h2>
                   <p className="text-slate-500 mt-2 font-medium">What is your target endpoint?</p>
                </div>

                <div className="space-y-3">
                   <Label className="text-sm font-bold text-slate-700 ml-1">Which exam are you preparing for?</Label>
                   <div className="flex flex-col gap-3">
                     {['JEE', 'NEET', 'KEAM'].map((exam) => (
                       <button
                         key={exam}
                         onClick={() => handleInputChange('entranceExam', exam)}
                         className={`w-full h-14 rounded-xl border-2 px-6 flex items-center justify-between font-bold transition-all ${
                           formData.entranceExam === exam 
                             ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                             : 'border-slate-100 text-slate-500 hover:border-slate-200'
                         }`}
                       >
                         {exam}
                         {formData.entranceExam === exam && <CheckCircle2 size={18} className="text-indigo-600" />}
                       </button>
                     ))}
                   </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-8">
              {step > 1 && (
                <Button 
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="h-14 px-8 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                >
                  <ChevronLeft size={20} className="mr-2" />
                  Back
                </Button>
              )}
              
              {step < 3 ? (
                <Button 
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && !formData.stream}
                  className="h-14 flex-1 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  Continue
                  <ChevronRight size={20} className="ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSave}
                  disabled={loading}
                  className="h-14 flex-1 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  {loading ? 'Creating Profile...' : 'Complete Profile'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Section: Minimalist Branding (Preserved) */}
      <div className="hidden lg:flex relative w-1/2 flex-col justify-center items-center bg-[#A7C0ED] border-l border-slate-100 px-12 overflow-hidden">
        <Noise
          patternSize={250}
          patternScaleX={1}
          patternScaleY={1}
          patternRefreshInterval={2}
          patternAlpha={10}
        />
        
        <div className="relative z-10 max-w-md text-center">
            <img 
              src={Illustration} 
              alt="Academic Illustration" 
              className="w-full max-w-[320px] h-auto mx-auto mb-12 drop-shadow-3xl animate-floating" 
            />
            <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter leading-none">Your Journey</h2>
            <p className="text-xl text-slate-500 font-medium leading-relaxed tracking-tight">
              Personalizing your academic path with artificial intelligence.
            </p>
            <div className="mt-12 flex gap-4 justify-center">
                <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`} />
                <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`} />
                <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 3 ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`} />
            </div>
        </div>
      </div>
    </div>
  )
}
