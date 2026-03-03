import { useState, useEffect } from 'react';
import api, { LoginAttempt } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, CheckCircle, XCircle, Activity, Shield } from 'lucide-react';
import { LibraryDownload } from './LibraryDownload';
import { ActivityChart } from './ActivityChart';

export function UserDashboard() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAttempts();
    }
  }, [user]);

  const loadAttempts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/login-attempts');
      // Filter for current user if backend doesn't handle it, 
      // but usually the backend should return only relevant data for the current user.
      // For now, I'll filter here if needed, but my backend /login-attempts returns ALL for admin.
      // I should update the backend to filter by user if not admin.
      setAttempts(data.filter((a: any) => a.actual_user_id === user?.id));
    } catch (error) {
      console.error('Failed to load user attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: attempts.length,
    bypass: attempts.filter((a) => a.bypass_detected).length,
    failed: attempts.filter((a) => !a.attempt_success).length,
    success: attempts.filter((a) => a.attempt_success).length,
  };

  const chartData = attempts.reduce((acc: any[], attempt) => {
    const date = attempt.created_at ? new Date(attempt.created_at).toLocaleDateString() : 'Unknown';
    const existing = acc.find(item => item.time === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ time: date, count: 1 });
    }
    return acc;
  }, []).slice(-7);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Activity</h1>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold">Security Monitor</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Attempts"
          value={stats.total}
          icon={<Activity className="w-6 h-6 text-blue-600" />}
          color="blue"
        />
        <StatCard
          title="Bypass Detected"
          value={stats.bypass}
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          color="red"
        />
        <StatCard
          title="Failed Attempts"
          value={stats.failed}
          icon={<XCircle className="w-6 h-6 text-orange-600" />}
          color="orange"
        />
        <StatCard
          title="Successful"
          value={stats.success}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          color="green"
        />
      </div>

      <ActivityChart data={chartData} title="My Login Activity (Last 7 Days)" />

      <LibraryDownload />

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">My Login Attempts</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track all login attempts associated with your account
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username Attempted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bypass Detected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {attempts.map((attempt) => (
                <tr key={attempt.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {attempt.created_at ? new Date(attempt.created_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {attempt.attempted_username}
                      </div>
                      {attempt.bypass_detected && attempt.actual_username && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 italic">
                          Target: {attempt.actual_username}
                        </div>
                      )}
                    </div>
                    {attempt.bypass_detected && (
                      <div className="flex flex-col gap-1 mt-1">
                        {attempt.bypass_details?.substitutions && (
                          <div className="flex flex-wrap gap-1">
                            {attempt.bypass_details.substitutions.map((s: any, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-[10px] font-mono text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800">
                                {s.original} → {s.substitution}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {attempt.attempt_success ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {attempt.bypass_detected ? (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-600">Yes</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {attempt.website_domain || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {attempt.ip_address || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {attempts.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-slate-600" />
              <p className="font-semibold">No login attempts yet</p>
              <p className="text-sm mt-1">
                Download the library and integrate it into your website to start tracking
              </p>
            </div>
          )}
        </div>
      </div>

      {stats.bypass > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">Security Alert</h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                We detected {stats.bypass} bypass attempt{stats.bypass > 1 ? 's' : ''} on your
                account. Someone may be trying to access your account using character substitutions.
                Please review your security settings and consider changing your password.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30 text-blue-900 dark:text-blue-100',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 text-red-900 dark:text-red-100',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-900/30 text-orange-900 dark:text-orange-100',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30 text-green-900 dark:text-green-100',
  };

  return (
    <div className={`rounded-xl p-6 border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-70 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}
