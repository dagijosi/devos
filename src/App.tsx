import { BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import routes from './routes/routes';
import { renderRoutes } from './routes/RouteRenderer';
import { ThemeProvider } from './theme-system';
import { CommandPalette } from './features/command-palette';
import { useEffect } from 'react';
import { database } from './database';

function App() {
  useEffect(() => {
    database.initialize();
  }, []);

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
