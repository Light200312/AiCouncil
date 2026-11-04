
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { logoutUser } from '../services/auth'
import { useCurrentUser } from '../hooks/useCurrentUser'

function Dashboard() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSettled: () => {
      queryClient.clear()
      navigate('/login', { replace: true })
    },
  })

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome to AI Council</h1>
            <p className="mt-2 text-slate-600">
              Hello, {user?.name}
            </p>
          </div>

          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
