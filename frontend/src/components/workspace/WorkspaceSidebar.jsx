import {
  Clock3, GraduationCap, LogOut, Moon, Plus, Sun,
} from 'lucide-react'

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('')

function NavItem({ icon: Icon, children, active = false, collapsed, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? children : undefined}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition
        ${active
          ? 'bg-brand text-white'
          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'}
        ${collapsed ? 'justify-center px-2' : ''}`}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="truncate">{children}</span>}
      {!collapsed && active && <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />}
    </button>
  )
}

function SectionLabel({ children, collapsed }) {
  if (collapsed) return <div className="my-3 border-t border-border" />
  return <p className="px-3 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">{children}</p>
}

export default function WorkspaceSidebar({
  collapsed,
  userName,
  loggingOut,
  onNavigate,
  onToggleTheme,
  onLogout,
}) {
  return (
    <aside className={`z-20 flex shrink-0 flex-col border-r border-border bg-app transition-[width] duration-200 ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}>
      <div className={`flex h-[68px] items-center border-b border-border ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
        <button onClick={() => onNavigate('/dashboard')} className="flex min-w-0 items-center gap-3 text-left">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-slate-900 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900">AI</span>
          {!collapsed && <span className="min-w-0">
            <span className="block text-sm font-bold leading-tight tracking-wide">COUNCIL</span>
            <span className="mt-0.5 block font-mono text-[9px] tracking-[0.16em] text-text-secondary">PLATFORM v1.0</span>
          </span>}
        </button>
        {!collapsed && (
          <button onClick={onToggleTheme} title="Toggle theme" className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover">
            <Sun size={17} className="hidden dark:block" />
            <Moon size={17} className="dark:hidden" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <SectionLabel collapsed={collapsed}>Debate modes</SectionLabel>
        <nav className="space-y-1">
          <NavItem icon={GraduationCap} active collapsed={collapsed}>Debate Panel</NavItem>
          <NavItem icon={Clock3} collapsed={collapsed} onClick={() => onNavigate('/dashboard')}>Past Discussions</NavItem>
        </nav>
      </div>

      <div className="border-t border-border p-3">
        <button onClick={() => onNavigate('/configure')} title="New session" className={`mb-3 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-text-secondary hover:bg-surface-hover ${collapsed ? 'justify-center' : ''}`}>
          <Plus size={17} />{!collapsed && 'New Session'}
        </button>
        {!collapsed && <div className="mb-3 flex items-center gap-3 px-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-surface-hover text-[10px] font-bold text-text-primary">{initials(userName)}</span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold">{userName}</span>
            <span className="block text-[10px] text-text-secondary">Council member</span>
          </span>
        </div>}
        <button onClick={onLogout} disabled={loggingOut} title={collapsed ? 'Sign out' : undefined} className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-xs text-text-secondary hover:bg-surface-hover hover:text-red-500 ${collapsed ? 'justify-center' : ''}`}>
          <LogOut size={16} />{!collapsed && (loggingOut ? 'Signing out...' : 'Sign Out')}
        </button>
      </div>
    </aside>
  )
}
