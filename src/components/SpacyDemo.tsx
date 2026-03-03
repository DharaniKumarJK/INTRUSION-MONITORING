import React, { useState } from 'react';
import { Send, Cpu } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const SpacyDemo: React.FC = () => {
    const [text, setText] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const processText = async () => {
        if (!text) return;
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/process', { text });
            setResult(response.data);
            toast.success('Text processed successfully!');
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || 'An error occurred';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 mt-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <span className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">NLP</span>
                spaCy (Python) Demo
            </h2>

            <div className="space-y-4">
                <div className="relative">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter text to analyze with spaCy..."
                        className="w-full p-4 pr-12 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none min-h-[100px]"
                    />
                    <button
                        onClick={processText}
                        disabled={loading}
                        className="absolute bottom-4 right-4 p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-slate-300 transition-colors"
                    >
                        {loading ? <Cpu className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30 italic">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Analysis Result</h3>
                        <div className="flex flex-wrap gap-2">
                            {result.entities && result.entities.length > 0 ? (
                                result.entities.map((ent: any, i: number) => (
                                    <span key={i} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded text-sm font-medium">
                                        {ent.text} ({ent.label})
                                    </span>
                                ))
                            ) : (
                                <p className="text-slate-500 dark:text-slate-400 italic">No entities found.</p>
                            )}
                        </div>
                        <div className="mt-4">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                <strong>Tokens:</strong> {result.tokens?.join(', ')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpacyDemo;
