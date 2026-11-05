
function Navbar({
  title,
  subtitle,
  onToggleSidebar,
  onOpenMobileSidebar,
  children,
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5 sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile menu */}
        <button
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar"
          className="rounded-md p-2 text-text-secondary hover:bg-surface-hover md:hidden"
        >
          ☰
        </button>

        {/* Desktop collapse */}
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="hidden rounded-md p-2 text-text-secondary hover:bg-surface-hover md:block"
        >
          ☰
        </button>

        <div className="min-w-0">
          <h2 className="truncate font-semibold">{title}</h2>
          {subtitle && (
            <p className="truncate text-xs text-text-secondary">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {children}
      </div>
    </header>
  )
}

export default Navbar
