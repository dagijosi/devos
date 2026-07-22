import { ThemeSwitcher } from '../theme-system';
import { FaBolt } from 'react-icons/fa';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-theme-border bg-theme-surface/70 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-lg bg-theme-icon p-1.5 text-white shadow-lg">
             <FaBolt size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight text-theme-text">
            Analytics
          </span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
};

export default Header;
