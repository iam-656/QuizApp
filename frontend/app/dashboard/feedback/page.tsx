'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import { MessageSquare, Star, Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Feedback {
  id: string;
  category: string;
  rating: number;
  message: string;
  created_at: string;
}

const CATEGORIES = ['Bug Report', 'Feature Request', 'General Feedback', 'Other'];

export default function FeedbackPage() {
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchFeedbacks();
    } else if (!authLoading && !isAuthenticated) {
      // Allow middleware to handle redirect
    }
  }, [isAuthenticated, authLoading, token]);

  const fetchFeedbacks = async () => {
    try {
      const res = await axios.get(`${API_URL}/feedbacks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(res.data);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return alert('Please select a rating (1-5 stars)');
    if (!message.trim()) return alert('Please provide your feedback message');

    setIsSubmitting(true);
    setSuccessMsg('');
    try {
      const res = await axios.post(
        `${API_URL}/feedbacks`,
        { category, rating, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Add new feedback to the top of the list
      setFeedbacks([res.data.feedback, ...feedbacks]);
      
      // Reset form
      setRating(0);
      setHoveredRating(0);
      setMessage('');
      setCategory(CATEGORIES[0]);
      setSuccessMsg('Thank you! Your feedback has been successfully submitted.');
      
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      alert('Failed to submit feedback. ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (loading && isAuthenticated)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 w-full max-w-[1600px] mx-auto">
        
        <header className="mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200 text-white">
              <MessageSquare size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Feedback Hub</h1>
              <p className="text-gray-500 font-medium mt-1">Help us improve the QuizTrust experience!</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Form Column */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-6">Submit Feedback</h2>
            
            {successMsg && (
              <div className="mb-6 bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-200 flex items-center gap-3 animate-fade-in text-sm font-bold">
                <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 relative">
              
              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-200 outline-none font-semibold cursor-pointer appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Overall Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className={`p-1 transition-all ${hoveredRating >= star || rating >= star ? 'text-yellow-400 scale-110' : 'text-gray-200 hover:text-yellow-200'} focus:outline-none`}
                    >
                      <Star size={36} fill={hoveredRating >= star || rating >= star ? "currentColor" : "none"} strokeWidth={1.5} />
                    </button>
                  ))}
                  <span className="ml-3 text-sm font-bold text-gray-400">
                    {rating === 0 ? 'Select a rating' : `${rating} out of 5`}
                  </span>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Your Thoughts</label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you love or what could be better..."
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-blue-50 outline-none min-h-[160px] resize-y font-medium leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || rating === 0 || !message.trim()}
                className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? (
                  <>Submitting <Loader2 className="animate-spin" size={20} /></>
                ) : (
                  <>Send Feedback <Send size={20} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>
          </div>

          {/* History Column */}
          <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <AlertCircle className="text-blue-600" />
              Previous Submissions
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[800px] custom-scrollbar">
              {feedbacks.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-100 border-dashed rounded-3xl">
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="text-gray-400" size={24} />
                  </div>
                  <p className="text-gray-500 font-medium">No feedback submitted yet.</p>
                  <p className="text-xs text-gray-400 mt-1">We value your input!</p>
                </div>
              ) : (
                feedbacks.map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                          {item.category}
                        </span>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={14} 
                              fill={item.rating >= star ? "#FBBF24" : "none"} 
                              color={item.rating >= star ? "#FBBF24" : "#E5E7EB"} 
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-400 whitespace-nowrap ml-4">
                        {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {item.message}
                    </p>
                  </div>
                ))
              )}
            </div>
            {/* Embedded internal CSS for neat scrollbar in WebKit */}
            <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background-color: #cbd5e1;
                border-radius: 20px;
              }
            `}</style>
          </div>

        </div>
      </main>
    </div>
  );
}
