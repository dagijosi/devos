import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useState, useEffect } from "react";
import TopNav from "./TopNav";

const Layout = () => {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [sidebarAnimate, setSidebarAnimate] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const wasMobile = isMobile;
      setIsMobile(mobile);

      // Only auto-adjust when switching between mobile/desktop
      if (wasMobile !== mobile) {
        if (mobile) {
          setSidebarOpen(false); // Close when switching to mobile
        } else {
          setSidebarOpen(true); // Open when switching to desktop
        }
      }
    };

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Tour integration: allow tour to open sidebar programmatically
    const handleTourOpenSidebar = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOpen?: boolean; animate?: boolean }>;
      const isOpen = customEvent.detail?.isOpen ?? true;
      const animate = customEvent.detail?.animate ?? true;
      
      // We'll pass the animate flag down to Sidebar
      setSidebarAnimate(animate);
      setSidebarOpen(isOpen);
    };
    window.addEventListener("tour:open-sidebar", handleTourOpenSidebar);

    // Set initial state
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("tour:open-sidebar", handleTourOpenSidebar);
    };
  }, [isMobile]);

  return (
    <div className="flex min-h-dvh bg-transparent font-sans antialiased text-theme-text">
      {/* BG handled by body, font color inherited */}
      {/* 1. Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isMobile={isMobile}
        animate={sidebarAnimate}
      />
      {/* 2. Main Content Area */}
      <div
        className={`
          flex-1 flex flex-col min-w-0 relative transition-[margin] duration-400 ease-[0.4,0,0.2,1]
          ${sidebarOpen ? "md:ml-64" : "md:ml-20"}
          print:ml-0 print:h-auto print:overflow-visible
        `}
      >
        {/* Top Navigation */}
        <header className="fixed top-0 right-0 z-20 bg-theme-background/80 backdrop-blur-md border-b border-theme-border/10 print:hidden transition-[left,margin] duration-400 ease-[0.4,0,0.2,1] left-0 md:left-auto md:ml-0" style={{ left: isMobile ? 0 : (sidebarOpen ? '16rem' : '5rem') }}>
          <TopNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </header>

        {/* Main Content (Outlet) */}
        <main className="flex-1 relative z-10 p-3 sm:p-4 lg:p-6 pt-[76px] sm:pt-20 lg:pt-[88px] pb-[76px] md:pb-4 lg:pb-6 print:overflow-visible print:h-auto">
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  );
};

export default Layout;