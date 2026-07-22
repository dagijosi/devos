import { useState } from 'react';
import { Card, Badge, Button } from '../components/ui';
import { FaFilter, FaDownload } from 'react-icons/fa';
import { activities } from '../data';

const Activity = () => {
    const [filter, setFilter] = useState('All');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-theme-text mb-2">System Activity</h1>
                    <p className="text-theme-text/60">Recent logs and audit trails.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" leftIcon={<FaFilter />}>Filter</Button>
                    <Button variant="outline" leftIcon={<FaDownload />}>Export</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card title="Timeline" className="relative">
                        <div className="absolute left-[39px] top-16 bottom-6 w-[2px] bg-theme-border/50"></div>
                        <div className="space-y-8 relative">
                            {activities.map((item) => (
                                <div key={item.id} className="flex gap-4 group">
                                    <div className={`
                                        relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg border-4 border-theme-surface shadow-sm transition-transform group-hover:scale-110
                                        ${item.type === 'success' ? 'bg-emerald-500 text-white' : ''}
                                        ${item.type === 'info' ? 'bg-blue-500 text-white' : ''}
                                        ${item.type === 'warning' ? 'bg-amber-500 text-white' : ''}
                                        ${item.type === 'error' ? 'bg-red-500 text-white' : ''}
                                    `}>
                                        {item.type === 'success' && '✓'}
                                        {item.type === 'info' && 'i'}
                                        {item.type === 'warning' && '!'}
                                        {item.type === 'error' && '✕'}
                                    </div>
                                    <div className="flex-1 bg-theme-background/50 p-4 rounded-xl border border-theme-border hover:border-theme-icon/30 hover:bg-theme-background transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-semibold text-theme-text">{item.action}</h4>
                                            <span className="text-xs text-theme-text/40 bg-theme-surface px-2 py-1 rounded-full border border-theme-border">
                                                {item.time}
                                            </span>
                                        </div>
                                        <p className="text-sm text-theme-text/70 mb-2">{item.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-theme-text/50">
                                            <div className="w-5 h-5 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-[10px] font-bold">
                                                {item.user.charAt(0)}
                                            </div>
                                            <span>{item.user}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 text-center border-t border-theme-border pt-4">
                            <Button variant="ghost" size="sm">View Older Activity</Button>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card title="Quick Stats">
                         <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-theme-background rounded-xl border border-theme-border">
                                <span className="text-theme-text/70 text-sm">Total Events</span>
                                <span className="font-bold text-theme-text">2,450</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-500/5 rounded-xl border border-red-500/20">
                                <span className="text-red-600 text-sm font-medium">Critical Errors</span>
                                <Badge variant="error" className="shadow-none">12</Badge>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
                                <span className="text-amber-600 text-sm font-medium">Warnings</span>
                                <Badge variant="warning" className="shadow-none">5</Badge>
                            </div>
                         </div>
                    </Card>

                    <Card title="Event Type">
                        <div className="flex flex-wrap gap-2">
                            {['All', 'Errors', 'Warnings', 'Success', 'Info'].map((f) => (
                                <button 
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`
                                        px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                                        ${filter === f 
                                            ? 'bg-theme-icon text-white shadow-md shadow-theme-icon/20' 
                                            : 'bg-theme-background text-theme-text/70 hover:bg-theme-surface-active hover:text-theme-text border border-theme-border'}
                                    `}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Activity;
