import React from 'react';
import { toast } from 'sonner';
import { 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaInfoCircle,
  FaCog,
  FaSpinner,
  FaCloudUploadAlt,
  FaTimes
} from 'react-icons/fa';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'upload' | 'update' | 'message' | 'loading';

interface PremiumToastProps {
  t: string | number;
  type: ToastType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  avatar?: string;
  progress?: number;
  version?: string;
}

const PremiumToast: React.FC<PremiumToastProps> = ({
  t,
  type,
  title,
  description,
  actionLabel,
  onAction,
  avatar,
  progress,
  version,
}) => {
  const dismiss = React.useCallback(() => {
    toast.dismiss(t);
    setTimeout(() => {
      toast.dismiss();
    }, 0);
  }, [t]);

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    dismiss();
  };

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="bg-green-500 w-7 h-7 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
            <FaCheckCircle className="text-white text-base" />
          </div>
        );
      case 'error':
        return (
          <div className="bg-red-500 w-7 h-7 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20 transform rotate-45">
            <FaExclamationCircle className="text-white text-base transform -rotate-45" />
          </div>
        );
      case 'info':
        return (
          <div className="bg-theme-icon w-7 h-7 rounded-full flex items-center justify-center shadow-lg shadow-theme-icon/20">
            <FaInfoCircle className="text-white text-base" />
          </div>
        );
      case 'warning':
        return (
          <div className="bg-amber-500 w-7 h-7 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20">
            <FaExclamationCircle className="text-white text-base" />
          </div>
        );
      case 'upload':
        return (
          <div className="bg-theme-icon/10 p-2.5 rounded-xl border border-theme-icon/20 text-theme-icon">
            <FaCloudUploadAlt className="text-xl" />
          </div>
        );
      case 'update':
        return (
          <div className="bg-theme-text/5 p-2.5 rounded-xl border border-theme-border text-theme-icon">
            <FaCog className="text-xl animate-spin" style={{ animationDuration: '8s' }} />
          </div>
        );
      case 'loading':
        return (
          <div className="bg-theme-icon/10 p-2.5 rounded-xl border border-theme-icon/20 text-theme-icon">
            <FaSpinner className="text-xl animate-spin" />
          </div>
        );
      case 'message':
        return (
          <div className="relative">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-theme-surface shadow-sm bg-theme-border/20 relative">
              <img 
                src={avatar || "https://i.pravatar.cc/150"} 
                alt="" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-theme-surface rounded-full"></div>
          </div>
        );
      default:
        return null;
    }
  };

  const isDarkAction = type === 'error' || type === 'warning';

  return (
    <div 
      className="bg-theme-surface/95 backdrop-blur-xl text-theme-text p-3.5 rounded-2xl shadow-2xl flex flex-col gap-3 min-w-[320px] max-w-[420px] border border-theme-border animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3.5">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {renderIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-theme-text truncate">{title}</h3>
              {version && <span className="text-theme-text/40 text-[10px] font-mono whitespace-nowrap">| {version}</span>}
            </div>
            {description && (
              <p className="text-theme-text/60 text-xs mt-0.5 line-clamp-2 italic leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }} 
          className="text-theme-text/30 hover:text-theme-text transition-colors flex-shrink-0 p-1"
        >
          <FaTimes size={14} />
        </button>
      </div>

      {(type === 'upload' || type === 'loading') && typeof progress === 'number' && (
        <div className="space-y-1.5 px-0.5">
          <div className="h-1.5 w-full bg-theme-border/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-theme-icon rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-end">
            <span className="text-[10px] font-bold text-theme-text/40">{progress}%</span>
          </div>
        </div>
      )}

      {(actionLabel || type === 'message' || type === 'update' || type === 'upload' || type === 'loading') && (
        <div className={`flex items-center gap-2.5 ${type === 'message' ? 'ml-14' : (type === 'update' || type === 'upload' || type === 'loading') ? 'ml-[52px]' : ''}`}>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            className="px-3.5 py-1.5 text-theme-text/70 hover:bg-theme-text/5 rounded-xl text-[11px] font-bold border border-theme-border transition-all whitespace-nowrap"
          >
            {type === 'update' ? 'Skip' : type === 'upload' ? 'Cancel' : 'Dismiss'}
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction();
            }}
            className={`px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap shadow-sm ${
              isDarkAction 
                ? 'bg-theme-text text-theme-background hover:opacity-90' 
                : 'bg-theme-icon text-white hover:opacity-90'
            }`}
          >
            {actionLabel || (type === 'message' ? 'Reply' : type === 'update' ? 'Install' : type === 'upload' ? 'Retry' : 'Confirm')}
          </button>
        </div>
      )}
    </div>
  );
};

export default PremiumToast;
