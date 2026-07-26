import { useEffect, useState, useCallback } from 'react';
import { FaCog, FaPlus, FaEdit, FaTrash, FaCopy, FaDownload, FaUpload, FaSave, FaKey } from 'react-icons/fa';
import { database } from '../../database';
import LoadingComponent from '../../components/ui/feedback/LoadingComponent';
import { EmptyState } from '../../components/ui/feedback/EmptyState';
import { toast } from 'sonner';

interface EnvVar {
  key: string;
  value: string;
}

interface EnvProfile {
  id: number;
  project_id: number;
  name: string;
  description: string;
  variables: string;
  is_active: number;
}

const DEMO_VARS: EnvVar[] = [
  { key: 'APP_NAME', value: 'MyApp' },
  { key: 'NODE_ENV', value: 'development' },
  { key: 'PORT', value: '3000' },
  { key: 'DATABASE_URL', value: 'postgres://localhost:5432/myapp_dev' },
  { key: 'REDIS_URL', value: 'redis://localhost:6379' },
  { key: 'API_KEY', value: 'sk-dev-xxxxxxxxxxxx' },
  { key: 'JWT_SECRET', value: 'dev-secret-key-123' },
  { key: 'DEBUG', value: 'true' },
];

export function EnvManagerPage() {
  const [profiles, setProfiles] = useState<EnvProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<EnvProfile | null>(null);
  const [variables, setVariables] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVar, setEditingVar] = useState<{ key: string; value: string } | null>(null);
  const [showVarModal, setShowVarModal] = useState(false);
  const [varKey, setVarKey] = useState('');
  const [varValue, setVarValue] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileDesc, setProfileDesc] = useState('');

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    const prows = await database.getEnvProfiles(0);
    setProfiles(prows);
    if (prows.length === 0) {
      setActiveProfile(null);
      setVariables(DEMO_VARS);
    } else {
      const active = prows.find((p: EnvProfile) => p.is_active);
      if (active) {
        setActiveProfile(active);
        setVariables(JSON.parse(active.variables || '[]'));
      } else {
        setActiveProfile(prows[0]);
        setVariables(JSON.parse(prows[0].variables || '[]'));
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const selectProfile = (profile: EnvProfile) => {
    setActiveProfile(profile);
    setVariables(JSON.parse(profile.variables || '[]'));
  };

  const addVariable = () => {
    setVarKey('');
    setVarValue('');
    setEditingVar(null);
    setShowVarModal(true);
  };

  const editVariable = (v: EnvVar) => {
    setVarKey(v.key);
    setVarValue(v.value);
    setEditingVar(v);
    setShowVarModal(true);
  };

  const saveVariable = () => {
    if (!varKey.trim()) {
      toast.error('Variable name is required');
      return;
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(varKey.trim())) {
      toast.error('Invalid variable name. Use letters, numbers, and underscores');
      return;
    }
    setVariables((prev) => {
      if (editingVar) {
        return prev.map((v) => v.key === editingVar.key ? { key: varKey.trim(), value: varValue } : v);
      }
      if (prev.find((v) => v.key === varKey.trim())) {
        toast.error('Variable already exists');
        return prev;
      }
      return [...prev, { key: varKey.trim(), value: varValue }];
    });
    setShowVarModal(false);
  };

  const deleteVariable = (key: string) => {
    setVariables((prev) => prev.filter((v) => v.key !== key));
  };

  const saveProfile = async () => {
    if (!activeProfile) {
      toast.error('No profile selected');
      return;
    }
    await database.updateEnvProfile(activeProfile.id, {
      variables: JSON.stringify(variables),
    });
    toast.success('Profile variables saved');
    loadProfiles();
  };

  const createProfile = async () => {
    if (!profileName.trim()) {
      toast.error('Profile name is required');
      return;
    }
    await database.createEnvProfile({
      project_id: 0,
      name: profileName,
      description: profileDesc,
      variables: JSON.stringify(variables),
      is_active: profiles.length === 0 ? 1 : 0,
    });
    setShowProfileModal(false);
    toast.success('Profile created');
    loadProfiles();
  };

  const deleteProfile = async (id: number) => {
    await database.deleteEnvProfile(id);
    toast.success('Profile deleted');
    loadProfiles();
  };

  const activateProfile = async (profile: EnvProfile) => {
    await database.setActiveEnvProfile(0, profile.id);
    toast.success(`Profile "${profile.name}" activated`);
    loadProfiles();
  };

  const copyAsDotenv = () => {
    const text = variables.map((v) => `${v.key}=${v.value}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Copied as .env format');
  };

  const exportAsJson = () => {
    const json = JSON.stringify(Object.fromEntries(variables.map((v) => [v.key, v.value])), null, 2);
    navigator.clipboard.writeText(json);
    toast.success('Copied as JSON');
  };

  const importFromText = () => {
    const text = prompt('Paste .env content (KEY=VALUE per line):');
    if (!text) return;
    const lines = text.split('\n').filter(Boolean);
    const parsed: EnvVar[] = [];
    for (const line of lines) {
      const eqIdx = line.indexOf('=');
      if (eqIdx > 0) {
        parsed.push({ key: line.slice(0, eqIdx).trim(), value: line.slice(eqIdx + 1).trim() });
      }
    }
    if (parsed.length > 0) {
      setVariables((prev) => {
        const merged = [...prev];
        for (const p of parsed) {
          const idx = merged.findIndex((v) => v.key === p.key);
          if (idx >= 0) merged[idx] = p;
          else merged.push(p);
        }
        return merged;
      });
      toast.success(`Imported ${parsed.length} variables`);
    }
  };

  if (loading) return <LoadingComponent />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaCog className="w-6 h-6 text-theme-icon" />
          <div>
            <h1 className="text-2xl font-bold text-theme-text">Environment Manager</h1>
            <p className="text-xs text-theme-text/40 mt-0.5">
              Manage environment variables across profiles
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-theme-surface/50 border border-theme-border/20 rounded-xl hover:bg-theme-surface/80 transition-colors text-theme-text/70">
            <FaPlus className="w-3 h-3" /> New Profile
          </button>
          {activeProfile && (
            <>
              <button onClick={saveProfile} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-theme-icon/20 text-theme-icon border border-theme-icon/30 rounded-xl hover:bg-theme-icon/30 transition-colors font-medium">
                <FaSave className="w-3 h-3" /> Save
              </button>
              <button onClick={copyAsDotenv} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-theme-surface/50 border border-theme-border/20 rounded-xl hover:bg-theme-surface/80 transition-colors text-theme-text/70">
                <FaCopy className="w-3 h-3" />
              </button>
              <button onClick={exportAsJson} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-theme-surface/50 border border-theme-border/20 rounded-xl hover:bg-theme-surface/80 transition-colors text-theme-text/70">
                <FaDownload className="w-3 h-3" />
              </button>
              <button onClick={importFromText} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-theme-surface/50 border border-theme-border/20 rounded-xl hover:bg-theme-surface/80 transition-colors text-theme-text/70">
                <FaUpload className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Profile tabs */}
      <div className="flex items-center gap-2 overflow-x-auto shrink-0 pb-1">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            onClick={() => selectProfile(profile)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl cursor-pointer transition-colors shrink-0 ${
              activeProfile?.id === profile.id
                ? 'bg-theme-icon/20 text-theme-icon border border-theme-icon/30'
                : 'bg-theme-surface/30 text-theme-text/50 hover:text-theme-text/80 border border-theme-border/10'
            }`}
          >
            <FaKey className="w-3 h-3" />
            <span>{profile.name}</span>
            {profile.is_active ? (
              <span className="px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded-full">Active</span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); activateProfile(profile); }}
                className="px-1.5 py-0.5 text-[10px] bg-theme-surface/50 text-theme-text/40 hover:text-theme-icon rounded-full transition-colors"
              >
                Activate
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); deleteProfile(profile.id); }}
              className="p-0.5 text-theme-text/30 hover:text-red-400 transition-colors"
            >
              <FaTrash className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
        {activeProfile && (
          <button onClick={addVariable} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-theme-surface/30 border border-theme-border/10 rounded-xl text-theme-text/50 hover:text-theme-text transition-colors shrink-0">
            <FaPlus className="w-3 h-3" /> Add Variable
          </button>
        )}
      </div>

      {/* Variables list */}
      {activeProfile ? (
        variables.length === 0 ? (
          <EmptyState
            icon={<FaKey className="w-8 h-8" />}
            title="No variables"
            description="Add environment variables to this profile"
          />
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-theme-text/40 font-medium uppercase tracking-wider">
              <div className="col-span-4">Key</div>
              <div className="col-span-7">Value</div>
              <div className="col-span-1" />
            </div>
            {variables.map((v) => (
              <div
                key={v.key}
                className="grid grid-cols-12 gap-2 items-center px-3 py-2 bg-theme-surface/30 border border-theme-border/10 rounded-xl hover:bg-theme-surface/50 transition-all group"
              >
                <div className="col-span-4 font-mono text-sm text-theme-icon font-medium truncate">
                  {v.key}
                </div>
                <div className="col-span-7 font-mono text-sm text-theme-text/70 truncate">
                  {v.value.includes(' ') || v.value.length > 40
                    ? `"${v.value}"`
                    : v.value || <span className="text-theme-text/20 italic">empty</span>}
                </div>
                <div className="col-span-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => editVariable(v)} className="p-1 text-theme-text/30 hover:text-theme-icon transition-colors">
                    <FaEdit className="w-3 h-3" />
                  </button>
                  <button onClick={() => deleteVariable(v.key)} className="p-1 text-theme-text/30 hover:text-red-400 transition-colors">
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={<FaCog className="w-8 h-8" />}
          title="No profiles"
          description="Create a profile to start managing environment variables"
          action={
            <button
              onClick={() => setShowProfileModal(true)}
              className="px-4 py-2 text-xs bg-theme-icon/20 text-theme-icon border border-theme-icon/30 rounded-xl hover:bg-theme-icon/30 transition-colors font-medium"
            >
              Create Profile
            </button>
          }
        />
      )}

      {/* Variable editor modal */}
      {showVarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 bg-theme-background border border-theme-border/20 rounded-2xl shadow-2xl">
            <h2 className="text-lg font-bold text-theme-text mb-4">
              {editingVar ? 'Edit Variable' : 'Add Variable'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-theme-text/50 mb-1">Key</label>
                <input
                  type="text"
                  value={varKey}
                  onChange={(e) => setVarKey(e.target.value)}
                  placeholder="e.g., DATABASE_URL"
                  className="w-full px-3 py-2 bg-theme-surface/50 border border-theme-border/20 rounded-xl text-sm text-theme-text font-mono placeholder-theme-text/30 focus:outline-none focus:border-theme-icon/40"
                />
              </div>
              <div>
                <label className="block text-xs text-theme-text/50 mb-1">Value</label>
                <textarea
                  value={varValue}
                  onChange={(e) => setVarValue(e.target.value)}
                  placeholder="e.g., postgres://localhost:5432/db"
                  rows={3}
                  className="w-full px-3 py-2 bg-theme-surface/50 border border-theme-border/20 rounded-xl text-sm text-theme-text font-mono placeholder-theme-text/30 focus:outline-none focus:border-theme-icon/40 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setShowVarModal(false)} className="px-4 py-2 text-xs text-theme-text/60 hover:text-theme-text transition-colors">
                Cancel
              </button>
              <button onClick={saveVariable} className="px-4 py-2 text-xs bg-theme-icon/20 text-theme-icon border border-theme-icon/30 rounded-xl hover:bg-theme-icon/30 transition-colors font-medium">
                {editingVar ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile creation modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 bg-theme-background border border-theme-border/20 rounded-2xl shadow-2xl">
            <h2 className="text-lg font-bold text-theme-text mb-4">New Profile</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-theme-text/50 mb-1">Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g., Development, Staging, Production"
                  className="w-full px-3 py-2 bg-theme-surface/50 border border-theme-border/20 rounded-xl text-sm text-theme-text placeholder-theme-text/30 focus:outline-none focus:border-theme-icon/40"
                />
              </div>
              <div>
                <label className="block text-xs text-theme-text/50 mb-1">Description</label>
                <input
                  type="text"
                  value={profileDesc}
                  onChange={(e) => setProfileDesc(e.target.value)}
                  placeholder="e.g., Local development environment"
                  className="w-full px-3 py-2 bg-theme-surface/50 border border-theme-border/20 rounded-xl text-sm text-theme-text placeholder-theme-text/30 focus:outline-none focus:border-theme-icon/40"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setShowProfileModal(false)} className="px-4 py-2 text-xs text-theme-text/60 hover:text-theme-text transition-colors">
                Cancel
              </button>
              <button onClick={createProfile} className="px-4 py-2 text-xs bg-theme-icon/20 text-theme-icon border border-theme-icon/30 rounded-xl hover:bg-theme-icon/30 transition-colors font-medium">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
