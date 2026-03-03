import { useState, useEffect } from 'react';
import api, { LoginAttempt, UserProfile } from '../lib/api';
import { AlertTriangle, CheckCircle, XCircle, Users, Activity } from 'lucide-react';
import { ActivityChart } from './ActivityChart';

interface AdminDashboardProps {
  users: UserProfile[];
}

export function AdminDashboard({ users }: AdminDashboardProps) {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bypass' | 'failed' | 'success'>('all');
  const [showAllAttempts, setShowAllAttempts] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/login-attempts');
      setAttempts(response.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAttempts = attempts.filter((attempt) => {
    if (filter === 'bypass') return attempt.bypass_detected;
    if (filter === 'failed') return !attempt.attempt_success;
    if (filter === 'success') return attempt.attempt_success;
    return true;
  });

  const displayedAttempts = showAllAttempts ? filteredAttempts : filteredAttempts.slice(0, 10);

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
  }, []).slice(-7); // Last 7 days

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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold">{users.length} Users</span>
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

      <ActivityChart data={chartData} title="Login Activity (Last 7 Days)" />

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Login Attempts</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Attempts</option>
              <option value="bypass">Bypass Attempts Only</option>
              <option value="failed">Failed Only</option>
              <option value="success">Successful Only</option>
            </select>
          </div>
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
                  Bypass
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {displayedAttempts.map((attempt) => (
                <tr key={attempt.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {attempt.created_at ? new Date(attempt.created_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {attempt.attempted_username}
                      </span>
                      {attempt.bypass_detected && attempt.actual_username && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 italic">
                          Target: {attempt.actual_username}
                        </span>
                      )}
                    </div>
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
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-600">Detected</span>
                        </div>
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
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">No</span>
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

          {filteredAttempts.length > 10 && (
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex justify-center">
              <button
                onClick={() => setShowAllAttempts(!showAllAttempts)}
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-2 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                {showAllAttempts ? 'Show Less' : `Show More (${filteredAttempts.length - 10} more)`}
              </button>
            </div>
          )}

          {filteredAttempts.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No login attempts found
            </div>
          )}
        </div>
      </div>
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
