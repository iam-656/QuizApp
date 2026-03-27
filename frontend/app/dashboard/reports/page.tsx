'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { FileText, ChevronRight, Trash2, AlertTriangle } from 'lucide-react';

interface Attempt {
  id: string;
  quiz_title: string;
  score: number;
  started_at: string;
  submitted_at: string | null;
}

export default function ReportsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      fetchAttempts();
    }
  }, [isAuthenticated]);

  const fetchAttempts = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await axios.get(`${API_URL}/attempts/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttempts(res.data);
    } catch (err) {
      console.error('Error fetching attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (attemptId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      await axios.delete(`${API_URL}/attempts/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttempts(prev => prev.filter(a => a.id !== attemptId));
    } catch (err) {
      console.error('Error deleting report:', err);
      alert('Failed to delete report.');
    }
  };

  const handleClearAllReports = async () => {
    if (!confirm('WARNING: Are you absolutely sure you want to delete ALL your reports? This action is permanent.')) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      await axios.delete(`${API_URL}/attempts/user/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttempts([]);
    } catch (err) {
      console.error('Error clearing all reports:', err);
      alert('Failed to clear reports.');
    }
  };

  if (loading) {
    return <div className="flex justify-center pt-20"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <FileText size={28} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
          </div>
          {attempts.length > 0 && (
            <button 
              onClick={handleClearAllReports}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors text-sm border-2 border-red-100"
            >
              <AlertTriangle size={16} /> Clear All My Reports
            </button>
          )}
        </div>

        {attempts.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border text-center">
            <p className="text-gray-500 mb-4">You haven't taken any quizzes yet.</p>
            <button 
              onClick={() => router.push('/dashboard/join-quiz')}
              className="text-blue-600 font-semibold hover:underline"
            >
              Join a quiz to get started
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt) => (
              <div 
                key={attempt.id}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group"
              >
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-gray-900">{attempt.quiz_title}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{new Date(attempt.started_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className={attempt.submitted_at ? 'text-green-600 font-medium' : 'text-orange-500 font-medium'}>
                      {attempt.submitted_at ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Score</div>
                    <div className="text-2xl font-black text-blue-600">
                      {attempt.score !== null ? `${Math.round(attempt.score)}%` : '--'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => router.push(`/dashboard/reports/${attempt.id}`)}
                      className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors font-bold"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteReport(attempt.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
