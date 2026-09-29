import { type ReactNode } from 'react';
import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';
import { MobileNav } from './layout/MobileNav';

type LayoutProps = {
  children: ReactNode;
  activeItem?: string;
  title?: string;
};

export function Layout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="flex flex-1 min-h-screen">
        {/* Desktop Enterprise Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Header */}
          <Header searchPlaceholder={title ? `Search ${title}...` : undefined} />

          {/* Primary View Container */}
          <main className="flex-1 bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.06),_transparent_40%),_#070d18] p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
            <div className="mx-auto max-w-[1600px] animate-fadeIn">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar matching Image 11 */}
      <MobileNav />
    </div>
  );
}
