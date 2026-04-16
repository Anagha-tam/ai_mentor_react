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
    <div className="flex min-h-screen bg-background">
      {/* Left Section: Form (50%) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-20 xl:px-24 overflow-y-auto">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-left">
            <h2 className="text-4xl font-black text-brand-navy tracking-tighter font-heading">
              Create an account
            </h2>
            <p className="mt-2 text-sm text-brand-navy/60 font-medium">
              Join the future of AI-driven mentorship
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-sm bg-red-50 border border-red-100 text-red-500 px-4 py-3 rounded-xl text-center font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstname" className="text-sm font-semibold text-brand-navy ml-1">
                    First Name
                  </Label>
                  <Input
                    className="h-11 rounded-xl border-brand-navy/20 bg-white focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all font-sans"
                    id="firstname"
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastname" className="text-sm font-semibold text-brand-navy ml-1">
                    Last Name
                  </Label>
                  <Input
                    className="h-11 rounded-xl border-brand-navy/20 bg-white focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all font-sans"
                    id="lastname"
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-brand-navy ml-1">
                  Phone Number
                </Label>
                <Input
                  className={`h-11 rounded-xl bg-white focus:bg-white focus:ring-4 transition-all font-sans ${
                    phoneError
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
                      : 'border-brand-navy/20 focus:border-brand-orange focus:ring-brand-orange/10'
                  }`}
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                />
                {phoneError && (
                  <p className="text-xs text-red-500 font-medium ml-1">{phoneError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-brand-navy ml-1">
                  Email
                </Label>
                <Input
                  className="h-11 rounded-xl border-brand-navy/20 bg-white focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all font-sans"
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-brand-navy ml-1">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    className="h-11 rounded-xl border-brand-navy/20 bg-white focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all font-sans"
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

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 flex justify-center items-center rounded-xl shadow-lg shadow-brand-orange/20 text-sm font-bold text-white bg-brand-orange hover:bg-brand-orange/90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </div>
            </form>

            <div className="mt-8 text-center bg-brand-navy/5 py-4 rounded-2xl border border-brand-navy/10">
              <p className="text-sm text-brand-navy/70 font-medium">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="font-bold text-brand-orange hover:text-brand-orange/80 hover:underline underline-offset-4 transition-all"
                >
                  Log in
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
            <h2 className="text-5xl font-black text-white mb-6 tracking-tighter leading-none font-heading">Join AI Mentor</h2>
            <p className="text-xl text-white/60 font-medium leading-relaxed tracking-tight">
             Crack Your Entrance Exams with Your Personal AI Mentor.
            </p>
            <div className="mt-12 flex gap-2 justify-center">
                <div className="w-2 h-2 rounded-full bg-white/15"></div>
                <div className="w-2 h-2 rounded-full bg-brand-orange"></div>
                <div className="w-2 h-2 rounded-full bg-white/30"></div>
            </div>
        </div>
      </div>
    </div>
  )
}
