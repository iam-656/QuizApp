'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { PlusCircle, Trash2, CheckCircle2, Layout, Clock, AlignLeft, Save } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

interface Question {
  question_text: string;
  options: string[];
  correct_answer: string;
}

export default function CreateQuizPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [expiresAt, setExpiresAt] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { question_text: '', options: ['', '', '', ''], correct_answer: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [minDateTime, setMinDateTime] = useState('');

  useEffect(() => {
    const updateMinTime = () => {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setMinDateTime(now.toISOString().slice(0, 16));
    };
    updateMinTime();
    const interval = setInterval(updateMinTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', options: ['', '', '', ''], correct_answer: '' }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert('Please enter a quiz title');

    if (expiresAt) {
      const selectedTime = new Date(expiresAt).getTime();
      const currentTime = new Date().getTime();
      if (selectedTime <= currentTime) {
        return alert('Expiry date and time must be in the future.');
      }
    }
    
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      
      const quizRes = await axios.post(
        `${API_URL}/quizzes`,
        { title, description, duration, expires_at: expiresAt ? new Date(expiresAt).toISOString() : null },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const quizId = quizRes.data.quiz.id;

      await axios.post(
        `${API_URL}/quizzes/${quizId}/questions`,
        { questions },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      router.push('/dashboard');
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0ebf8] flex">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 w-full">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-xl shadow-sm border-t-[10px] border-blue-600 overflow-hidden">
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Quiz Title"
                className="w-full text-4xl font-bold border-b border-transparent focus:border-gray-200 outline-none py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="flex items-center gap-4 border-b border-transparent focus-within:border-gray-200">
                <AlignLeft size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Quiz Description"
                  className="w-full py-2 outline-none text-gray-600"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-4 border-t border-gray-100 mt-2">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Clock size={16} />
                  <span>Duration:</span>
                  <input 
                    type="number" 
                    className="w-16 border-b border-gray-200 outline-none text-center font-bold text-blue-600"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                  />
                  <span>minutes</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Clock size={16} />
                  <span>Expiry Date (Optional):</span>
                  <input 
                    type="datetime-local" 
                    className="border-b border-gray-200 outline-none font-bold text-gray-700 bg-transparent cursor-pointer"
                    value={expiresAt}
                    min={minDateTime}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-white rounded-xl shadow-sm p-6 relative border-l-4 border-transparent focus-within:border-blue-500 transition-all">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1 mr-4">
                  <input
                    type="text"
                    placeholder={`Question ${qIndex + 1}`}
                    className="w-full bg-gray-50 p-4 rounded-lg font-semibold outline-none focus:ring-2 focus:ring-blue-100"
                    value={q.question_text}
                    onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => removeQuestion(qIndex)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-3 group">
                    <div 
                      onClick={() => updateQuestion(qIndex, 'correct_answer', opt)}
                      className={`cursor-pointer transition-colors ${q.correct_answer === opt && opt !== '' ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
                    >
                      <CheckCircle2 size={24} />
                    </div>
                    <input
                      type="text"
                      placeholder={`Option ${oIndex + 1}`}
                      className={`flex-1 p-2 outline-none border-b border-transparent focus:border-gray-200 ${q.correct_answer === opt && opt !== '' ? 'font-bold text-green-700' : ''}`}
                      value={opt}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              
              {q.correct_answer && (
                <div className="mt-4 text-xs font-bold text-green-600 flex items-center gap-1 bg-green-50 w-fit px-2 py-1 rounded">
                   <CheckCircle2 size={12} /> Correct Answer Selected
                </div>
              )}
            </div>
          ))}

          {/* Action Bar */}
          <div className="flex items-center justify-between pb-10">
            <button
              onClick={addQuestion}
              className="flex items-center gap-2 bg-white px-6 py-3 rounded-xl font-bold text-blue-600 shadow-sm border border-blue-100 hover:bg-blue-50 transition-all"
            >
              <PlusCircle size={20} /> Add Question
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading || !title}
              className={`flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                loading ? 'bg-gray-400 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 shadow-blue-200'
              }`}
            >
              <Save size={20} /> {loading ? 'Saving...' : 'Publish Quiz'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
