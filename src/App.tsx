import { BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import routes from './routes/routes';
import { renderRoutes } from './routes/RouteRenderer';
import { ThemeProvider } from './theme-system';
import { CommandPalette } from './features/command-palette';
import { useEffect } from 'react';
import { database } from './database';
import { useAuthStore } from './store/authStore';

function App() {
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const initApp = async () => {
      await database.initialize();
      await database.ensureDefaultUser();
      
      // Get the default user and set auth
      const user = await database.getUserByEmail('developer@localhost');
      if (user) {
        setAuth('local_token', user);
      }
    };
    
    initApp();
  }, [setAuth]);

  return (
    <ThemeProvider>
      <Router>
        <CommandPalette />
        <Toaster richColors position="bottom-right" />
        <Routes>
          {renderRoutes(routes)}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
