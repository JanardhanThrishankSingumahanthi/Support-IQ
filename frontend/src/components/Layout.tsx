import type { ReactNode } from 'react'
import { Header, Sidebar } from './design-system'

type LayoutProps = {
  children: ReactNode
  activeItem?: string
  title?: string
}

export function Layout({ children, activeItem = 'Overview', title = 'SupportIQ Console' }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar activeItem={activeItem} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header title={title} />
          <main className="flex-1 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_35%),_#020817] p-6">
            <div className="mx-auto max-w-[1500px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
