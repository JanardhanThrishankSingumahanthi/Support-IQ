import { useState, type ReactNode } from 'react';
import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';
import { MobileNav } from './layout/MobileNav';
import { UIStateMatrixModal } from './common/UIStateFeedback';
import { Layers } from 'lucide-react';

type LayoutProps = {
  children: ReactNode;
  activeItem?: string;
  title?: string;
};

export function Layout({ children, title }: LayoutProps) {
  const [showMatrixModal, setShowMatrixModal] = useState(false);

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

      {/* Floating Button to Inspect 22 UI States Matrix (Image 12) */}
      <div className="fixed bottom-20 lg:bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setShowMatrixModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-cyan-500/40 shadow-xl shadow-cyan-500/10 text-xs font-semibold backdrop-blur-md transition-all hover:scale-105 active:scale-95"
          title="Open 22 UI States Matrix (Reference Image 12)"
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">22 UI States Matrix</span>
          <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
            22
          </span>
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar matching Image 11 */}
      <MobileNav />

      {/* 22 UI States Interactive Modal */}
      {showMatrixModal && (
        <UIStateMatrixModal onClose={() => setShowMatrixModal(false)} />
      )}
    </div>
  );
}
