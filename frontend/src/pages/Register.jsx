
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../services/auth'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (user) => {
      queryClient.setQueryData(['currentUser'], user)
      navigate('/dashboard', { replace: true })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    registerMutation.mutate({ name, email, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-xl bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
          <p className="mt-2 text-sm text-slate-500">
            Join AI Council and start exploring ideas.
          </p>
        </div>

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            minLength={2}
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 outline-none focus:border-blue-500"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {registerMutation.isError && (
          <p className="text-sm text-red-600">
            {registerMutation.error.response?.data?.message ||
              'Unable to create account. Please try again.'}
          </p>
        )}

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {registerMutation.isPending ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}

export default Register
