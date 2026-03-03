import React, { useState, useEffect } from 'react';
import { Restriction } from '../lib/api';
import { Lock } from 'lucide-react';

interface ActiveRestrictionsProps {
    restrictions: Restriction[];
}

export const ActiveRestrictions: React.FC<ActiveRestrictionsProps> = ({ restrictions }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const getTimeRemaining = (expiresAt: string) => {
        const expiredDate = new Date(expiresAt);
        const diff = expiredDate.getTime() - now.getTime();
        if (diff <= 0) return 'Expired';
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-red-600" />
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Active & Past Restrictions</h2>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {restrictions.map((r) => {
                    const timeRemaining = getTimeRemaining(r.expires_at);
                    const isExpired = timeRemaining === 'Expired';
                    return (
                        <div key={r.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50/50 dark:bg-slate-900/50 transition-hover hover:bg-white dark:hover:bg-slate-800/80 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-800 dark:text-white truncate max-w-[150px]">{r.identifier}</span>
                                {isExpired ? (
                                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider border border-gray-200 dark:border-slate-600">Expired</span>
                                ) : (
                                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 animate-pulse font-bold uppercase tracking-wider border border-red-200 dark:border-red-800">Active</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-gray-500 dark:text-gray-400">Time Remaining:</span>
                                {!isExpired ? (
                                    <span className="text-red-600 dark:text-red-400 font-mono font-bold">{timeRemaining}</span>
                                ) : (
                                    <span className="text-gray-400 font-mono">0m 0s</span>
                                )}
                            </div>
                        </div>
                    );
                })}
                {restrictions.length === 0 && (
                    <p className="text-center text-gray-500 py-4 italic">No restrictions found</p>
                )}
            </div>
        </div>
    );
};
