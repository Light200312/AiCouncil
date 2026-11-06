
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { createDebateSession } from '../services/debate'

const modes = [
  {
    id: 'manual',
    title: 'Manual',
    description: 'You decide when the next expert speaks.',
  },
  {
    id: 'auto',
    title: 'Auto',
    description: 'Experts debate automatically until the argument limit.',
  },
  {
    id: 'semi_auto',
    title: 'Semi-auto',
    description: 'Runs automatically but pauses when an expert needs your input.',
  },
]

export default function DebateSetup() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const { topic, domains = [], experts = [] } = state || {}

  const [mode, setMode] = useState('manual')
  const [argumentLimit, setArgumentLimit] = useState(10)

  const createMutation = useMutation({
    mutationFn: createDebateSession,
    onSuccess: session => {
      navigate(`/debate/${session._id}`, { state: { session } })
    },
  })

  if (!topic || experts.length < 2) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="text-xl font-semibold">
          Debate setup is incomplete
        </h1>

        <p className="mt-2 text-sm text-text-secondary">
          Go back and choose a topic and at least two council members.
        </p>

        <button
          onClick={() => navigate('/configure')}
          className="mt-5 rounded-xl bg-brand px-4 py-2 text-white"
        >
          Start again
        </button>
      </div>
    )
  }

  const handleStart = () => {
    createMutation.mutate({
      topic,
      domains: domains.map(domain =>
        typeof domain === 'string' ? domain : domain._id
      ),
      experts,
      mode,
      argumentLimit: mode === 'manual' ? null : argumentLimit,
    })
  }

  return (
    <div className="min-h-screen bg-app px-4 pt-8 pb-32 text-text-primary">
      <main className="mx-auto max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-sm text-text-secondary hover:text-text-primary"
        >
          ← Back to council
        </button>

        <header className="mb-8">
          <p className="text-xs font-semibold tracking-widest text-brand">
            FINAL STEP
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Set up your debate
          </h1>

          <p className="mt-2 text-sm text-text-secondary">
            Choose how the council should conduct the discussion.
          </p>
        </header>

        {/* Topic summary */}
        <section className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-semibold tracking-wider text-text-secondary">
            DEBATE TOPIC
          </p>

          <h2 className="mt-2 text-lg font-semibold">{topic}</h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {domains.map(domain => (
              <span
                key={typeof domain === 'string' ? domain : domain._id}
                className="rounded-full bg-surface-hover px-3 py-1 text-xs text-text-secondary"
              >
                {typeof domain === 'string' ? domain : domain.name}
              </span>
            ))}
          </div>
        </section>

        {/* Debate mode */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Debate mode</h2>

          <p className="mb-4 mt-1 text-sm text-text-secondary">
            Choose how much control you want over the discussion.
          </p>

          <div className="grid gap-3">
            {modes.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  mode === item.id
                    ? 'border-brand bg-brand/10 ring-1 ring-brand/30'
                    : 'border-border bg-surface hover:border-brand/50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{item.title}</span>

                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      mode === item.id
                        ? 'border-brand bg-brand text-white'
                        : 'border-border'
                    }`}
                  >
                    {mode === item.id ? '✓' : ''}
                  </span>
                </div>

                <p className="mt-1 text-sm text-text-secondary">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Argument limit */}
        {mode !== 'manual' && (
          <section className="mt-6 rounded-xl border border-border bg-surface p-5">
            <label
              htmlFor="argumentLimit"
              className="block text-sm font-semibold"
            >
              Argument limit
            </label>

            <p className="mt-1 text-sm text-text-secondary">
              Maximum number of expert responses before the automatic debate stops.
            </p>

            <div className="mt-4 flex items-center gap-4">
              <input
                id="argumentLimit"
                type="range"
                min="2"
                max="30"
                value={argumentLimit}
                onChange={event =>
                  setArgumentLimit(Number(event.target.value))
                }
                className="w-full accent-brand"
              />

              <span className="w-10 text-right font-semibold tabular-nums">
                {argumentLimit}
              </span>
            </div>
          </section>
        )}

        {/* Council summary */}
        <section className="mt-8 rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Your council</h2>
            <span className="text-sm text-text-secondary">
              {experts.length}/12 members
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {experts.map(expert => (
              <span
                key={expert._id}
                title={expert.role}
                className="rounded-full border border-border bg-surface-hover px-3 py-1.5 text-sm"
              >
                {expert.name}

                {expert.isTemporary && (
                  <span className="ml-1 text-xs text-brand">AI</span>
                )}
              </span>
            ))}
          </div>
        </section>

        {createMutation.isError && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-400"
          >
            {createMutation.error?.response?.data?.message ||
              'Could not create the debate. Please try again.'}
          </p>
        )}
      </main>

      {/* Floating footer */}
      <footer className="fixed bottom-5 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 items-center justify-between gap-4 rounded-2xl border border-border bg-surface/95 px-4 py-3 shadow-2xl backdrop-blur-lg">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {mode === 'manual'
              ? 'Manual debate'
              : `${mode === 'auto' ? 'Auto' : 'Semi-auto'} · ${argumentLimit} responses`}
          </p>

          <p className="text-xs text-text-secondary">
            {experts.length} council members
          </p>
        </div>

        <button
          onClick={handleStart}
          disabled={createMutation.isPending}
          className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {createMutation.isPending ? 'Creating...' : 'Start Debate →'}
        </button>
      </footer>
    </div>
  )
}
