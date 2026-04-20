import { useState } from 'react'
import { loginUser, getProfileData } from '../Services/api'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useNavigate } from 'react-router-dom'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Noise from '@/components/ui/noise'
import Illustration from "@/assets/image3.png"

export default function LoginPage({ onSwitchToSignUp, onLoginSuccess }) {
  const navigate = useNavigate(); 
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = await loginUser({ email, password })
      console.log('Login successful response data:', data)
      
      if (data.success && data.data) {
        if (data.data.token) {
          localStorage.setItem('token', data.data.token)
        }
        
        let userData = data.data.user || data.data.student;
        
        // Real-time Check for Academic Info
        try {
          const profileResponse = await getProfileData();
          if (profileResponse.success && profileResponse.data) {
            // Handle both Array and Object responses seamlessly
            let pData = profileResponse.data;
            if (Array.isArray(pData) && pData.length > 0) {
              pData = pData[0];
            } else if (Array.isArray(pData)) {
              pData = null;
            }
            
            if (pData) {
              // Extract academic info if nested to match our top-level routing check
              if (pData.academic) {
                userData = { ...userData, ...pData, ...pData.academic };
              } else {
                userData = { ...userData, ...pData };
              }
            }
          }
        } catch (profileErr) {
          console.warn("Failed to fetch fresh profile data, continuing with login info:", profileErr);
        }

        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData))
          alert("Logged in successfully!")
          if (onLoginSuccess) {
             onLoginSuccess(userData)
          }
          
          // Smart Navigation
          if (userData.stream || userData.class) {
            navigate("/chat");
          } else {
            navigate("/academic-info");
          }
        } else {
          setError('User profile data is missing. Please contact support.')
          console.error('User/Student data missing in login response:', data)
        }
      } else {
        setError(data.message || 'Login failed. Please check your credentials.')
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F7F7FB]">
      {/* Left: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-left mb-8">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-xl bg-brand-orange flex items-center justify-center shadow-card">
                <span className="text-white text-sm font-bold font-heading">M</span>
              </div>
              <span className="text-[15px] font-bold text-brand-navy font-heading">AI Mentor</span>
            </div>
            <h2 className="text-display text-brand-navy font-heading">
              Welcome back
            </h2>
            <p className="mt-2 text-[13px] text-brand-navy/45 font-medium">
              Sign in to your mentor dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="text-[13px] bg-red-50 border border-red-100 text-red-500 px-4 py-3 rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-semibold text-brand-navy">
                Email
              </Label>
              <Input
                className="h-11 rounded-xl border-brand-navy/15 bg-[#F7F7FB] focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15 transition-all duration-150 text-[13px]"
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[13px] font-semibold text-brand-navy">
                  Password
                </Label>
                <a href="#" className="text-xs font-medium text-brand-orange hover:text-brand-orange-hover transition-colors duration-150">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Input
                  className="h-11 rounded-xl border-brand-navy/15 bg-[#F7F7FB] focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15 transition-all duration-150 font-sans text-[13px]"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-navy/30 hover:text-brand-navy/60 transition-colors duration-150 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 flex justify-center items-center rounded-xl shadow-card text-[13px] font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover hover:-translate-y-px active:translate-y-0 transition-all duration-150"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[13px] text-brand-navy/45 font-medium">
              New here?{' '}
              <button
                onClick={() => navigate("/signup")}
                className="font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors duration-150"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right: Brand panel */}
      <div className="hidden lg:flex relative w-1/2 flex-col justify-center items-center bg-brand-navy px-12 overflow-hidden">
        <Noise
          patternSize={250}
          patternScaleX={1}
          patternScaleY={1}
          patternRefreshInterval={2}
          patternAlpha={12}
        />
        <div className="relative z-10 max-w-md text-center">
          <h2 className="text-5xl font-bold text-white mb-5 tracking-tight leading-none font-heading">AI Mentor</h2>
          <p className="text-lg text-white/45 font-medium leading-relaxed">
            Your personalized guide to crack entrance exams with confidence.
          </p>
          <div className="mt-10 flex gap-2 justify-center">
            <div className="w-6 h-1.5 rounded-full bg-brand-orange" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  )
}
