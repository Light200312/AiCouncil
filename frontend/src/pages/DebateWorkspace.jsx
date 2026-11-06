
import { useLocation, useParams, useNavigate } from 'react-router-dom'

export default function DebateWorkspace() {
  const { sessionId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const session = state?.session

  return (
    <main className="min-h-screen bg-app px-6 py-12 text-text-primary">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-brand">AI COUNCIL</p>

        <h1 className="mt-3 text-2xl font-bold">
          {session?.topic || 'Debate session created'}
        </h1>

        <p className="mt-3 text-sm text-text-secondary">
          Your debate session has been created successfully.
          The debate workspace and AI orchestration will be implemented next.
        </p>

        <div className="mt-6 rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-text-secondary">Session ID</p>
          <p className="mt-1 break-all font-mono text-sm">{sessionId}</p>

          {session && (
            <>
              <p className="mt-4 text-sm text-text-secondary">Mode</p>
              <p className="mt-1 capitalize">{session.mode.replace('_', ' ')}</p>

              <p className="mt-4 text-sm text-text-secondary">Council members</p>
              <p className="mt-1">{session.council.length}</p>
            </>
          )}
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="mt-6 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white"
        >
          Back to Dashboard
        </button>
      </div>
    </main>
  )
}
