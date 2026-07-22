import React from 'react';
import Modal from '../ui/overlays/Modal';
import {type User } from '../../store/authStore';
import { Shield, User as UserIcon, Settings, Briefcase } from 'lucide-react';

interface DemoAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: User) => void;
}

const DEMO_ACCOUNTS: User[] = [
  {
    id: 'admin-1',
    name: 'System Admin',
    email: 'admin@demo.com',
    role: 'Administrator',
    permissions: ['all'],
    businessModules: ['Analytics', 'Users', 'Settings', 'Billing'],
  },
  {
    id: 'manager-1',
    name: 'Sales Manager',
    email: 'manager@demo.com',
    role: 'Manager',
    permissions: ['view_analytics', 'manage_users'],
    businessModules: ['Analytics', 'Users'],
  },
  {
    id: 'editor-1',
    name: 'Content Editor',
    email: 'editor@demo.com',
    role: 'Editor',
    permissions: ['edit_content', 'view_analytics'],
    businessModules: ['Content', 'Analytics'],
  },
  {
    id: 'user-1',
    name: 'Standard User',
    email: 'user@demo.com',
    role: 'User',
    permissions: ['view_dashboard'],
    businessModules: ['Dashboard'],
  },
];

const DemoAccountModal: React.FC<DemoAccountModalProps> = ({ isOpen, onClose, onSelect }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose a Demo Account"
      size="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.id}
            onClick={() => onSelect(account)}
            className="flex flex-col p-4 text-left bg-theme-background border border-theme-border rounded-xl hover:border-theme-icon hover:ring-1 hover:ring-theme-icon transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-theme-icon/10 text-theme-icon rounded-lg group-hover:bg-theme-icon group-hover:text-white transition-colors">
                {account.role === 'Administrator' ? <Shield size={20} /> : 
                 account.role === 'Manager' ? <Briefcase size={20} /> :
                 account.role === 'Editor' ? <Settings size={20} /> : <UserIcon size={20} />}
              </div>
              <div>
                <h4 className="font-semibold text-theme-text">{account.name}</h4>
                <p className="text-xs text-theme-text/50">{account.email}</p>
              </div>
            </div>
            
            <div className="space-y-2 mt-auto">
              <div className="flex flex-wrap gap-1">
                {account.businessModules.map(module => (
                  <span key={module} className="px-2 py-0.5 bg-theme-surface border border-theme-border rounded-md text-[10px] text-theme-text/70">
                    {module}
                  </span>
                ))}
              </div>
              <p className="text-xs text-theme-text/40 italic">
                {account.role} access level
              </p>
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-theme-icon/5 border border-theme-icon/20 rounded-xl">
        <p className="text-xs text-theme-text/60 leading-relaxed text-center">
          Selecting a demo account will automatically sign you in with pre-configured roles and permissions to explore the dashboard features.
        </p>
      </div>
    </Modal>
  );
};

export default DemoAccountModal;
