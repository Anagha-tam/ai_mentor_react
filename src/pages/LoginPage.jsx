import { useState } from 'react'
import { loginUser } from '../Services/api'
import { Button } from "@/components/ui/button"
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage({ onSwitchToSignUp, onLoginSuccess }) {
  const navigate = useNavigate(); 
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = await loginUser({ email, password })
      
      if (data.success) {
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        alert("Logged in successfully!")
        if (onLoginSuccess) {
           onLoginSuccess(data.data.user)
        }
         navigate("/chat");
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-6 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-md border border-gray-300 !border-gray-300">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            Sign in
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          {error && <div className="text-sm font-medium text-red-500 text-center">{error}</div>}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="mail@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a href="#" className="text-xs text-muted-foreground hover:underline">
                Forgot password?
              </a>
            </div>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white">
            {loading ? 'Logging in...' : 'Login'}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
          </div>
          {/* <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="w-full">
              Google
            </Button>
            <Button variant="outline" className="w-full">
              Github
            </Button>
          </div> */}
        </CardContent>
        </form>
        <CardFooter className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground">
          Don't have an account?{" "}
          <button 
            onClick={() => navigate("/signup")}
            className="font-medium text-primary hover:underline underline-offset-4"
          >
            Sign up
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}
