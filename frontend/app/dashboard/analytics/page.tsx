'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  CheckCircle, 
  TrendingUp, 
  Search, 
  ArrowRight,
  Filter,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';

interface Attempt {
  attempt_id: string;
  score: number;
  started_at: string;
  submitted_at: string | null;
  student_name: string;
  student_email: string;
  quiz_title: string;
  quiz_id: string;
}

export default function AnalyticsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState('all');
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (isAuthenticated) {
      fetchCreatorAttempts();
    }
  }, [isAuthenticated, authLoading]);

  const fetchCreatorAttempts = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await axios.get(`${API_URL}/quizzes/creator/attempts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttempts(res.data);
    } catch (err) {
      console.error('Error fetching creator attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttempt = async (attemptId: string) => {
    if (!confirm('Are you sure you want to delete this attempt? This action cannot be undone.')) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      await axios.delete(`${API_URL}/attempts/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttempts(prev => prev.filter(a => a.attempt_id !== attemptId));
    } catch (err) {
      console.error('Error deleting attempt:', err);
      alert('Failed to delete attempt.');
    }
  };

  const handleClearQuizData = async () => {
    if (selectedQuizId === 'all') return;
    if (!confirm('Are you sure you want to delete ALL attempts for this specific quiz? This will permanently erase all analytics for this quiz.')) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      await axios.delete(`${API_URL}/attempts/quiz/${selectedQuizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttempts(prev => prev.filter(a => a.quiz_id !== selectedQuizId));
      setSelectedQuizId('all');
    } catch (err) {
      console.error('Error clearing quiz data:', err);
      alert('Failed to clear quiz data.');
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('WARNING: Are you absolutely sure you want to delete ALL analytics data for ALL your quizzes? This action is permanent and cannot be undone.')) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      await axios.delete(`${API_URL}/attempts/creator/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttempts([]);
    } catch (err) {
      console.error('Error clearing all data:', err);
      alert('Failed to clear all analytics data.');
    }
  };

  const uniqueQuizzes = Array.from(new Set(attempts.map(a => a.quiz_id))).map(id => {
    return {
      id,
      title: attempts.find(a => a.quiz_id === id)?.quiz_title || 'Unknown Quiz'
    };
  });

  const activeAttempts = selectedQuizId === 'all' 
    ? attempts 
    : attempts.filter(a => a.quiz_id === selectedQuizId);

  const filteredAttempts = activeAttempts.filter(a => 
    a.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.quiz_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.student_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Chart Data: Score Distribution
  const scoreData = [
    { range: '0-20', count: activeAttempts.filter(a => a.score <= 20).length },
    { range: '21-40', count: activeAttempts.filter(a => a.score > 20 && a.score <= 40).length },
    { range: '41-60', count: activeAttempts.filter(a => a.score > 40 && a.score <= 60).length },
    { range: '61-80', count: activeAttempts.filter(a => a.score > 60 && a.score <= 80).length },
    { range: '81-100', count: activeAttempts.filter(a => a.score > 80).length },
  ];

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const avgScore = activeAttempts.length > 0 
    ? activeAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / activeAttempts.length 
    : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 w-full">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-500 mt-1">Comprehensive overview of all student attempts and performance.</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedQuizId !== 'all' && activeAttempts.length > 0 && (
                <button 
                  onClick={handleClearQuizData}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 font-bold rounded-xl hover:bg-orange-100 transition-colors text-sm"
                >
                  <Trash2 size={16} /> Clear Quiz Data
                </button>
              )}
              {attempts.length > 0 && (
                <button 
                  onClick={handleClearAllData}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors text-sm border-2 border-red-100"
                >
                  <AlertTriangle size={16} /> Clear All Analytics
                </button>
              )}
            </div>
          </header>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                <Users size={24} />
              </div>
              <div className="text-3xl font-black text-gray-900">{activeAttempts.length}</div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Attempts</div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center text-green-600 mb-4">
                <TrendingUp size={24} />
              </div>
              <div className="text-3xl font-black text-gray-900">{Math.round(avgScore)}%</div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Average Score</div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-600 mb-4">
                <CheckCircle size={24} />
              </div>
              <div className="text-3xl font-black text-gray-900">
                {activeAttempts.filter(a => a.submitted_at).length}
              </div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Submissions</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Chart: Score Distribution */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Score Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
               <h3 className="text-lg font-bold text-gray-900 mb-6 self-start">Completion Rate</h3>
               <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: activeAttempts.filter(a => a.submitted_at).length },
                        { name: 'Abandoned', value: activeAttempts.filter(a => !a.submitted_at).length }
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f1f5f9" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
               </div>
               <div className="text-center">
                  <span className="text-2xl font-black text-gray-900">
                    {activeAttempts.length > 0 ? Math.round((activeAttempts.filter(a => a.submitted_at).length / activeAttempts.length) * 100) : 0}%
                  </span>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Completion</p>
               </div>
            </div>
          </div>

          {/* Search and Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-gray-900">Recent Attempts</h3>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    className="pl-10 pr-8 py-2 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-100 outline-none w-full appearance-none cursor-pointer"
                    value={selectedQuizId}
                    onChange={(e) => setSelectedQuizId(e.target.value)}
                  >
                    <option value="all">All Quizzes</option>
                    {uniqueQuizzes.map(q => (
                      <option key={q.id} value={q.id}>{q.title}</option>
                    ))}
                  </select>
                </div>
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search student or quiz..."
                    className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none w-full md:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Quiz</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Score</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAttempts.map((attempt) => (
                    <tr key={attempt.attempt_id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{attempt.student_name}</div>
                        <div className="text-xs text-gray-400">{attempt.student_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-700">{attempt.quiz_title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                          attempt.submitted_at ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                          {attempt.submitted_at ? 'Submitted' : 'In Progress'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-lg font-black text-blue-600">
                          {attempt.score !== null ? `${Math.round(attempt.score)}%` : '--'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                        {new Date(attempt.started_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => router.push(`/dashboard/reports/${attempt.attempt_id}`)}
                            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
                          >
                            Details <ArrowRight size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteAttempt(attempt.attempt_id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Delete Attempt"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredAttempts.length === 0 && (
              <div className="p-20 text-center text-gray-400 font-bold">
                No attempts found matching your search.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
