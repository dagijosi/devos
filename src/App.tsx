import { BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import routes from './routes/routes';
import { renderRoutes } from './routes/RouteRenderer';
import { ThemeProvider } from './theme-system';
import { UnifiedSearch } from './features/unified-search/UnifiedSearch';
import { useEffect, useState } from 'react';
import { database } from './database';
import { useAuthStore } from './store/authStore';
import { SplashScreen } from './components/splash/SplashScreen';
import { CrashRecoveryOverlay } from './components/feedback/CrashRecoveryOverlay';
import { SkipToContent } from './components/accessibility/SkipToContent';
import { AriaAnnouncer } from './components/accessibility/AriaAnnouncer';
import { setupCrashDetection } from './utils/crashRecovery';
import { TelegramPollingProvider } from './features/utilities/TelegramPollingProvider';
import './utils/logger';

setupCrashDetection();

function App() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [ready, setReady] = useState(() => sessionStorage.getItem('devos_ready') === 'true');

  useEffect(() => {
    const initApp = async () => {
      await database.initialize();
      await database.ensureDefaultUser();
      await database.seedDefaultCommandTemplates();
      await database.seedDefaultNotificationRules();

      const user = await database.getUserByEmail('developer@localhost');
      if (user) {
        setAuth('local_token', user);
      }

      sessionStorage.setItem('devos_ready', 'true');
    };

    initApp();
  }, [setAuth]);

  if (!ready) {
    return <SplashScreen onFinish={() => setReady(true)} minDuration={1800} />;
  }

  return (
    <ThemeProvider>
      <Router>
        <SkipToContent />
        <AriaAnnouncer />
        <CrashRecoveryOverlay />
        <UnifiedSearch />
        <Toaster richColors position="bottom-right" />
        <TelegramPollingProvider>
          <Routes>
            {renderRoutes(routes)}
          </Routes>
        </TelegramPollingProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
