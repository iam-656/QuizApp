'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { 
  ShieldAlert, 
  ShieldCheck, 
  ShieldQuestion, 
  User, 
  BookOpen, 
  Clock, 
  ExternalLink, 
  AlertTriangle,
  MousePointer2,
  ScanEye,
  UserX,
  ChevronLeft
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';

interface ReportData {
  report: {
    attempt_id: string;
    student: { name: string; email: string };
    quiz: { id: string; title: string };
    performance: { score: number; started_at: string; submitted_at: string };
    security_metrics: {
      tab_switches: number;
      face_not_detected_percentage: string;
      looking_away_percentage: string;
      total_proctoring_samples: number;
    };
    proctoring_analysis: {
      cheating_indicators: string[];
      overall_risk_level: 'Low' | 'Medium' | 'High';
    };
  };
}

export default function DetailedReportPage() {
  const { attemptId } = useParams();
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (isAuthenticated && attemptId) {
      fetchReport();
    }
  }, [isAuthenticated, authLoading, attemptId]);

  const fetchReport = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await axios.get(`${API_URL}/reports/${attemptId}/report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) return <div className="p-20 text-center">Report not found or access denied.</div>;

  const { report } = data;
  const riskColor = 
    report.proctoring_analysis.overall_risk_level === 'High' ? 'text-red-600 bg-red-50 border-red-100' :
    report.proctoring_analysis.overall_risk_level === 'Medium' ? 'text-orange-600 bg-orange-50 border-orange-100' :
    'text-green-600 bg-green-50 border-green-100';

  const riskIcon = 
    report.proctoring_analysis.overall_risk_level === 'High' ? <ShieldAlert size={24} /> :
    report.proctoring_analysis.overall_risk_level === 'Medium' ? <ShieldQuestion size={24} /> :
    <ShieldCheck size={24} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex print:bg-white">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 w-full print:ml-0 print:p-0">
        <div className="max-w-5xl mx-auto">
          {/* Top Navigation */}
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-semibold mb-8 transition-colors print:hidden"
          >
            <ChevronLeft size={20} /> Back to Reports
          </button>

          {/* Header Section */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="bg-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <span className="text-3xl font-black">{Math.round(report.performance.score)}%</span>
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900">{report.quiz.title}</h1>
                <div className="flex items-center gap-4 mt-2 text-gray-500">
                  <div className="flex items-center gap-1.5"><User size={16} /> {report.student.name}</div>
                  <div className="flex items-center gap-1.5"><Clock size={16} /> {new Date(report.performance.submitted_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 font-bold ${riskColor}`}>
              {riskIcon}
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest leading-none mb-1 opacity-70">Integrity Risk</span>
                <span className="text-xl leading-none">{report.proctoring_analysis.overall_risk_level}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Metrics Cards */}
            <div className="lg:col-span-2 space-y-8">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ScanEye className="text-blue-600" size={24} /> Security Metrics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <MousePointer2 className="text-purple-500 mb-4" size={28} />
                  <div className="text-3xl font-black text-gray-900">{report.security_metrics.tab_switches}</div>
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-1">Tab Switches</div>
                  <p className="text-xs text-gray-400 mt-2 italic">Lost window focus</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <UserX className="text-red-500 mb-4" size={28} />
                  <div className="text-3xl font-black text-gray-900">{report.security_metrics.face_not_detected_percentage}</div>
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-1">Face Not Found</div>
                  <p className="text-xs text-gray-400 mt-2 italic">Percentage of total time</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <AlertTriangle className="text-orange-500 mb-4" size={28} />
                  <div className="text-3xl font-black text-gray-900">{report.security_metrics.looking_away_percentage}</div>
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-1">Looking Away</div>
                  <p className="text-xs text-gray-400 mt-2 italic">Suspicious head movement</p>
                </div>
              </div>

              {/* Cheating Indicators List */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  Heuristic Analysis
                </h3>
                {report.proctoring_analysis.cheating_indicators.length > 0 ? (
                  <div className="space-y-4">
                    {report.proctoring_analysis.cheating_indicators.map((indicator, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100 text-orange-800">
                        <AlertTriangle className="mt-0.5 shrink-0" size={18} />
                        <span className="font-medium">{indicator}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100 text-green-800">
                    <ShieldCheck className="shrink-0" size={18} />
                    <span className="font-medium">No suspicious activity detected by AI heuristics.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Quiz Summary */}
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="text-blue-600" size={24} /> Attempt Summary
              </h2>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Student Info</div>
                  <div className="font-bold text-gray-900">{report.student.name}</div>
                  <div className="text-sm text-gray-500">{report.student.email}</div>
                </div>

                <div className="p-6 border-b border-gray-50">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Timing</div>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-500">Started</span>
                    <span className="font-bold text-gray-900">{new Date(report.performance.started_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Submitted</span>
                    <span className="font-bold text-gray-900">{new Date(report.performance.submitted_at).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="p-6 bg-gray-50/50">
                   <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Raw Performance</div>
                   <div className="flex items-end gap-2">
                      <div className="text-4xl font-black text-blue-600">{Math.round(report.performance.score)}%</div>
                      <div className="text-sm text-gray-400 font-bold mb-1">Overall Accuracy</div>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => window.print()}
                className="w-full py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 print:hidden"
              >
                 <ExternalLink size={18} /> Download PDF Report
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
