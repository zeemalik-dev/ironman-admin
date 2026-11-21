'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminLayoutShell } from '../../components/AdminLayoutShell';
import { GymInspectorDrawer } from '../../components/GymInspectorDrawer';
import {
  useGetAllGymsQuery,
  useDeleteGymMutation,
  useLazyLookupUserQuery,
  useDeleteUserByEmailMutation,
} from '../../redux/baseApi';
import {
  Building2,
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  ExternalLink,
  ShieldAlert,
  UserX,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Filter,
  Activity,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function GymsManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [selectedInspectorGymId, setSelectedInspectorGymId] = useState<string | null>(null);

  // Orphan account lookup tool state
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupEmail, setLookupEmail] = useState('');
  const [triggerLookup, { data: lookupResult, isFetching: isLookingUp }] = useLazyLookupUserQuery();
  const [deleteUserByEmail, { isLoading: isDeletingUser }] = useDeleteUserByEmailMutation();

  const { data: gymsData, isLoading, isFetching, refetch } = useGetAllGymsQuery(
    {
      search: searchQuery || undefined,
      status: statusFilter || undefined,
      plan: planFilter || undefined,
    },
    { pollingInterval: 10000 }
  );

  const [deleteGym] = useDeleteGymMutation();

  const handleDeleteGym = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete gym "${name}" and deactivate all associated accounts?`)) return;
    try {
      await deleteGym(id).unwrap();
      toast.success(`Gym "${name}" removed`);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete gym');
    }
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail.trim()) return;
    triggerLookup(lookupEmail.trim());
  };

  const handleDeleteOrphanUser = async (email: string) => {
    if (!confirm(`Are you sure you want to remove all accounts matching email "${email}"? This action cannot be undone.`)) return;
    try {
      const res = await deleteUserByEmail(email).unwrap();
      toast.success(res.message || `Deleted account(s) for ${email}`);
      triggerLookup(email);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete user account');
    }
  };

  return (
    <AdminLayoutShell>
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-900">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Gym Fleet & Tenant Directory
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Create, brand, configure, and inspect client gym branches, hardware, and owner accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => {
              setShowLookupModal(true);
              setLookupEmail('');
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            title="Search and clean up orphaned user emails"
          >
            <UserX className="w-4 h-4 text-amber-400" /> Account Cleanup
          </button>
          <Link
            href="/gyms/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Gym
          </Link>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="mt-6 bg-[#121215] border border-zinc-800/80 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold text-white">Registered Gym Accounts</h3>
            <span className="text-xs text-zinc-500 font-mono">({gymsData?.gyms?.length || 0} Total)</span>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh gym list"
              className="ml-1 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, branch code, email..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-red-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="past_due">Past Due</option>
              <option value="suspended">Suspended</option>
            </select>

            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-red-500"
            >
              <option value="">All Plans</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-zinc-400 text-xs flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="font-semibold text-zinc-400">Loading gym directory...</p>
          </div>
        ) : gymsData?.gyms?.length === 0 ? (
          <div className="py-12 text-center">
            <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 font-semibold">No Gyms Found</p>
            <p className="text-xs text-zinc-600 mt-1">Click "Add New Gym" to register the first account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase font-bold text-[10px] tracking-wider bg-zinc-950/40">
                  <th className="py-3 px-4">Gym & Branding</th>
                  <th className="py-3 px-4">Branch Code</th>
                  <th className="py-3 px-4">Hardware IP</th>
                  <th className="py-3 px-4">SaaS Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">MRR</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {gymsData?.gyms?.map((gym: any) => (
                  <tr key={gym._id} className="hover:bg-zinc-900/60 transition group">
                    <td className="py-3.5 px-4 font-semibold text-zinc-100">
                      <button
                        type="button"
                        onClick={() => setSelectedInspectorGymId(gym._id)}
                        className="flex items-center gap-3 text-left w-full cursor-pointer focus:outline-none"
                      >
                        <div className="w-9 h-9 rounded-lg bg-zinc-950 border border-zinc-750 flex items-center justify-center overflow-hidden flex-shrink-0 font-bold text-red-400 group-hover:scale-105 transition">
                          {gym.logoUrl ? (
                            <img src={gym.logoUrl} alt={gym.name} className="w-full h-full object-cover" />
                          ) : (
                            gym.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-100 text-sm group-hover:text-red-400 transition flex items-center gap-1">
                            {gym.name} <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-red-400" />
                          </p>
                          <p className="text-[10px] text-zinc-500">{gym.email || gym.phone || 'No contact set'}</p>
                        </div>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-300">
                      <span className="bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                        {gym.branchCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                      {gym.deviceIp || gym.settings?.deviceIp ? (
                        <span className="text-emerald-400">
                          {gym.deviceIp || gym.settings?.deviceIp}:{gym.devicePort || 4370}
                        </span>
                      ) : (
                        <span className="text-zinc-600">Not configured</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 uppercase font-bold text-[10px]">
                      <span className="bg-red-950/40 text-red-400 border border-red-800/40 px-2 py-0.5 rounded-full">
                        {gym.subscriptionPlan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          gym.subscriptionStatus === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {gym.subscriptionStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {formatCurrency(gym.mrrAmount, gym.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                      {formatDate(gym.validUntil)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedInspectorGymId(gym._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 font-semibold text-xs transition cursor-pointer"
                        title="Open Quick Inspector Panel"
                      >
                        <Activity className="w-3.5 h-3.5 text-red-500" /> Inspect
                      </button>
                      <Link
                        href={`/gyms/${gym._id}/edit`}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer inline-block"
                        title="Edit Gym Details & Branding"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteGym(gym._id, gym.name)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                        title="Delete Gym Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Orphan User Lookup & Cleanup */}
      {showLookupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setShowLookupModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Account Lookup & Cleanup</h3>
                <p className="text-xs text-zinc-400">Search for user accounts or clean up stuck owner emails.</p>
              </div>
            </div>

            <form onSubmit={handleLookupSubmit} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                placeholder="Enter email to lookup (e.g. owner@gym.com)"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 text-xs focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                disabled={isLookingUp}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {isLookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lookup'}
              </button>
            </form>

            {lookupResult && (
              <div className="mt-5 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                {lookupResult.user ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">{lookupResult.user.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-800 text-zinc-300">
                        {lookupResult.user.role}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">{lookupResult.user.email}</p>
                    <div className="text-xs text-zinc-400">
                      Gym:{' '}
                      {lookupResult.user.gymId ? (
                        <span className="text-emerald-400 font-semibold">
                          {lookupResult.user.gymId.name} ({lookupResult.user.gymId.branchCode})
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold">Orphaned (No active gym assigned)</span>
                      )}
                    </div>
                    <div className="pt-2 border-t border-zinc-800 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeleteOrphanUser(lookupResult.user.email)}
                        disabled={isDeletingUser}
                        className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-xs font-bold text-rose-400 transition"
                      >
                        {isDeletingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" /> : <Trash2 className="w-3.5 h-3.5 inline mr-1" />}
                        Delete This User Account
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-zinc-400">
                    No user found with email "{lookupEmail}". This email is free to register.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide-Over Quick Gym Inspector Drawer */}
      <GymInspectorDrawer
        gymId={selectedInspectorGymId}
        onClose={() => setSelectedInspectorGymId(null)}
        onGymUpdated={refetch}
        onGymDeleted={refetch}
      />
    </AdminLayoutShell>
  );
}
