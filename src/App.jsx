import { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'

export default function App() {
  const [currentPage, setCurrentPage] = useState('login')
  const [user, setUser] = useState(null)

  // simple check on load
  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setCurrentPage('login')
  }

  if (user) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-8 text-center gap-4">
        <h1 className="text-3xl font-bold">Welcome, {user.firstName || user.email}!</h1>
        <p className="text-muted-foreground">You have successfully authenticated with the AI Mentor backend.</p>
        <button 
          onClick={handleLogout}
          className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <main>
      {currentPage === 'login' ? (
        <LoginPage 
          onSwitchToSignUp={() => setCurrentPage('signup')} 
          onLoginSuccess={(userData) => setUser(userData)} 
        />
      ) : (
        <SignUpPage onSwitchToLogin={() => setCurrentPage('login')} />
      )}
    </main>
  )
}
