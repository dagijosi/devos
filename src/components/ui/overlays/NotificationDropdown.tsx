import React, { useState, useRef, useEffect } from 'react';
import { FaBell, FaTimes } from 'react-icons/fa';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New User Registered',
    message: 'John Doe has created a new account.',
    time: '2 min ago',
    read: false,
    type: 'success'
  },
  {
    id: '2',
    title: 'Server Alert',
    message: 'High CPU usage detected on Server A.',
    time: '1 hour ago',
    read: false,
    type: 'warning'
  },
  {
    id: '3',
    title: 'Backup Completed',
    message: 'Daily system backup finished successfully.',
    time: '5 hours ago',
    read: true,
    type: 'info'
  }
];

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-theme-text/70 hover:text-theme-icon hover:bg-theme-surface rounded-full transition-all duration-200"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-theme-background animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-theme-dropdown border border-theme-border rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="p-4 border-b border-theme-border/50 flex items-center justify-between bg-theme-surface/50 backdrop-blur-sm">
            <h3 className="font-semibold text-theme-text">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-theme-icon hover:text-theme-icon/80 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-theme-text/50">
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-theme-border/30">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`
                      relative p-4 cursor-pointer transition-colors hover:bg-theme-surface/60
                      ${!notification.read ? 'bg-theme-icon/5 border-l-2 border-theme-icon' : 'border-l-2 border-transparent'}
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-sm font-medium truncate ${!notification.read ? 'text-theme-text' : 'text-theme-text/70'}`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-theme-icon flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-theme-text/60 line-clamp-2 mb-1.5">
                          {notification.message}
                        </p>
                        <span className="text-[10px] text-theme-text/40 font-medium">
                          {notification.time}
                        </span>
                      </div>
                      
                      <button 
                        onClick={(e) => deleteNotification(notification.id, e)}
                        className="text-theme-text/30 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-theme-border/50 bg-theme-surface/30 text-center">
            <button className="text-xs font-medium text-theme-text/60 hover:text-theme-icon transition-colors w-full py-1">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
