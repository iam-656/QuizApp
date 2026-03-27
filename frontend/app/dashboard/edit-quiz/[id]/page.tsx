'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import { Plus, Trash2, Edit2, Save, X, ArrowLeft, Loader2, ListOrdered, Clock, FileText } from 'lucide-react';

interface Question {
  id?: string;
  question_text: string;
  options: string[];
  correct_answer: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  quiz_code: string;
  duration: number;
  expires_at?: string;
  questions: Question[];
}

export default function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const quizId = unwrappedParams.id;
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  // Quiz Details Edit State
  const [isEditingDocs, setIsEditingDocs] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDuration, setEditDuration] = useState(0);
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [isSavingDocs, setIsSavingDocs] = useState(false);
  const [minDateTime, setMinDateTime] = useState('');

  useEffect(() => {
    const updateMinTime = () => {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setMinDateTime(now.toISOString().slice(0, 16));
    };
    updateMinTime();
    const interval = setInterval(updateMinTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // New Question State
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edit Existing Question State
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQText, setEditQText] = useState('');
  const [editQOptions, setEditQOptions] = useState<string[]>(['', '', '', '']);
  const [editQCorrectIdx, setEditQCorrectIdx] = useState<number | null>(null);
  const [isSavingEditQ, setIsSavingEditQ] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (isAuthenticated && quizId) {
      fetchQuizDetails();
    }
  }, [isAuthenticated, authLoading, quizId]);

  const fetchQuizDetails = async () => {
    try {
      const res = await axios.get(`${API_URL}/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuiz(res.data);
    } catch (err: any) {
      console.error('Failed to fetch quiz details:', err);
      alert('Failed to load quiz. It might have been deleted.');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // --- Quiz Details Handlers ---
  const startEditingDocs = () => {
    if (quiz) {
      setEditTitle(quiz.title);
      setEditDescription(quiz.description);
      setEditDuration(quiz.duration);
      setEditExpiresAt(quiz.expires_at ? new Date(quiz.expires_at).toISOString().slice(0, 16) : '');
      setIsEditingDocs(true);
    }
  };

  const handleSaveDocs = async () => {
    if (!editTitle.trim() || editDuration <= 0) return alert('Valid title and duration required');

    if (editExpiresAt) {
      const selectedTime = new Date(editExpiresAt).getTime();
      const currentTime = new Date().getTime();
      if (selectedTime <= currentTime) {
        return alert('Expiry date and time must be in the future.');
      }
    }

    setIsSavingDocs(true);
    try {
       await axios.put(`${API_URL}/quizzes/${quizId}`, {
           title: editTitle,
           description: editDescription,
           duration: editDuration,
           expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : null
       }, { headers: { Authorization: `Bearer ${token}` } });
       setQuiz(prev => prev ? { ...prev, title: editTitle, description: editDescription, duration: editDuration, expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : undefined } : null);
       setIsEditingDocs(false);
    } catch (e) {
       alert('Failed to update quiz settings');
    } finally {
       setIsSavingDocs(false);
    }
  };

  // --- Deletion Handlers ---
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await axios.delete(`${API_URL}/quizzes/${quizId}/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (quiz) {
        setQuiz({
          ...quiz,
          questions: quiz.questions.filter(q => q.id !== questionId)
        });
      }
    } catch (err) {
      console.error('Error deleting question:', err);
      alert('Failed to delete question. Make sure you are the creator of this quiz.');
    }
  };

  // --- Add Question Handlers ---
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSaveNewQuestion = async () => {
    if (!questionText.trim()) return alert('Question text cannot be empty');
    if (options.some(opt => !opt.trim())) return alert('All options must be filled');
    if (correctAnswerIndex === null) return alert('Please select the correct answer');

    setIsSaving(true);
    try {
      const newQuestion = {
        question_text: questionText,
        options: options,
        correct_answer: options[correctAnswerIndex]
      };

      const res = await axios.post(
        `${API_URL}/quizzes/${quizId}/questions`,
        { questions: [newQuestion] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (quiz && res.data.questions) {
        setQuiz({
          ...quiz,
          questions: [...quiz.questions, ...res.data.questions]
        });
      }

      setQuestionText('');
      setOptions(['', '', '', '']);
      setCorrectAnswerIndex(null);
      setIsAddingMode(false);
    } catch (err) {
      console.error('Error adding question:', err);
      alert('Failed to add question');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Edit Existing Question Handlers ---
  const startEditingQuestion = (q: Question) => {
    setEditingQuestionId(q.id as string);
    setEditQText(q.question_text);
    setEditQOptions([...q.options]);
    const correctIdx = q.options.findIndex(opt => {
       const correctAns = Array.isArray(q.correct_answer) ? q.correct_answer[0] : q.correct_answer;
       return opt === correctAns;
    });
    setEditQCorrectIdx(correctIdx >= 0 ? correctIdx : 0);
  };

  const handleEditOptionChange = (index: number, value: string) => {
    const newOptions = [...editQOptions];
    newOptions[index] = value;
    setEditQOptions(newOptions);
  };

  const handleSaveEditQuestion = async (qId: string) => {
    if (!editQText.trim()) return alert('Question text cannot be empty');
    if (editQOptions.some(opt => !opt.trim())) return alert('All options must be filled');
    if (editQCorrectIdx === null) return alert('Please select the correct answer');

    setIsSavingEditQ(true);
    try {
      const res = await axios.put(
        `${API_URL}/quizzes/${quizId}/questions/${qId}`,
        {
          question_text: editQText,
          options: editQOptions,
          correct_answer: editQOptions[editQCorrectIdx]
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setQuiz(prev => {
        if (!prev) return null;
        return {
          ...prev,
          questions: prev.questions.map(q => q.id === qId ? res.data.question : q)
        };
      });
      setEditingQuestionId(null);
    } catch(e) {
      alert('Failed to update question');
    } finally {
      setIsSavingEditQ(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 w-full">
        <div className="max-w-4xl mx-auto pb-20">
          
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-sm font-bold text-gray-500 hover:text-blue-600 mb-6 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Dashboard
          </button>

          <header className="mb-8 border-b border-gray-200 pb-6 relative group">
            {!isEditingDocs ? (
              <>
                <button 
                  onClick={startEditingDocs}
                  className="absolute top-0 right-0 p-2 text-gray-400 hover:bg-white hover:text-blue-600 rounded-lg transition-all opacity-0 group-hover:opacity-100 border border-transparent shadow-sm hover:border-gray-100"
                  title="Edit Quiz Details"
                >
                  <Edit2 size={18} />
                </button>

                <h1 className="text-3xl font-black text-gray-900 mb-2">Editing: {quiz.title}</h1>
                <p className="text-gray-500 text-sm whitespace-pre-wrap">{quiz.description}</p>
                <div className="flex items-center gap-4 mt-4">
                   <span className="bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                     <ListOrdered size={16} />
                     {quiz.questions.length} Questions
                   </span>
                   <span className="bg-orange-50 text-orange-600 font-bold px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                     <Clock size={16} />
                     {quiz.duration} Minutes
                   </span>
                   {quiz.expires_at && (
                     <span className="bg-red-50 text-red-600 font-bold px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                       <Clock size={16} />
                       Due: {new Date(quiz.expires_at).toLocaleString()}
                     </span>
                   )}
                </div>
              </>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-lg shadow-blue-50">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="text-blue-600" />
                  Edit Quiz Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Quiz Title</label>
                    <input 
                      type="text" 
                      value={editTitle} 
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-200 outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea 
                      value={editDescription} 
                      onChange={e => setEditDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-200 outline-none h-24 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Duration (minutes)</label>
                    <input 
                      type="number" 
                      value={editDuration} 
                      onChange={e => setEditDuration(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-200 outline-none font-semibold max-w-xs"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Expiry Date / Deadline (Optional)</label>
                    <input 
                      type="datetime-local" 
                      value={editExpiresAt} 
                      min={minDateTime}
                      onChange={e => setEditExpiresAt(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-200 outline-none font-semibold max-w-xs cursor-pointer"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={handleSaveDocs}
                    disabled={isSavingDocs}
                    className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 disabled:opacity-50"
                  >
                    {isSavingDocs ? 'Saving...' : 'Save Settings'}
                  </button>
                  <button 
                    onClick={() => setIsEditingDocs(false)}
                    className="bg-gray-100 text-gray-600 font-bold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </header>

          <div className="space-y-6">
            {quiz.questions.map((q, index) => {
              const isEditing = editingQuestionId === q.id;

              if (isEditing) {
                return (
                  <div key={q.id || index} className="bg-orange-50/50 p-6 sm:p-8 rounded-3xl border-2 border-orange-200 relative shadow-sm">
                     <button 
                       onClick={() => setEditingQuestionId(null)}
                       className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-white hover:text-gray-600 rounded-lg transition-all"
                     >
                       <X size={20} />
                     </button>
                     
                     <h3 className="text-xl font-black text-orange-900 mb-6 flex items-center gap-2">
                       <Edit2 className="text-orange-600" />
                       Edit Question {index + 1}
                     </h3>

                     <div className="mb-6">
                       <label className="block text-sm font-bold text-orange-900 mb-2">Question Text</label>
                       <textarea
                         value={editQText}
                         onChange={(e) => setEditQText(e.target.value)}
                         className="w-full px-5 py-4 bg-white border-none rounded-2xl text-gray-900 focus:ring-4 focus:ring-orange-100 outline-none shadow-sm min-h-[100px] font-medium"
                       />
                     </div>

                     <div className="mb-8">
                       <label className="block text-sm font-bold text-orange-900 mb-3 text-center">
                         Click the circle next to the correct answer
                       </label>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {editQOptions.map((opt, idx) => (
                           <div 
                             key={idx} 
                             className={`relative flex items-center bg-white rounded-2xl p-2 pr-4 border-2 transition-all ${
                               editQCorrectIdx === idx ? 'border-green-500 shadow-md shadow-green-100' : 'border-transparent shadow-sm'
                             }`}
                           >
                             <button
                               onClick={() => setEditQCorrectIdx(idx)}
                               className={`ml-2 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                 editQCorrectIdx === idx ? 'bg-green-500 border-green-500' : 'bg-gray-100 hover:bg-green-100 border-2 border-gray-200'
                               }`}
                             >
                               {editQCorrectIdx === idx && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                             </button>
                             <div className="mx-3 text-xs font-black text-gray-300">
                               {String.fromCharCode(65 + idx)}
                             </div>
                             <input
                               type="text"
                               value={opt}
                               onChange={(e) => handleEditOptionChange(idx, e.target.value)}
                               className="flex-1 bg-transparent border-none outline-none font-semibold text-gray-800 py-2 min-w-0"
                             />
                           </div>
                         ))}
                       </div>
                     </div>

                     <button
                       onClick={() => handleSaveEditQuestion(q.id as string)}
                       disabled={isSavingEditQ}
                       className="w-full bg-orange-500 text-white font-black py-4 rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                     >
                       {isSavingEditQ ? (
                         <>Saving... <Loader2 className="animate-spin" size={20} /></>
                       ) : (
                         <>Save Changes <Save size={20} /></>
                       )}
                     </button>
                  </div>
                );
              }

              return (
                <div key={q.id || index} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 transition-all hover:border-blue-100 group">
                  <div className="bg-blue-600 text-white w-10 h-10 flex-shrink-0 rounded-2xl flex items-center justify-center font-black shadow-lg shadow-blue-200">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{q.question_text}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt, i) => {
                         const correctAns = Array.isArray(q.correct_answer) ? q.correct_answer[0] : q.correct_answer;
                         const isCorrect = opt === correctAns;
                           
                         return (
                          <div 
                            key={i} 
                            className={`p-3 rounded-xl border-2 text-sm font-semibold ${
                              isCorrect
                                ? 'border-green-500 bg-green-50 text-green-700' 
                                : 'border-gray-100 bg-gray-50 text-gray-600'
                            }`}
                          >
                            <span className="text-xs uppercase tracking-widest text-gray-400 mr-2 font-black">
                              {String.fromCharCode(65 + i)}
                            </span>
                            {opt}
                          </div>
                         )
                      })}
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2 mt-4 sm:mt-0 justify-end sm:justify-start">
                    {q.id && (
                      <button 
                        onClick={() => startEditingQuestion(q)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                        title="Edit Question"
                      >
                        <Edit2 size={20} />
                      </button>
                    )}
                    {q.id && (
                      <button 
                        onClick={() => handleDeleteQuestion(q.id as string)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete Question"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!isAddingMode ? (
            <button
              onClick={() => setIsAddingMode(true)}
              className="w-full mt-6 p-6 rounded-3xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-500 hover:text-blue-600 font-bold flex flex-col items-center justify-center transition-all group"
            >
               <div className="bg-gray-100 group-hover:bg-blue-100 p-3 rounded-2xl mb-2 transition-all">
                  <Plus size={24} />
               </div>
               Add Another Question
            </button>
          ) : (
            <div className="mt-8 bg-blue-50/50 p-6 sm:p-8 rounded-3xl border-2 border-blue-100 relative shadow-sm">
               <button 
                 onClick={() => setIsAddingMode(false)}
                 className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-white hover:text-gray-600 rounded-lg transition-all"
               >
                 <X size={20} />
               </button>
               
               <h3 className="text-xl font-black text-blue-900 mb-6 flex items-center gap-2">
                 <Plus className="text-blue-600" />
                 New Question
               </h3>

               <div className="mb-6">
                 <label className="block text-sm font-bold text-blue-900 mb-2">Question Text</label>
                 <textarea
                   value={questionText}
                   onChange={(e) => setQuestionText(e.target.value)}
                   className="w-full px-5 py-4 bg-white border-none rounded-2xl text-gray-900 focus:ring-4 focus:ring-blue-100 outline-none shadow-sm min-h-[100px] resize-y font-medium"
                   placeholder="Enter your question here..."
                 />
               </div>

               <div className="mb-8">
                 <label className="block text-sm font-bold text-blue-900 mb-3 text-center">
                   Click the circle next to the correct answer
                 </label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {options.map((opt, idx) => (
                     <div 
                       key={idx} 
                       className={`relative flex items-center bg-white rounded-2xl p-2 pr-4 border-2 transition-all ${
                         correctAnswerIndex === idx ? 'border-green-500 shadow-md shadow-green-100' : 'border-transparent shadow-sm'
                       }`}
                     >
                       <button
                         onClick={() => setCorrectAnswerIndex(idx)}
                         className={`ml-2 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                           correctAnswerIndex === idx ? 'bg-green-500 border-green-500' : 'bg-gray-100 hover:bg-green-100 border-2 border-gray-200'
                         }`}
                       >
                         {correctAnswerIndex === idx && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                       </button>
                       <div className="mx-3 text-xs font-black text-gray-300">
                         {String.fromCharCode(65 + idx)}
                       </div>
                       <input
                         type="text"
                         value={opt}
                         onChange={(e) => handleOptionChange(idx, e.target.value)}
                         className="flex-1 bg-transparent border-none outline-none font-semibold text-gray-800 focus:ring-0 py-2 min-w-0"
                         placeholder={`Option ${idx + 1}`}
                       />
                     </div>
                   ))}
                 </div>
               </div>

               <button
                 onClick={handleSaveNewQuestion}
                 disabled={isSaving}
                 className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                 {isSaving ? (
                   <>Saving... <Loader2 className="animate-spin" size={20} /></>
                 ) : (
                   <>Save Question <Save size={20} /></>
                 )}
               </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
