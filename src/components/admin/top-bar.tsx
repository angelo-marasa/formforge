export function TopBar({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="h-14 border-b flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </header>
  )
}
