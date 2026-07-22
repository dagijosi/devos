import React from 'react';
import { Logo } from '../ui/Logo';
import { useTheme } from '../../theme-system/useTheme';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  illustration?: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title, 
  subtitle,
  illustration 
}) => {
  useTheme();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-theme-background">
      {/* Left Side: Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="md:hidden">
              <Logo size={48} />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-theme-text tracking-tight">{title}</h1>
              <p className="text-theme-text/60 mt-2">{subtitle}</p>
            </div>
          </div>
          
          <div className="bg-theme-surface border border-theme-border rounded-2xl p-6 md:p-8 shadow-xl shadow-black/5">
            {children}
          </div>
        </div>
      </div>

      {/* Right Side: Decorative */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-theme-icon/5">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-theme-icon rounded-full blur-[100px] -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-theme-icon rounded-full blur-[100px] -ml-48 -mb-48" />
        </div>

        <div className="relative z-10 w-full flex flex-col items-center justify-center p-12 text-center space-y-8">
          <div className="p-4 bg-theme-surface border border-theme-border rounded-3xl shadow-2xl animate-bounce-slow">
            <Logo size={120} />
          </div>
          
          <div className="max-w-md space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <h2 className="text-4xl font-bold text-theme-text">Modern Dashboard Solution</h2>
            <p className="text-lg text-theme-text/70 leading-relaxed">
              Experience the next generation of data management and analytics with our beautiful and intuitive platform.
            </p>
          </div>

          {illustration && (
            <div className="w-full max-w-lg mt-8 animate-in zoom-in-95 duration-700 delay-300">
              {illustration}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
