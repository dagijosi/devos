import { toast } from 'sonner';
import PremiumToast, { type ToastType } from './PremiumToast';

interface PremiumToastOptions {
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  avatar?: string;
  progress?: number;
  version?: string;
  duration?: number;
  id?: string | number;
  simulateProgress?: boolean;
}

export const premiumToast = (type: ToastType, title: string, options: PremiumToastOptions = {}) => {
  const toastId = options.id || Math.random().toString(36).substring(2, 9);
  
  return toast.custom((t) => (
    <PremiumToast 
      t={t}
      type={type}
      title={title}
      description={options.description}
      actionLabel={options.actionLabel}
      onAction={options.onAction}
      avatar={options.avatar}
      progress={options.progress}
      version={options.version}
    />
  ), {
    duration: options.duration || 5000,
    id: toastId
  });
};

premiumToast.success = (title: string, options?: PremiumToastOptions) => premiumToast('success', title, options);
premiumToast.error = (title: string, options?: PremiumToastOptions) => premiumToast('error', title, options);
premiumToast.info = (title: string, options?: PremiumToastOptions) => premiumToast('info', title, options);
premiumToast.warning = (title: string, options?: PremiumToastOptions) => premiumToast('warning', title, options);
premiumToast.loading = (title: string, progress?: number, options?: PremiumToastOptions) => premiumToast('loading', title, { ...options, progress });
premiumToast.upload = (title: string, progress: number, options?: PremiumToastOptions) => premiumToast('upload', title, { ...options, progress });
premiumToast.update = (title: string, version: string, options?: PremiumToastOptions) => premiumToast('update', title, { ...options, version });
premiumToast.message = (title: string, description: string, avatar: string, options?: PremiumToastOptions) => 
  premiumToast('message', title, { ...options, description, avatar });

premiumToast.dismiss = (id?: string | number) => toast.dismiss(id);

premiumToast.promise = async <T,>(
  promiseOrFn: Promise<T> | ((setProgress: (p: number) => void) => Promise<T>),
  msgs: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error | unknown) => string);
  },
  options: Omit<PremiumToastOptions, 'id'> = {}
) => {
  const id = Math.random().toString(36).substring(2, 9);
  let interval: ReturnType<typeof setInterval> | null = null;
  
  const setProgress = (progress: number) => {
    premiumToast.loading(msgs.loading, progress, { ...options, id });
  };

  if (options.simulateProgress) {
    let currentProgress = 0;
    interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 5;
      if (currentProgress >= 95) {
        if (interval) clearInterval(interval);
      } else {
        setProgress(currentProgress);
      }
    }, 400);
  } else {
    premiumToast.loading(msgs.loading, options.progress, { ...options, id });
  }

  try {
    const result = await (typeof promiseOrFn === 'function' ? promiseOrFn(setProgress) : promiseOrFn);
    
    if (interval) clearInterval(interval);
    
    const successMsg = typeof msgs.success === 'function' ? msgs.success(result) : msgs.success;
    premiumToast.success(successMsg, { ...options, id });
    
    return result;
  } catch (error) {
    if (interval) clearInterval(interval);
    
    const errorMsg = typeof msgs.error === 'function' ? msgs.error(error as Error) : msgs.error;
    premiumToast.error(errorMsg, { ...options, id });
    
    throw error;
  }
};
