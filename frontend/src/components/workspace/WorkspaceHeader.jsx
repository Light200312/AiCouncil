import { ChevronLeft, ChevronRight, Settings2 } from 'lucide-react'

export default function WorkspaceHeader({
  collapsed,
  session,
  sessionNumber,
  mode,
  councilCount,
  onToggleSidebar,topic
}) {
  return (
    <header className="flex min-h-[68px] flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-1 lg:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={onToggleSidebar} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="hidden rounded-md p-1.5 text-text-secondary hover:bg-surface-hover md:block">
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-sm font-bold sm:text-base"> {topic}</h1>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
              session?.status === 'active'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'border-border bg-surface-hover text-text-secondary'
            }`}>
              {session?.status === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
              {session?.status?.toUpperCase() || 'LOADING'}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] capitalize text-text-secondary">{mode} mode{session?.argumentLimit ? ` · ${session.argumentLimit} response limit` : ''}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="hidden items-center gap-2 rounded-xl border border-border bg-app px-3 py-2 xl:flex">
          <Settings2 size={16} className="text-text-secondary" />
          <span><span className="block text-[9px] font-semibold tracking-[0.16em] text-text-secondary">SESSION SETTINGS</span><span className="text-[11px] font-medium capitalize text-text-primary">{mode} · {councilCount} members</span></span>
        </div>
        <button type="button" disabled className="hidden rounded-md border border-border px-3 py-2 text-xs font-medium text-text-secondary opacity-70 sm:block">Conclude Debate</button>
      </div>
    </header>
  )
}
