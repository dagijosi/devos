import { useEffect, useState, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaRedo, FaShieldAlt, FaGlobe, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { database } from '../../database';
import LoadingComponent from '../../components/ui/feedback/LoadingComponent';
import { EmptyState } from '../../components/ui/feedback/EmptyState';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';

interface HostEntry {
  ip: string;
  hostname: string;
  enabled: boolean;
  comment?: string;
}

interface HostsProfile {
  id: number;
  name: string;
  description: string;
  entries: string;
  is_active: number;
  created_at: string;
}

const SAMPLE_ENTRIES: HostEntry[] = [
  { ip: '127.0.0.1', hostname: 'localhost', enabled: true },
  { ip: '127.0.0.1', hostname: 'myapp.local', enabled: false, comment: 'local dev' },
  { ip: '127.0.0.1', hostname: 'api.myapp.local', enabled: false, comment: 'API dev' },
  { ip: '0.0.0.0', hostname: 'facebook.com', enabled: false, comment: 'block distractions' },
  { ip: '0.0.0.0', hostname: 'reddit.com', enabled: false },
  { ip: '0.0.0.0', hostname: 'youtube.com', enabled: false },
  { ip: '185.199.108.153', hostname: 'assets.cdn.com', enabled: true, comment: 'CDN override' },
];

export function HostsSwitcherPage() {
  const [hostsContent, setHostsContent] = useState('');
  const [parsedEntries, setParsedEntries] = useState<HostEntry[]>([]);
  const [profiles, setProfiles] = useState<HostsProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<HostsProfile | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profileDesc, setProfileDesc] = useState('');
  const [hasWritePermission, setHasWritePermission] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isTauri) {
      setIsDemoMode(true);
      setHostsContent(SAMPLE_ENTRIES.map(e => `${e.enabled ? '' : '# '}${e.ip}\t${e.hostname}${e.comment ? ' # ' + e.comment : ''}`).join('\n'));
      setParsedEntries(SAMPLE_ENTRIES);
      setHasWritePermission(false);
    } else {
      try {
        const content = await invoke<string>('read_hosts_file');
        setHostsContent(content);
        setHasWritePermission(true);
        setIsDemoMode(false);
        setParsedEntries(parseHostsFile(content));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setHasWritePermission(false);
        setIsDemoMode(false);
      }
    }

    const prows = await database.getHostsProfiles();
    setProfiles(prows);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const parseHostsFile = (content: string): HostEntry[] => {
    return content.split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('::1')) return null;
        const isComment = trimmed.startsWith('#');
        const cleanLine = isComment ? trimmed.slice(1).trim() : trimmed;
        if (!cleanLine) return null;
        const parts = cleanLine.split(/\s+/);
        if (parts.length >= 2 && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parts[0])) {
          return {
            ip: parts[0],
            hostname: parts[1],
            enabled: !isComment,
            comment: parts.slice(2).join(' ').replace(/^#\s*/, '') || undefined,
          };
        }
        return null;
      })
      .filter(Boolean) as HostEntry[];
  };

  const toggleEntry = (index: number) => {
    setParsedEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, enabled: !e.enabled } : e))
    );
  };

  const saveHostsFile = async () => {
    if (!isTauri) {
      toast.error('Cannot modify hosts file in browser mode. Run `npm run tauri:dev` for full functionality.');
      return;
    }
    const lines = hostsContent.split('\n');
    let entryIdx = 0;
    const newLines = lines.map((line) => {
      const trimmed = line.trim();
      const isComment = trimmed.startsWith('#');
      const cleanLine = isComment ? trimmed.slice(1).trim() : trimmed;
      if (cleanLine && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\s/.test(cleanLine)) {
        const entry = parsedEntries[entryIdx];
        entryIdx++;
        if (entry) {
          const base = `${entry.ip}\t${entry.hostname}${entry.comment ? ' # ' + entry.comment : ''}`;
          return entry.enabled ? base : `# ${base}`;
        }
      }
      return line;
    });

    try {
      await invoke('write_hosts_file', { content: newLines.join('\n') });
      toast.success('Hosts file saved successfully');
      loadData();
    } catch {
      toast.error('Failed to save hosts file. Run DevOS as administrator to modify the hosts file.');
      setHasWritePermission(false);
    }
  };

  const saveProfileFromCurrent = () => {
    setProfileName('');
    setProfileDesc('');
    setEditingProfile(null);
    setShowProfileModal(true);
  };

  const saveProfile = async () => {
    if (!profileName.trim()) {
      toast.error('Profile name is required');
      return;
    }
    const activeEntries = parsedEntries.filter((e) => e.enabled);
    const entryData = activeEntries.map((e) => `${e.ip} ${e.hostname}`);
    const entriesStr = JSON.stringify(entryData);

    if (editingProfile) {
      await database.updateHostsProfile(editingProfile.id, {
        name: profileName,
        description: profileDesc,
        entries: entriesStr,
      });
      toast.success('Profile updated');
    } else {
      await database.createHostsProfile({
        name: profileName,
        description: profileDesc,
        entries: entriesStr,
      });
      toast.success('Profile created');
    }
    setShowProfileModal(false);
    const prows = await database.getHostsProfiles();
    setProfiles(prows);
  };

  const applyProfile = async (profile: HostsProfile) => {
    const entries = JSON.parse(profile.entries) as string[];
    const newEntries = parsedEntries.map((e) => ({
      ...e,
      enabled: entries.some((ep) => ep.includes(e.hostname)),
    }));
    setParsedEntries(newEntries);
    await database.setActiveHostsProfile(profile.id);
    const prows = await database.getHostsProfiles();
    setProfiles(prows);
    toast.success(`Profile "${profile.name}" applied`);
  };

  const deleteProfile = async (id: number) => {
    await database.deleteHostsProfile(id);
    const prows = await database.getHostsProfiles();
    setProfiles(prows);
    toast.success('Profile deleted');
  };

  const enabledCount = parsedEntries.filter((e) => e.enabled).length;

  if (loading) return <LoadingComponent />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-text">Hosts File Switcher</h1>
          <p className="text-sm text-theme-text/50 mt-1">
            Toggle system DNS overrides on/off and save named profiles for quick switching
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveProfileFromCurrent}
            className="flex items-center gap-2 px-3 py-2 text-xs bg-theme-surface/50 border border-theme-border/20 rounded-xl hover:bg-theme-surface/80 transition-colors text-theme-text/70 hover:text-theme-text"
          >
            <FaPlus className="w-3 h-3" /> Save as Profile
          </button>
          <button
            onClick={saveHostsFile}
            className="flex items-center gap-2 px-4 py-2 text-xs bg-theme-icon/20 text-theme-icon border border-theme-icon/30 rounded-xl hover:bg-theme-icon/30 transition-colors font-medium"
          >
            <FaSave className="w-3 h-3" /> {isDemoMode ? 'Not Available' : 'Save to File'}
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 text-xs bg-theme-surface/50 border border-theme-border/20 rounded-xl hover:bg-theme-surface/80 transition-colors text-theme-text/70 hover:text-theme-text"
            title="Reload"
          >
            <FaRedo className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Demo mode banner */}
      {isDemoMode && (
        <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-sm">
          <FaInfoCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Demo Mode — Sample Data Shown</p>
            <p className="text-blue-400/70 mt-0.5">
              The <code className="px-1 py-0.5 bg-blue-500/10 rounded text-xs">/etc/hosts</code> file cannot be accessed from a browser.
              Run <code className="px-1 py-0.5 bg-blue-500/10 rounded text-xs">npm run tauri:dev</code> to read/write your real system hosts file.
              Profiles <strong>are</strong> saved to the database regardless.
            </p>
          </div>
        </div>
      )}

      {/* Write permission warning */}
      {!hasWritePermission && !isDemoMode && (
        <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm">
          <FaShieldAlt className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-medium">Read-only — no write permission</p>
            <p className="text-yellow-400/70 mt-0.5">Run DevOS as administrator to save changes to the hosts file.</p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && !isDemoMode && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <FaExclamationTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-medium">Could not read hosts file</p>
            <p className="text-red-400/70 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Main layout: entries + profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Entries list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-theme-text/70 uppercase tracking-wider">
              Entries <span className="text-theme-text/30 font-normal">({enabledCount}/{parsedEntries.length} active)</span>
            </h2>
          </div>

          {parsedEntries.length === 0 ? (
            <div className="text-sm text-theme-text/40">No hosts entries found</div>
          ) : (
            parsedEntries.map((entry, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-theme-surface/30 border border-theme-border/10 rounded-xl hover:bg-theme-surface/50 transition-all"
              >
                <button
                  onClick={() => toggleEntry(idx)}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                    entry.enabled ? 'bg-green-500/50' : 'bg-theme-surface/50 border border-theme-border/20'
                  }`}
                  title={entry.enabled ? 'Disable entry (comment out)' : 'Enable entry (uncomment)'}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      entry.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <span className="font-mono text-sm text-theme-text/60 w-28 shrink-0">{entry.ip}</span>
                <span className={`font-mono text-sm truncate ${entry.enabled ? 'text-theme-text' : 'text-theme-text/30 line-through'}`}>
                  {entry.hostname}
                </span>
                {entry.comment && (
                  <span className="text-xs text-theme-text/30 ml-auto hidden sm:inline">{entry.comment}</span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Profiles sidebar */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-theme-text/70 uppercase tracking-wider">Profiles</h2>

          {profiles.length === 0 ? (
            <div className="space-y-2">
              <EmptyState
                icon={<FaGlobe className="w-8 h-8" />}
                title="No profiles yet"
                description="Toggle entries above, then click 'Save as Profile'"
              />
              <div className="p-3 bg-theme-surface/20 border border-theme-border/10 rounded-xl">
                <p className="text-xs text-theme-text/40 leading-relaxed">
                  <strong className="text-theme-text/60">What are profiles?</strong><br />
                  A profile is a named set of hosts entries. For example:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-theme-text/40">
                  <li>• <strong className="text-theme-text/60">Dev</strong> — point domains to localhost</li>
                  <li>• <strong className="text-theme-text/60">Work</strong> — override staging URLs</li>
                  <li>• <strong className="text-theme-text/60">Focus</strong> — block social media</li>
                </ul>
              </div>
            </div>
          ) : (
            profiles.map((profile) => {
              const entryCount = JSON.parse(profile.entries).length;
              return (
                <div
                  key={profile.id}
                  className={`p-3 bg-theme-surface/30 border rounded-xl transition-all ${
                    profile.is_active ? 'border-theme-icon/40' : 'border-theme-border/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-theme-text truncate">{profile.name}</h3>
                      {profile.description && (
                        <p className="text-xs text-theme-text/40 mt-0.5 truncate">{profile.description}</p>
                      )}
                      <p className="text-xs text-theme-text/30 mt-1">{entryCount} entries</p>
                    </div>
                    {profile.is_active && (
                      <span className="shrink-0 px-2 py-0.5 text-[10px] bg-theme-icon/20 text-theme-icon rounded-full font-medium ml-2">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => applyProfile(profile)}
                      className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                        profile.is_active
                          ? 'bg-theme-icon/20 text-theme-icon'
                          : 'bg-theme-surface/50 text-theme-text/60 hover:bg-theme-surface/80'
                      }`}
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => {
                        setEditingProfile(profile);
                        setProfileName(profile.name);
                        setProfileDesc(profile.description);
                        setShowProfileModal(true);
                      }}
                      className="p-1.5 text-theme-text/40 hover:text-theme-icon rounded-lg hover:bg-theme-surface/50 transition-colors"
                    >
                      <FaEdit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteProfile(profile.id)}
                      className="p-1.5 text-theme-text/40 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Profile modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 bg-theme-background border border-theme-border/20 rounded-2xl shadow-2xl">
            <h2 className="text-lg font-bold text-theme-text mb-4">
              {editingProfile ? 'Edit Profile' : 'Save as Profile'}
            </h2>
            <p className="text-xs text-theme-text/40 mb-4">
              Saves the current set of <strong className="text-theme-text/60">{enabledCount} enabled entries</strong> as a named profile.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-theme-text/50 mb-1">Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g., Development, Focus, Work"
                  className="w-full px-3 py-2 bg-theme-surface/50 border border-theme-border/20 rounded-xl text-sm text-theme-text placeholder-theme-text/30 focus:outline-none focus:border-theme-icon/40"
                />
              </div>
              <div>
                <label className="block text-xs text-theme-text/50 mb-1">Description</label>
                <input
                  type="text"
                  value={profileDesc}
                  onChange={(e) => setProfileDesc(e.target.value)}
                  placeholder="e.g., Point all dev domains to localhost"
                  className="w-full px-3 py-2 bg-theme-surface/50 border border-theme-border/20 rounded-xl text-sm text-theme-text placeholder-theme-text/30 focus:outline-none focus:border-theme-icon/40"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 text-xs text-theme-text/60 hover:text-theme-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                className="px-4 py-2 text-xs bg-theme-icon/20 text-theme-icon border border-theme-icon/30 rounded-xl hover:bg-theme-icon/30 transition-colors font-medium"
              >
                {editingProfile ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
