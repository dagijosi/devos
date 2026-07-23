import { useState } from 'react';
import { FaClock, FaFire, FaCode, FaProjectDiagram, FaDownload, FaPlus, FaTimes } from 'react-icons/fa';
import { Portal } from '../../../components/ui/overlays/Portal';
import { useAnalytics } from '../hooks/useAnalytics';
import { StatCard } from '../components/StatCard';
import { SessionsChart } from '../components/SessionsChart';

type Period = 'weekly' | 'monthly' | 'yearly';

export function AnalyticsPage() {
  const {
    dailyStats, weeklyData, monthlyData, yearlyData,
    projectCount, loading, totalMonthlyMinutes, totalYearlyMinutes,
    addSession, exportCSV,
  } = useAnalytics();

  const [period, setPeriod] = useState<Period>('weekly');
  const [showAdd, setShowAdd] = useState(false);
  const [addMinutes, setAddMinutes] = useState(30);
  const [addType, setAddType] = useState('focus');
  const [addLabel, setAddLabel] = useState('');

  const chartData = period === 'weekly' ? weeklyData : period === 'monthly' ? monthlyData : yearlyData;

  const handleAdd = async () => {
    if (addMinutes > 0) {
      await addSession(addMinutes, addType, addLabel);
      setShowAdd(false);
      setAddMinutes(30);
      setAddLabel('');
    }
  };

  const formatMinutes = (m: number) => {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return `${h}h ${rem}m`;
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <h1 className="text-2xl font-bold text-theme-text">Analytics</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5 animate-pulse"><div className="h-8 bg-theme-border/20 rounded w-1/2 mb-2" /><div className="h-4 bg-theme-border/20 rounded w-1/3" /></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-text">Analytics</h1>
          <p className="text-sm text-theme-text/60 mt-1">Track your development activity and focus time</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90 transition-colors">
            <FaPlus className="w-3 h-3" /> Log Session
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-theme-surface border border-theme-border/50 text-theme-text rounded-xl text-sm font-medium hover:bg-theme-surface/80 transition-colors">
            <FaDownload className="w-3 h-3" /> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today" value={formatMinutes(dailyStats.total_minutes)} icon={<FaClock className="w-5 h-5 text-theme-icon" />} sub={`${dailyStats.sessions} sessions`} />
        <StatCard label="Focus Time" value={formatMinutes(dailyStats.focus_minutes)} icon={<FaFire className="w-5 h-5 text-orange-400" />} sub="Today" />
        <StatCard label="This Month" value={formatMinutes(totalMonthlyMinutes)} icon={<FaCode className="w-5 h-5 text-green-400" />} sub="Coding & focus" />
        <StatCard label="Projects" value={projectCount} icon={<FaProjectDiagram className="w-5 h-5 text-blue-400" />} sub="Active projects" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {(['weekly', 'monthly', 'yearly'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                period === p ? 'bg-theme-icon text-white' : 'bg-theme-surface text-theme-text/50 border border-theme-border/20 hover:border-theme-border/40'
              }`}
            >{p}</button>
          ))}
        </div>
        <SessionsChart data={chartData} period={period} />
      </div>

      {showAdd && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-theme-surface border border-theme-border rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border/30">
                <h3 className="text-sm font-semibold text-theme-text">Log Session</h3>
                <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-theme-border/20"><FaTimes className="w-4 h-4 text-theme-text/50" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs text-theme-text/60 mb-1 block">Duration (minutes)</label>
                  <input type="number" min={1} value={addMinutes} onChange={e => setAddMinutes(parseInt(e.target.value) || 1)} className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text outline-none focus:border-theme-icon/50" />
                </div>
                <div>
                  <label className="text-xs text-theme-text/60 mb-1 block">Type</label>
                  <select value={addType} onChange={e => setAddType(e.target.value)} className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text outline-none focus:border-theme-icon/50">
                    <option value="focus">Focus</option>
                    <option value="coding">Coding</option>
                    <option value="debugging">Debugging</option>
                    <option value="planning">Planning</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-theme-text/60 mb-1 block">Label (optional)</label>
                  <input type="text" value={addLabel} onChange={e => setAddLabel(e.target.value)} placeholder="e.g. Working on API" className="w-full bg-theme-background border border-theme-border/30 rounded-xl px-4 py-2.5 text-sm text-theme-text placeholder:text-theme-text/40 outline-none focus:border-theme-icon/50" />
                </div>
              </div>
              <div className="px-5 py-3 border-t border-theme-border/30 flex justify-end gap-2">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-theme-text/60 hover:text-theme-text">Cancel</button>
                <button onClick={handleAdd} className="px-5 py-2 bg-theme-icon text-white rounded-xl text-sm font-medium hover:bg-theme-icon/90">Log</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
