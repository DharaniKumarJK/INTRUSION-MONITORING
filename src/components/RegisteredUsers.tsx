import React from 'react';
import { UserProfile } from '../lib/api';
import { Users } from 'lucide-react';

interface RegisteredUsersProps {
    users: UserProfile[];
}

export const RegisteredUsers: React.FC<RegisteredUsersProps> = ({ users }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Registered Users
            </h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {users.map((user) => (
                    <div key={user.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50/50 dark:bg-slate-900/50 transition-hover hover:bg-white dark:hover:bg-slate-800/80 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-800 dark:text-white truncate max-w-[150px]">{user.email}</span>
                            <span
                                className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin'
                                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                    : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                    }`}
                            >
                                {user.role}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                    </div>
                ))}
                {users.length === 0 && (
                    <p className="text-center text-gray-500 py-4 italic">No users found</p>
                )}
            </div>
        </div>
    );
};
