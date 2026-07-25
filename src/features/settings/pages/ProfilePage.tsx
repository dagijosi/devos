import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaShieldAlt, FaCamera, FaSave, FaEdit, FaTimes, FaBell, FaLock, FaGlobe } from 'react-icons/fa';
import { useAuthStore } from '../../../store/authStore';

function loadProfile() {
  try {
    const saved = localStorage.getItem('devos_profile');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return {
    name: 'Developer',
    email: 'developer@example.com',
    role: 'Admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  };
}

function saveProfile(data: { name: string; email: string; role: string; avatar: string }) {
  localStorage.setItem('devos_profile', JSON.stringify(data));
}

export function ProfilePage() {
  const setAuth = useAuthStore(s => s.setAuth);
  const [user, setUser] = useState(loadProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });

  const handleSave = () => {
    setUser({ ...formData });
    saveProfile(formData);
    setAuth('mock-token', { id: '1', name: formData.name, email: formData.email, role: formData.role, permissions: [], businessModules: [], avatar: formData.avatar });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({ ...user });
    setIsEditing(false);
  };

  useEffect(() => {
    setFormData({ ...user });
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-theme-text">Profile</h1>
          <p className="text-sm text-theme-text/60 mt-1">Manage your account settings and preferences</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-theme-icon text-white rounded-xl hover:opacity-90 transition-opacity"
          >
            <FaEdit className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-theme-surface border border-theme-border/30 rounded-3xl overflow-hidden">
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-theme-icon to-purple-600" />
        
        <div className="px-8 pb-8">
          {/* Avatar Section */}
          <div className="relative -mt-16 mb-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-tr from-theme-icon to-purple-500 p-1 shadow-xl">
                <div className="w-full h-full rounded-xl bg-theme-surface flex items-center justify-center overflow-hidden">
                  <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                </div>
              </div>
              <button className="absolute bottom-2 right-2 w-10 h-10 rounded-xl bg-theme-icon text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                <FaCamera className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-theme-text">{user.name}</h2>
            <p className="text-theme-text/60">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 text-xs font-medium bg-theme-icon/10 text-theme-icon rounded-full border border-theme-icon/20">
                {user.role}
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-green-500/10 text-green-400 rounded-full border border-green-500/30">
                Active
              </span>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-theme-background border border-theme-border/30 rounded-xl text-theme-text focus:outline-none focus:border-theme-icon/50 transition-colors"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-text mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-theme-background border border-theme-border/30 rounded-xl text-theme-text focus:outline-none focus:border-theme-icon/50 transition-colors"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-3 bg-theme-icon text-white rounded-xl hover:opacity-90 transition-opacity font-medium"
                >
                  <FaSave className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-6 py-3 bg-theme-background border border-theme-border/30 text-theme-text rounded-xl hover:border-theme-border/50 transition-colors font-medium"
                >
                  <FaTimes className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-theme-border/10">
              <div className="flex items-center gap-3 p-4 bg-theme-background/50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-theme-icon/10 flex items-center justify-center">
                  <FaUser className="w-5 h-5 text-theme-icon" />
                </div>
                <div>
                  <p className="text-xs text-theme-text/40">Username</p>
                  <p className="text-sm font-medium text-theme-text">{user.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-theme-background/50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-theme-icon/10 flex items-center justify-center">
                  <FaEnvelope className="w-5 h-5 text-theme-icon" />
                </div>
                <div>
                  <p className="text-xs text-theme-text/40">Email</p>
                  <p className="text-sm font-medium text-theme-text">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-theme-background/50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-theme-icon/10 flex items-center justify-center">
                  <FaShieldAlt className="w-5 h-5 text-theme-icon" />
                </div>
                <div>
                  <p className="text-xs text-theme-text/40">Role</p>
                  <p className="text-sm font-medium text-theme-text">{user.role}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-theme-surface border border-theme-border/30 rounded-3xl p-8">
        <h3 className="text-xl font-semibold text-theme-text mb-6">Preferences</h3>
        <div className="space-y-6">
          <SettingItem
            icon={FaBell}
            title="Email Notifications"
            description="Receive email updates about your projects and activities"
            enabled={true}
          />
          <SettingItem
            icon={FaLock}
            title="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
            enabled={false}
          />
          <SettingItem
            icon={FaGlobe}
            title="Public Profile"
            description="Make your profile visible to other team members"
            enabled={false}
          />
        </div>
      </div>
    </div>
  );
}

function SettingItem({ icon: Icon, title, description, enabled }: { icon: any; title: string; description: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between p-4 bg-theme-background/30 rounded-2xl hover:bg-theme-background/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-theme-icon/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-theme-icon" />
        </div>
        <div>
          <p className="text-sm font-medium text-theme-text">{title}</p>
          <p className="text-xs text-theme-text/40 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
          enabled ? 'bg-theme-icon' : 'bg-theme-border/30'
        }`}
      >
        <span
          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
            enabled ? 'right-1' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
