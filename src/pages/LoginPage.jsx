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
    <div className="flex min-h-screen bg-background">
      {/* Left Section: Form (50%) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-left">
            <h2 className="text-4xl font-black text-brand-navy tracking-tighter font-heading">
              Sign in
            </h2>
            <p className="mt-2 text-sm text-brand-navy/60 font-medium">
              Access your personalized AI mentor dashboard
            </p>
          </div>

          <div className="mt-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="text-sm bg-red-50 border border-red-100 text-red-500 px-4 py-3 rounded-xl text-center font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-brand-navy ml-1">
                  Email
                </Label>
                <Input
                  className="h-12 rounded-xl border-brand-navy/20 bg-white focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all"
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-sm font-semibold text-brand-navy">
                    Password
                  </Label>
                  <a href="#" className="text-xs font-bold text-brand-orange hover:text-brand-orange/80 tracking-tight">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    className="h-12 rounded-xl border-brand-navy/20 bg-white focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all font-sans"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-navy/40 hover:text-brand-orange transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 flex justify-center items-center rounded-xl shadow-lg shadow-brand-orange/20 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange/90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  {loading ? 'Sign in...' : 'Sign in'}
                </Button>
              </div>
            </form>

            <div className="mt-8 text-center bg-brand-navy/5 py-4 rounded-2xl border border-brand-navy/10">
              <p className="text-sm text-brand-navy/70 font-medium">
                New here?{" "}
                <button
                  onClick={() => navigate("/signup")}
                  className="font-bold text-brand-orange hover:text-brand-orange/80 hover:underline underline-offset-4 transition-all"
                >
                  Create an account
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section: Minimalist Space (50%) */}
      <div className="hidden lg:flex relative w-1/2 flex-col justify-center items-center bg-brand-navy border-l border-brand-navy/20 px-12 overflow-hidden">
        {/* React Bits Noise Effect */}
        <Noise
          patternSize={250}
          patternScaleX={1}
          patternScaleY={1}
          patternRefreshInterval={2}
          patternAlpha={10}
        />

        <div className="relative z-10 max-w-md text-center">
            <h2 className="text-5xl font-black text-white mb-6 tracking-tighter leading-none font-heading">AI Mentor</h2>
            <p className="text-xl text-white/60 font-medium leading-relaxed tracking-tight">
                  Your personalized guide to crack entrance exams with confidence.            </p>
            <div className="mt-12 flex gap-2 justify-center">
                <div className="w-2 h-2 rounded-full bg-brand-orange"></div>
                <div className="w-2 h-2 rounded-full bg-white/30"></div>
                <div className="w-2 h-2 rounded-full bg-white/15"></div>
            </div>
        </div>
      </div>
    </div>
  )
}
