import { useState } from 'react'

import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function SignUpPage({ onSwitchToLogin }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [stream, setStream] = useState('JEE')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phonenumber: phone,
          stream: stream.toLowerCase(),
          class: parseInt(studentClass, 10),
          password
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        alert("Registration successful! Please log in.")
        onSwitchToLogin() // switch to login view automatically
      } else {
        setError(data.message || 'Registration failed.')
      }
    } catch (err) {
      setError('Failed to connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-6 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-md border border-gray-300 !border-gray-300">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            Create an account
          </CardTitle>
          <CardDescription className="text-center">
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          {error && <div className="text-sm font-medium text-red-500 text-center">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="firstname">First Name</Label>
            <Input 
              id="firstname" 
              type="text" 
              placeholder="John" 
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastname">Last Name</Label>
            <Input 
              id="lastname" 
              type="text" 
              placeholder="Lee" 
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required 
            />
          </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="012345678" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="class">Class</Label>
              <Select value={studentClass} onValueChange={setStudentClass} required>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="9">9</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="11">11</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Stream</Label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="stream" 
                    value="JEE" 
                    checked={stream === 'JEE'} 
                    onChange={(e) => setStream(e.target.value)} 
                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="text-sm font-normal">JEE</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="stream" 
                    value="NEET" 
                    checked={stream === 'NEET'} 
                    onChange={(e) => setStream(e.target.value)} 
                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="text-sm font-normal">NEET</span>
                </label>
              </div>
            </div>
          </div>
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
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white">
            {loading ? 'Signing up...' : 'Sign Up'}
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
          Already have an account?{" "}
          <button 
            onClick={onSwitchToLogin}
            className="font-medium text-primary hover:underline underline-offset-4"
          >
            Log in
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}
