import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div className="flex h-dvh flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      {/* Scrollable main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
