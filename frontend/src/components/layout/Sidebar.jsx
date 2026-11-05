
import { Link, NavLink } from 'react-router-dom'

function Sidebar({
  collapsed,
  mobileOpen,
  onClose,
  user,
  onLogout,
  logoutPending,
}) {
  const navigation = [
    { label: 'Dashboard', path: '/dashboard', icon: '⌂' },
    { label: 'Settings', path: '/profile', icon: '⚙' },
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface p-4 transition-all duration-200 md:static md:z-auto md:translate-x-0 ${
          collapsed ? 'md:w-20' : 'md:w-60'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <Link
          to="/dashboard"
          onClick={onClose}
          className={`mb-10 flex items-center gap-1 ${
            collapsed ? 'md:justify-center' : ''
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-lg font-bold text-white">
            AI
          </div>

          <div
            className={`flex items-center justify-center gap-2 ${
              collapsed ? 'md:hidden' : ''
            }`}
          >
            <h1 className="font-bold tracking-wide">Council</h1>
            <p className="text-[10px] tracking-widest text-text-secondary">
              V1.0
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <p
          className={`mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-text-secondary ${
            collapsed ? 'md:hidden' : ''
          }`}
        >
          Workspace
        </p>

        <nav className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-surface-hover font-medium text-text-primary'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                } ${collapsed ? 'md:justify-center md:px-2' : ''}`
              }
            >
              <span className="w-5 shrink-0 text-center text-2xl">
                {item.icon}
              </span>
              <span className={collapsed ? 'md:hidden' : ''}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="mt-auto border-t border-border pt-4">
          <div className={collapsed ? 'md:hidden' : ''}>
            <p className="truncate px-3 text-sm font-medium">
              {user?.name || 'User'}
            </p>
            <p className="truncate px-3 text-xs text-text-secondary">
              {user?.email}
            </p>
          </div>

          <button
            onClick={onLogout}
            disabled={logoutPending}
            title={collapsed ? 'Sign out' : undefined}
            className={`mt-4 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-text-secondary transition hover:bg-surface-hover hover:text-red-400 disabled:opacity-50 ${
              collapsed ? 'md:justify-center md:px-2' : ''
            }`}
          >
            <span className="w-5 text-center">↪</span>
            <span className={collapsed ? 'md:hidden' : ''}>
              {logoutPending ? 'Signing out...' : 'Sign out'}
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
