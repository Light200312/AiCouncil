
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logoutUser } from '../services/auth'
import { useCurrentUser } from '../hooks/useCurrentUser'
import Sidebar from '../components/layout/Sidebar'
import Navbar from '../components/layout/Navbar'

function Dashboard() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: user } = useCurrentUser()

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.clear()
      navigate('/login', { replace: true })
    },
  })

  return (
    <div className="flex min-h-screen bg-app text-text-primary">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        onLogout={() => logoutMutation.mutate()}
        logoutPending={logoutMutation.isPending}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <Navbar
          title="Dashboard"
          subtitle="AI Council"
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        >
          <Link
            to="/configure"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover"
          >
            + New Debate
          </Link>
        </Navbar>

        <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-5 sm:p-8">
          {/* Welcome */}
          <section>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back, {user?.name || 'there'}
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Explore ideas and challenge perspectives with your AI council.
            </p>
          </section>

          {/* Recent discussions */}
          <section>
            <div className="mb-4">
              <h2 className="font-semibold">Your Discussions</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Continue where you left off.
              </p>
            </div>

            <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-4 py-8 text-center">
              <p className="text-sm font-medium">No discussions yet</p>
              <p className="mt-1 text-sm text-text-secondary">
                Your created and forked debates will appear here.
              </p>
              <Link
                to="/configure"
                className="mt-4 text-sm font-medium text-link hover:underline"
              >
                Start your first debate →
              </Link>
            </div>
          </section>

          {/* Public debate discovery */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-semibold">Debate of the Day</h2>
                <span className="rounded-full border border-border px-2 py-1 text-xs text-text-secondary">
                  Featured
                </span>
              </div>

              <div className="flex min-h-32 flex-col items-center justify-center rounded-md bg-app text-center">
                <p className="text-sm font-medium">Coming soon</p>
                <p className="mt-1 text-xs text-text-secondary">
                  Discover a featured community debate every day.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-semibold">Popular Debates</h2>
                <span className="rounded-full border border-border px-2 py-1 text-xs text-text-secondary">
                  Community
                </span>
              </div>

              <div className="flex min-h-32 flex-col items-center justify-center rounded-md bg-app text-center">
                <p className="text-sm font-medium">Coming soon</p>
                <p className="mt-1 text-xs text-text-secondary">
                  Explore the most popular public discussions.
                </p>
              </div>
            </div>
          </section>

          {logoutMutation.isError && (
            <p className="text-sm text-red-400">
              Sign out failed. Please try again.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard
