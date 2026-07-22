import React, { useState } from 'react';
import { useTheme, type Theme } from '.';
import { FaCheck, FaPalette, FaMoon, FaSun, FaDesktop, FaLayerGroup, FaImage } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Setting: React.FC = () => {
  const { currentTheme, setTheme, availableThemes } = useTheme();
  const [activeTab, setActiveTab] = useState<'all' | Theme['type']>('all');
  const [activeMode, setActiveMode] = useState<'all' | 'light' | 'dark'>('all');

  const typeTabs = [
    { id: 'all', label: 'All', icon: <FaLayerGroup /> },
    { id: 'solid', label: 'Solid', icon: <FaPalette /> },
    { id: 'gradient', label: 'Gradient', icon: <FaDesktop /> },
    { id: 'pattern', label: 'Pattern', icon: <FaImage /> },
  ] as const;

  const modeTabs = [
    { id: 'all', label: 'All', icon: <FaLayerGroup /> },
    { id: 'light', label: 'Light', icon: <FaSun /> },
    { id: 'dark', label: 'Dark', icon: <FaMoon /> },
  ] as const;

  const filteredThemes = availableThemes
    .filter(t => activeTab === 'all' || t.type === activeTab)
    .filter(t => activeMode === 'all' || t.mode === activeMode);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-12 text-center">
            <motion.div 
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               className="inline-block p-3 rounded-2xl bg-theme-surface border border-theme-border shadow-lg mb-4"
            >
               <FaPalette className="w-8 h-8 text-theme-icon" />
            </motion.div>
            <h2 className="text-4xl font-extrabold text-theme-text mb-2 tracking-tight">Appearance</h2>
            <p className="text-lg text-theme-text/60 max-w-2xl mx-auto">
              Customize your workspace with our curated collection of themes. 
              Choose from solid colors, vibrant gradients, or artistic patterns.
            </p>
        </div>

        {/* Controls Section */}
        <div className="bg-theme-surface/50 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-theme-border mb-10">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              
              {/* Type Tabs */}
              <div className="flex p-1 space-x-1 bg-theme-surface rounded-xl border border-theme-border overflow-x-auto max-w-full">
                  {typeTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'all' | Theme['type'])}
                      className={`
                        flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                        ${activeTab === tab.id
                          ? 'bg-theme-icon text-white shadow-md'
                          : 'text-theme-text/70 hover:text-theme-text hover:bg-theme-text/5'
                        }
                      `}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
              </div>

              {/* Mode Tabs */}
              <div className="flex items-center space-x-2 bg-theme-surface p-1 rounded-xl border border-theme-border">
                  {modeTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveMode(tab.id as 'all' | 'light' | 'dark')}
                        className={`
                          px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all
                          ${activeMode === tab.id
                             ? 'bg-theme-text text-theme-background shadow-sm'
                             : 'text-theme-text/60 hover:text-theme-text hover:bg-theme-text/5'
                          }
                        `}
                      >
                         <div className="flex items-center gap-2">
                            {tab.icon && <span>{tab.icon}</span>}
                            {tab.label}
                         </div>
                      </button>
                  ))}
              </div>
           </div>
        </div>

        {/* Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence>
          {filteredThemes.map((theme) => {
            const isActive = currentTheme.id === theme.id;
            return (
              <motion.button
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className={`
                  relative group flex flex-col overflow-hidden rounded-2xl border-2 text-left transition-all duration-300 h-full
                  ${isActive 
                    ? 'border-theme-icon ring-4 ring-theme-icon/20 shadow-2xl scale-[1.02]' 
                    : 'border-theme-border hover:border-theme-icon/50 hover:shadow-xl hover:-translate-y-1 bg-theme-surface'
                  }
                `}
              >
                {/* Preview Area */}
                <div 
                  className="h-40 w-full relative overflow-hidden"
                  style={{ 
                    backgroundColor: theme.type === 'gradient' ? 'transparent' : theme.colors.background,
                    backgroundImage: theme.type === 'gradient' 
                        ? theme.colors.background 
                        : (theme.type === 'pattern' ? (theme.patternImage || 'none') : 'none'),
                    backgroundBlendMode: theme.type === 'pattern' ? 'multiply' : 'normal',
                    backgroundSize: theme.backgroundSize || (theme.type === 'pattern' ? 'auto' : 'cover'),
                    backgroundRepeat: 'repeat'
                  }}
                >
                   {/* Mini Mockup */}
                   <div className="absolute top-6 left-6 right-6 bottom-0 bg-white/10 backdrop-blur-md rounded-t-xl border border-white/20 p-4 shadow-lg transition-transform duration-500 group-hover:translate-y-2">
                      <div className="flex space-x-2 mb-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-400/90 shadow-sm"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/90 shadow-sm"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-green-400/90 shadow-sm"></div>
                      </div>
                      <div className="space-y-3">
                          <div className="h-2 w-2/3 rounded-full" style={{ backgroundColor: theme.colors.text, opacity: 0.5 }}></div>
                          <div className="h-2 w-full rounded-full" style={{ backgroundColor: theme.colors.text, opacity: 0.3 }}></div>
                          <div className="h-2 w-5/6 rounded-full" style={{ backgroundColor: theme.colors.text, opacity: 0.3 }}></div>
                          <div 
                             className="h-8 w-24 rounded-lg mt-4 shadow-sm"
                             style={{ backgroundColor: theme.colors.icon }}
                          ></div>
                      </div>
                   </div>
                   
                   {isActive && (
                      <div className="absolute top-3 right-3 bg-theme-icon text-white p-2 rounded-full shadow-lg z-10 animate-in zoom-in duration-200">
                        <FaCheck className="w-4 h-4" />
                      </div>
                   )}
                </div>

                {/* Info Area */}
                <div className="p-5 flex-1 flex flex-col justify-between bg-theme-surface/80 backdrop-blur-sm">
                  <div>
                     <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-theme-text text-lg tracking-tight">{theme.name}</span>
                        {isActive && <span className="text-xs font-bold text-theme-icon bg-theme-icon/10 px-2 py-1 rounded-full">Active</span>}
                     </div>
                     <span className="text-xs font-medium text-theme-text/50 uppercase tracking-wider">{theme.type} • {theme.mode}</span>
                  </div>
                </div>
              </motion.button>
            );
          })}
          </AnimatePresence>
        </motion.div>
        
         <div className="mt-12 text-center">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-surface/50 border border-theme-border text-theme-text/60 text-sm">
                 <FaCheck className="text-green-500" />
                 <span>Theme preferences are automatically saved to your device.</span>
             </div>
         </div>
      </div>
    </div>
  );
};

export default Setting;
