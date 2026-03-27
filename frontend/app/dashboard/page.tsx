'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import { MoreVertical, Clock, Calendar, Users, Copy, Check, FileBarChart } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  description: string;
  quiz_code: string;
  duration: number;
  created_at: string;
}

export default function DashboardPage() {
  const { user, token, isAuthenticated, loading } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [fetching, setFetching] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    } else if (isAuthenticated) {
      fetchUserQuizzes();
    }
  }, [isAuthenticated, loading, router]);

  const fetchUserQuizzes = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await axios.get(`${API_URL}/quizzes/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(res.data);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    } finally {
      setFetching(false);
    }
  };

  const copyToClipboard = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteQuiz = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this quiz? All related questions and attempts will be removed permanently.')) return;
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      await axios.delete(`${API_URL}/quizzes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(prev => prev.filter(q => q.id !== id));
      setOpenDropdownId(null);
    } catch (err: any) {
      console.error('Failed to delete quiz:', err);
      alert('Failed to delete the quiz. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 w-full">
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Recent Quizzes</h1>
              <p className="text-gray-500 mt-1">Manage and monitor your created assessments.</p>
            </div>
            <button 
              onClick={() => router.push('/dashboard/create-quiz')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
            >
              New Quiz
            </button>
          </header>

          {fetching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-gray-50 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                <Calendar className="text-gray-300" size={48} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No quizzes yet</h3>
              <p className="text-gray-500 mt-2">Start by creating your first assessment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {quizzes.map((quiz) => (
                <div 
                  key={quiz.id} 
                  onClick={() => router.push(`/dashboard/edit-quiz/${quiz.id}`)}
                  className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50/50 transition-all overflow-hidden flex flex-col cursor-pointer relative"
                >
                  {/* Card Thumbnail Area */}
                  <div className="h-32 bg-gray-50 flex items-center justify-center relative group-hover:bg-blue-50 transition-colors">
                    <div className="text-blue-200 group-hover:text-blue-300 transition-colors">
                      <FileBarChart size={64} />
                    </div>
                    
                    {/* Three Dots Menu Container */}
                    <div className="absolute top-2 right-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === quiz.id ? null : quiz.id);
                        }}
                        className="p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 rounded-lg transition-all opacity-0 group-hover:opacity-100 bg-transparent"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openDropdownId === quiz.id && (
                        <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/edit-quiz/${quiz.id}`);
                            }}
                            className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-gray-50 text-gray-700"
                          >
                            Edit
                          </button>
                          <div className="w-full border-t border-gray-100"></div>
                          <button 
                            onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                            className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-red-50 text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Info Area */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {quiz.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {quiz.duration}m
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(quiz.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Quiz Code</span>
                        <span className="text-sm font-mono font-bold text-gray-700">{quiz.quiz_code.slice(0, 4)}...{quiz.quiz_code.slice(-4)}</span>
                      </div>
                      <button 
                        onClick={(e) => copyToClipboard(quiz.quiz_code, e)}
                        className={`p-2 rounded-lg transition-all ${
                          copiedCode === quiz.quiz_code 
                            ? 'bg-green-50 text-green-600' 
                            : 'bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                      >
                        {copiedCode === quiz.quiz_code ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
