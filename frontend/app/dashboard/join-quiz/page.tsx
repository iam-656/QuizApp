'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { KeyRound, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function JoinQuizPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { token, isAuthenticated, loading: authLoading } = useAuth();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 16) {
      setError('Please enter a full 16-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Ask for camera permissions first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop all tracks immediately so we don't keep the camera on needlessly on this page
        stream.getTracks().forEach(track => track.stop());
      } catch (camErr) {
        setError('Camera permission is required to proceed with this proctored assessment.');
        setLoading(false);
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await axios.get(`${API_URL}/quizzes/code/${code}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Redirect to the actual quiz attempt page
      router.push(`/quiz/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid quiz code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 flex items-center justify-center p-4 md:p-8 pt-20 md:pt-8 w-full">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-xl shadow-blue-100/50 p-10 border border-gray-100 text-center">
            <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
              <ShieldCheck className="text-blue-600" size={40} />
            </div>
            
            <h1 className="text-3xl font-black text-gray-900 mb-2">Join Assessment</h1>
            <p className="text-gray-500 mb-10">Enter your 16-digit access code to begin the quiz.</p>

            <form onSubmit={handleJoin} className="space-y-8">
              <div className="relative">
                <input
                  type="text"
                  maxLength={16}
                  placeholder="0000000000000000"
                  className="w-full text-center text-3xl tracking-[0.25em] font-mono py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-gray-200"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setCode(val);
                    if (val.length > 0) setError('');
                  }}
                  required
                />
                
                {error && (
                  <div className="mt-4 flex items-center gap-2 text-red-500 text-sm justify-center bg-red-50 py-2 px-4 rounded-xl border border-red-100">
                    <Info size={16} />
                    {error}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 16}
                className={`w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all ${
                  loading || code.length !== 16
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-200 hover:-translate-y-1 active:translate-y-0'
                }`}
              >
                {loading ? 'Verifying Code...' : 'Access Quiz'}
                {!loading && <ArrowRight size={24} />}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-gray-50">
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                By entering the code, you agree to our assessment integrity policies. 
                Your activity will be monitored for proctoring purposes.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
