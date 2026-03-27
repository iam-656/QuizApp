'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { Clock, ChevronLeft, ChevronRight, Send, AlertCircle } from 'lucide-react';
import ProctoringManager from '@/components/ProctoringManager';

interface Question {
  id: string;
  question_text: string;
  options: string[];
}

interface Quiz {
  id: string;
  title: string;
  duration: number;
  questions: Question[];
}

export default function QuizAttemptPage() {
  const { quizId } = useParams();
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState({ tabs: 0, fullscreen: 0 });

  const logSecurityEvent = useCallback(async (eventType: string) => {
    if (!attemptId) return;
    
    if (eventType === 'TAB_SWITCH' || eventType === 'WINDOW_BLUR') {
      handleAutoSubmit('Tab switch detected. Assessment terminated.');
    }

    if (eventType === 'FULLSCREEN_EXIT') {
      handleAutoSubmit('Fullscreen exit detected. Assessment terminated.');
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      await axios.post(
        `${API_URL}/attempts/events`,
        { attempt_id: attemptId, event_type: eventType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Failed to log security event:', err);
    }
  }, [attemptId, token]);

  const handleAutoSubmit = async (reason: string) => {
    if (submitting) return;
    alert(`SECURITY VIOLATION: ${reason}`);
    await handleSubmit();
  };

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && document.fullscreenElement) {
        logSecurityEvent('TAB_SWITCH');
      }
    };

    const handleBlur = () => {
      if (document.fullscreenElement) {
        logSecurityEvent('WINDOW_BLUR');
      }
    };

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull && !loading) {
        logSecurityEvent('FULLSCREEN_EXIT');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [logSecurityEvent, loading]);

  const fetchQuiz = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      
      // 1. Get Quiz Data
      const quizRes = await axios.get(`${API_URL}/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuiz(quizRes.data);
      setTimeLeft(quizRes.data.duration * 60);

      // 2. Start Attempt
      const attemptRes = await axios.post(
        `${API_URL}/attempts/start`,
        { quiz_id: quizId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttemptId(attemptRes.data.attempt.id);
    } catch (err: any) {
      console.error('Error starting quiz:', err);
      const errorMsg = err.response?.data?.error || 'Could not load quiz. Returning to dashboard.';
      alert(errorMsg);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [quizId, token, router]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (isAuthenticated && quizId) {
      fetchQuiz();
    }
  }, [isAuthenticated, authLoading, quizId, fetchQuiz, router]);

  // Timer logic
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft === 0) handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleOptionSelect = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
        question_id: qId,
        selected_answer: ans
      }));

      await axios.post(
        `${API_URL}/attempts/submit`,
        { attempt_id: attemptId, answers: formattedAnswers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      router.push('/dashboard/reports');
    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Fullscreen & Device Enforcement Overlay
  if (!isFullscreen) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-2xl">
          <div className="bg-orange-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-orange-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Fullscreen Required</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            To ensure assessment integrity, this quiz can only be taken in **fullscreen mode** on a **desktop device**.
          </p>
          <button
            onClick={enterFullscreen}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            Enter Fullscreen & Start
          </button>
          <p className="mt-6 text-xs text-gray-400 uppercase tracking-widest font-bold">
            Mobile and Tablet access is restricted
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIdx];
  const progress = ((currentIdx + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <ProctoringManager attemptId={attemptId as string} token={token} onViolation={handleAutoSubmit} />
      {/* Quiz Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
            <p className="text-sm text-gray-500">Question {currentIdx + 1} of {quiz.questions.length}</p>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold border-2 ${
            (timeLeft || 0) < 60 ? 'bg-red-50 border-red-100 text-red-600 animate-pulse' : 'bg-blue-50 border-blue-100 text-blue-600'
          }`}>
            <Clock size={20} />
            {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-100">
          <div 
            className="h-full bg-blue-600 transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-12">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[400px] flex flex-col">
          {/* Question Text */}
          <h2 className="text-2xl font-bold text-gray-800 mb-8 leading-tight">
            {currentQuestion.question_text}
          </h2>

          {/* Options */}
          <div className="space-y-4 flex-1">
            {currentQuestion.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleOptionSelect(currentQuestion.id, opt)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group ${
                  answers[currentQuestion.id] === opt
                    ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  answers[currentQuestion.id] === opt ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                }`}>
                  {answers[currentQuestion.id] === opt && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className={`text-lg font-medium ${answers[currentQuestion.id] === opt ? 'text-blue-900' : 'text-gray-600'}`}>
                  {opt}
                </span>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-12 flex items-center justify-between pt-8 border-t border-gray-50">
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                currentIdx === 0 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft size={20} /> Previous
            </button>

            {currentIdx === quiz.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-100 flex items-center gap-2 transition-all active:scale-95"
              >
                {submitting ? 'Submitting...' : 'Finish Attempt'} <Send size={18} />
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center gap-2 transition-all active:scale-95"
              >
                Next Question <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-gray-400 justify-center">
          <AlertCircle size={16} />
          <p className="text-sm font-medium">Your progress is automatically saved locally.</p>
        </div>
      </main>
    </div>
  );
}
