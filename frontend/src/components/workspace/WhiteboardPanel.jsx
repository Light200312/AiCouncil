import { CircleHelp, FileText, ShieldCheck, X } from 'lucide-react'

export default function WhiteboardPanel({ visible, onHide, onShow }) {
  if (!visible) {
    return (
      <button onClick={onShow} className="hidden h-fit shrink-0 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-hover xl:flex">
        <FileText size={15} /> Show Whiteboard
      </button>
    )
  }

  return (
    <aside className="hidden w-[300px] shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm xl:flex 2xl:w-[360px]">
      <div className="flex items-center justify-between border-b border-border bg-surface-hover px-4 py-4">
        <div>
          <h2 className="text-xs font-bold tracking-wide">WHITEBOARD</h2>
          <p className="mt-1 font-mono text-[9px] text-text-secondary">0 open · 0 resolved</p>
        </div>
        <button onClick={onHide} title="Hide whiteboard" className="rounded-md p-1 text-text-secondary hover:bg-app"><X size={15} /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="mb-3 flex items-center gap-2 px-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-400">
          <CircleHelp size={13} /> Open questions <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-950 dark:text-amber-300">0</span>
        </div>
        <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-4 py-7 text-center dark:border-amber-900 dark:bg-amber-950/20">
          <CircleHelp size={20} className="mx-auto text-amber-600 dark:text-amber-500" />
          <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-200">No open questions yet</p>
          <p className="mt-1 text-[10px] leading-4 text-text-secondary">Questions raised during the discussion will appear here.</p>
        </div>
        <div className="mb-3 mt-6 flex items-center gap-2 px-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
          <ShieldCheck size={13} /> Resolved <span className="ml-auto rounded-full bg-surface-hover px-1.5 py-0.5">0</span>
        </div>
        <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center">
          <p className="text-[10px] text-text-secondary">Resolved items will be collected here.</p>
        </div>
      </div>
    </aside>
  )
}
