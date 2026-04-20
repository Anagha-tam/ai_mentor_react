import { useState } from 'react'
import { registerUser } from '../Services/api'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useNavigate } from 'react-router-dom'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Noise from '@/components/ui/noise'
import Illustration from "@/assets/image3.png"

export default function SignUpPage({ onSwitchToLogin }) {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [stream, setStream] = useState('JEE')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
    setPhone(digits)
    if (digits.length > 0 && digits.length < 10) {
      setPhoneError('Phone number must be exactly 10 digits')
    } else {
      setPhoneError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (phone.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits')
      return
    }
    setLoading(true)
    setError('')

    try {
      const data = await registerUser({
        firstName,
        lastName,
        email,
        phonenumber: phone,
        stream: stream.toLowerCase(),
        class: parseInt(studentClass, 10),
        password
      })

      if (data.success) {
        alert("Registration successful! Please log in.")
        navigate("/login");
      } else {
        setError(data.message || 'Registration failed.')
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
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-20 xl:px-24 overflow-y-auto bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-left mb-7">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-xl bg-brand-orange flex items-center justify-center shadow-card">
                <span className="text-white text-sm font-bold font-heading">M</span>
              </div>
              <span className="text-[15px] font-bold text-brand-navy font-heading">AI Mentor</span>
            </div>
            <h2 className="text-display text-brand-navy font-heading">
              Create account
            </h2>
            <p className="mt-2 text-[13px] text-brand-navy/45 font-medium">
              Start your AI-powered exam preparation
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-[13px] bg-red-50 border border-red-100 text-red-500 px-4 py-3 rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstname" className="text-[13px] font-semibold text-brand-navy">First Name</Label>
                <Input
                  className="h-10 rounded-xl border-brand-navy/15 bg-[#F7F7FB] focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15 transition-all duration-150 text-[13px] font-sans"
                  id="firstname" type="text" placeholder="First name"
                  value={firstName} onChange={(e) => setFirstName(e.target.value)} required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastname" className="text-[13px] font-semibold text-brand-navy">Last Name</Label>
                <Input
                  className="h-10 rounded-xl border-brand-navy/15 bg-[#F7F7FB] focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15 transition-all duration-150 text-[13px] font-sans"
                  id="lastname" type="text" placeholder="Last name"
                  value={lastName} onChange={(e) => setLastName(e.target.value)} required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-[13px] font-semibold text-brand-navy">Phone Number</Label>
              <Input
                className={`h-10 rounded-xl bg-[#F7F7FB] focus:bg-white focus:ring-2 transition-all duration-150 text-[13px] font-sans ${
                  phoneError
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-300/20'
                    : 'border-brand-navy/15 focus:border-brand-orange focus:ring-brand-orange/15'
                }`}
                id="phone" type="tel" inputMode="numeric"
                placeholder="10-digit mobile number"
                value={phone} onChange={handlePhoneChange} required
              />
              {phoneError && <p className="text-xs text-red-500 font-medium">{phoneError}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px] font-semibold text-brand-navy">Email</Label>
              <Input
                className="h-10 rounded-xl border-brand-navy/15 bg-[#F7F7FB] focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15 transition-all duration-150 text-[13px] font-sans"
                id="email" type="email" placeholder="name@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[13px] font-semibold text-brand-navy">Password</Label>
              <div className="relative">
                <Input
                  className="h-10 rounded-xl border-brand-navy/15 bg-[#F7F7FB] focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15 transition-all duration-150 text-[13px] font-sans"
                  id="password" type={showPassword ? "text" : "password"}
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-navy/30 hover:text-brand-navy/55 transition-colors duration-150 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 flex justify-center items-center rounded-xl shadow-card text-[13px] font-semibold text-white bg-brand-orange hover:bg-brand-orange-hover hover:-translate-y-px active:translate-y-0 transition-all duration-150"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </Button>
            </div>
          </form>

          <div className="mt-5 text-center">
            <p className="text-[13px] text-brand-navy/45 font-medium">
              Already have an account?{' '}
              <button
                onClick={() => navigate("/login")}
                className="font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors duration-150"
              >
                Sign in
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
          <h2 className="text-5xl font-bold text-white mb-5 tracking-tight leading-none font-heading">Join AI Mentor</h2>
          <p className="text-lg text-white/45 font-medium leading-relaxed">
            Crack your entrance exams with your personal AI mentor.
          </p>
          <div className="mt-10 flex gap-2 justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
            <div className="w-6 h-1.5 rounded-full bg-brand-orange" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  )
}
