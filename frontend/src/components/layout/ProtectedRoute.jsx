
import { Navigate, Outlet } from 'react-router-dom'
import { useCurrentUser } from '../../hooks/useCurrentUser'

function ProtectedRoute() {
  const { data: user, isPending, isError, error, refetch } = useCurrentUser()

  if (isPending) {
    return <div className="p-6 text-center">Checking session...</div>
  }

  if (isError) {
    if (error.response?.status === 401) {
      return <Navigate to="/login" replace />
    }

    return (
      <div className="p-6 text-center">
        <p>Unable to verify your session.</p>
        <button onClick={() => refetch()} className="mt-3 underline">
          Try again
        </button>
      </div>
    )
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
