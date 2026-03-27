'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, Key, FileBarChart, LogOut, TrendingUp, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Create Quiz', icon: PlusCircle, href: '/dashboard/create-quiz' },
    { name: 'Join Quiz', icon: Key, href: '/dashboard/join-quiz' },
    { name: 'Analytics', icon:TrendingUp, href: '/dashboard/analytics' },
    { name: 'Reports', icon: FileBarChart, href: '/dashboard/reports' },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-sm border border-gray-200 print:hidden text-gray-700"
      >
        <Menu size={24} />
      </button>

      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 print:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 print:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex justify-between items-center">
          <h1 className="text-2xl font-black text-blue-600 tracking-tight">QuizApp</h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
    </>
  );
}
