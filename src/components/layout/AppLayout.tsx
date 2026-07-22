import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const wasMobile = isMobile;
      setIsMobile(mobile);
      if (wasMobile !== mobile) {
        setSidebarOpen(mobile ? false : true);
      }
    };
    window.addEventListener('resize', handleResize);
    if (window.innerWidth < 1024) setSidebarOpen(false);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  return (
    <div className="flex min-h-dvh bg-theme-background font-sans antialiased text-theme-text">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isMobile={isMobile}
      />

      <div
        className={`flex-1 flex flex-col min-w-0 relative transition-[margin] duration-400 ease-[0.4,0,0.2,1] ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-20'
        } print:ml-0`}
      >
        <header
          className="fixed top-0 right-0 z-20 bg-theme-background/80 backdrop-blur-md border-b border-theme-border/10 print:hidden transition-[left] duration-400 ease-[0.4,0,0.2,1]"
          style={{ left: isMobile ? 0 : sidebarOpen ? '16rem' : '5rem' }}
        >
          <Topbar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        </header>

        <main className="flex-1 relative z-10 p-3 sm:p-4 lg:p-6 pt-[76px] sm:pt-20 lg:pt-[88px] pb-[76px] md:pb-4 lg:pb-6 print:overflow-visible print:h-auto">
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  );
}
