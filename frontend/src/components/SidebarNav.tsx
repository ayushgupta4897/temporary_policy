'use client';

import { FC } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface NavItem {
  label: string;
  href?: string;
  icon: JSX.Element;
  onClick?: () => void;
}

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const NewAnalysisIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
  </svg>
);

const RunsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
);

interface SidebarNavProps {
  onNewAnalysis?: () => void;
  onHomeClick?: () => void;
}

const SidebarNav: FC<SidebarNavProps> = ({ onNewAnalysis, onHomeClick }) => {
  const pathname = usePathname();
  const router = useRouter();
  
  const handleHomeClick = () => {
    // If onHomeClick is provided, use it; otherwise just navigate
    if (onHomeClick) {
      onHomeClick();
    } else if (pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  };
  
  const navItems: NavItem[] = [
    { 
      label: 'Home', 
      icon: <HomeIcon />,
      onClick: handleHomeClick
    },
    { 
      label: 'Start new analysis', 
      icon: <NewAnalysisIcon />,
      onClick: onNewAnalysis 
    },
  ];

  return (
    <aside className="w-64 bg-dark-700/40 backdrop-blur-xl border-r border-dark-300/50 h-screen overflow-y-auto relative z-20">
      {/* Logo Section */}
      <div className="p-6 border-b border-dark-300/40">
        <button 
          onClick={handleHomeClick}
          className="flex items-center gap-3 group cursor-pointer w-full text-left"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-gradient-from to-gradient-via rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 animate-neural-pulse shadow-lg">
            <span className="text-white font-bold text-sm">PB</span>
          </div>
          <div>
            <h1 className="text-gray-100 font-semibold text-base group-hover:text-gradient-from transition-colors">Policy Bot</h1>
            <p className="text-gray-400 text-xs">Policy Intelligence Suite</p>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isNew = item.label === 'Start new analysis';
          const isHome = item.label === 'Home';
          const isActive = isHome && pathname === '/dashboard';
          
          const className = `
            w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer
            ${isActive 
              ? 'bg-dark-500/60 text-gray-100 shadow-md backdrop-blur-sm' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-dark-500/40'
            }
            ${isNew ? 'mt-3 mb-2 bg-gradient-to-r from-gradient-from to-gradient-via text-white hover:shadow-lg hover:scale-[1.02] animate-glow' : ''}
          `;

          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className={className}
            >
              <span className="flex items-center justify-center w-5 h-5">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default SidebarNav;