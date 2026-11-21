'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGetAdminMeQuery, useGetAllGymsQuery } from '../redux/baseApi';
import { AdminSidebar } from './AdminSidebar';
import { GymInspectorDrawer } from './GymInspectorDrawer';
import {
  Menu,
  ShieldAlert,
  Search,
  Building2,
  X,
  ChevronRight,
  Activity,
  Command,
  Plus,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [globalDrawerGymId, setGlobalDrawerGymId] = useState<string | null>(null);

  const commandInputRef = useRef<HTMLInputElement>(null);

  const { data: meData, isLoading, isError } = useGetAdminMeQuery({});
  const { data: searchResults, isFetching: isSearching } = useGetAllGymsQuery(
    { search: commandQuery.trim() },
    { skip: !commandQuery.trim() || !isCommandOpen }
  );

  useEffect(() => {
    if (!isLoading && (isError || meData?.user?.role !== 'superadmin')) {
      router.push('/login');
    }
  }, [meData, isLoading, isError, router]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isCommandOpen) {
      setTimeout(() => commandInputRef.current?.focus(), 50);
    } else {
      setCommandQuery('');
    }
  }, [isCommandOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
            Loading SuperAdmin Console...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#09090b]">
      <AdminSidebar
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header Bar for Desktop & Mobile */}
        <header className="h-14 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
              aria-label="Open SuperAdmin Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Command Search Trigger */}
            <button
              type="button"
              onClick={() => setIsCommandOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition cursor-pointer w-48 sm:w-80 shadow-inner"
            >
              <Search className="w-3.5 h-3.5 text-zinc-500" />
              <span className="truncate">Search any gym, branch, or email...</span>
              <kbd className="hidden sm:inline-block ml-auto px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Cluster Active
            </span>
            <Link
              href="/gyms/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-red-600/30 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Gym</span>
            </Link>
            <span className="px-2.5 py-0.5 rounded-full bg-red-600/15 text-red-400 border border-red-500/30 text-[10px] font-extrabold uppercase tracking-wider">
              Root Console
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-8 max-w-7xl mx-auto w-full min-w-0">
          {children}
        </main>
      </div>

      {/* Global Command Palette Modal (Cmd+K) */}
      {isCommandOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="p-3.5 border-b border-zinc-800 flex items-center gap-3 bg-zinc-950/60">
              <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <input
                ref={commandInputRef}
                type="text"
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Type gym name, branch code, or email..."
                className="flex-1 bg-transparent border-none text-zinc-100 text-sm focus:outline-none placeholder-zinc-500"
              />
              <button
                type="button"
                onClick={() => setIsCommandOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-850">
              {isSearching ? (
                <div className="py-8 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  Searching fleet...
                </div>
              ) : !commandQuery.trim() ? (
                <div className="py-6 text-center text-xs text-zinc-500">
                  Type to search client gyms across the platform. Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono">Esc</kbd> to exit.
                </div>
              ) : searchResults?.gyms?.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-400">
                  No gyms matching "{commandQuery}".
                </div>
              ) : (
                searchResults?.gyms?.map((g: any) => (
                  <button
                    key={g._id}
                    type="button"
                    onClick={() => {
                      setGlobalDrawerGymId(g._id);
                      setIsCommandOpen(false);
                    }}
                    className="w-full text-left p-3 hover:bg-zinc-900/80 rounded-xl flex items-center justify-between gap-3 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center font-bold text-red-400 text-xs flex-shrink-0">
                        {g.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-zinc-100 group-hover:text-red-400 transition truncate">
                          {g.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {g.branchCode} • {g.email || g.phone || 'No contact'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        {formatCurrency(g.mrrAmount, g.currency)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Quick Inspector Drawer */}
      <GymInspectorDrawer
        gymId={globalDrawerGymId}
        onClose={() => setGlobalDrawerGymId(null)}
      />
    </div>
  );
}
