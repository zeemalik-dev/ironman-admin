'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminLayoutShell } from '../../components/AdminLayoutShell';
import { GymInspectorDrawer } from '../../components/GymInspectorDrawer';
import {
  useGetAllGymsQuery,
  useUpdateGymMutation,
  useGetPlatformStatsQuery,
} from '../../redux/baseApi';
import {
  CreditCard,
  Check,
  Sparkles,
  Calendar,
  AlertTriangle,
  Building2,
  ExternalLink,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function SubscriptionsPage() {
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
  const { data: statsData } = useGetPlatformStatsQuery({});
  const { data: gymsData, isLoading, refetch } = useGetAllGymsQuery({}, { pollingInterval: 12000 });
  const [updateGym] = useUpdateGymMutation();

  const gyms = gymsData?.gyms || [];

  const handleQuickExtend = async (gymId: string, currentExpiry: any, days: number) => {
    const baseDate = currentExpiry ? new Date(currentExpiry) : new Date();
    const newDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
    try {
      await updateGym({
        id: gymId,
        validUntil: newDate,
        subscriptionStatus: 'active',
      }).unwrap();
      toast.success(`License extended by ${days} days!`);
      refetch();
    } catch {
      toast.error('Failed to extend subscription');
    }
  };

  const now = new Date().getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const expiringGyms = gyms.filter((g: any) => {
    if (!g.validUntil) return true;
    const expiryMs = new Date(g.validUntil).getTime();
    return expiryMs - now <= thirtyDaysMs;
  });

  const plans = [
    {
      id: 'starter',
      name: 'Starter Plan',
      price: 2999,
      currency: 'PKR',
      popular: false,
      count: gyms.filter((g: any) => g.subscriptionPlan === 'starter').length,
      features: [
        'Single Reception Desk',
        'Up to 250 Active Members',
        'Instant Search Admission',
        'Basic Payment Receipts',
        'Daily Cash Drawer Closing',
      ],
    },
    {
      id: 'pro',
      name: 'Professional Pro',
      price: 4999,
      currency: 'PKR',
      popular: true,
      count: gyms.filter((g: any) => g.subscriptionPlan === 'pro').length,
      features: [
        'Unlimited Reception Desks',
        'Up to 1,000 Active Members',
        'Personal Trainer Assignments',
        'Equipment Maintenance Logs',
        'Financial Analytics & Cashflow',
        'Automated WhatsApp Reminders',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise Multi-Floor',
      price: 9999,
      currency: 'PKR',
      popular: false,
      count: gyms.filter((g: any) => g.subscriptionPlan === 'enterprise').length,
      features: [
        'Unlimited Members & Desks',
        'Multi-Branch Consolidated BI',
        'Custom Domain & Brand Logo',
        'Priority 24/7 Dedicated Support',
        'Cloudinary HD Asset Storage',
      ],
    },
  ];

  return (
    <AdminLayoutShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-900">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            SaaS Pricing & Subscription Master
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Subscription tiers, live fleet renewals, and license expiration management.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-xs font-bold text-zinc-300 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Licenses
        </button>
      </div>

      {/* Plan Master Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`bg-[#121215] border rounded-2xl p-6 relative flex flex-col justify-between shadow-xl ${
              p.popular ? 'border-red-500/60 shadow-red-600/10' : 'border-zinc-800/80'
            }`}
          >
            {p.popular && (
              <span className="absolute -top-3 right-6 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg shadow-red-600/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Most Popular
              </span>
            )}

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-300">
                  {p.count} Active Gyms
                </span>
              </div>
              <p className="text-3xl font-black text-white mt-3 font-mono">
                {formatCurrency(p.price, p.currency)}
                <span className="text-xs text-zinc-500 font-normal"> / month</span>
              </p>

              <div className="mt-6 pt-4 border-t border-zinc-800 space-y-3">
                {p.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-zinc-300">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-850">
              <span className="block text-center text-xs font-bold text-zinc-400">
                Tier Code: <code className="text-zinc-200 font-mono">{p.id}</code>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Expirations & Renewal Alert Queue */}
      <div className="mt-8 bg-[#121215] border border-zinc-800/80 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-white">License Expiration Watchlist</h3>
            <span className="text-xs text-zinc-500 font-mono">
              ({expiringGyms.length} Gyms Expiring Soon / Overdue)
            </span>
          </div>
        </div>

        {expiringGyms.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            All client gyms have active licenses valid for more than 30 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase font-bold text-[10px] tracking-wider bg-zinc-950/40">
                  <th className="py-3 px-4">Gym Account</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Current Expiry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Renewal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {expiringGyms.map((g: any) => {
                  const isExpired = g.validUntil && new Date(g.validUntil).getTime() < now;
                  return (
                    <tr key={g._id} className="hover:bg-zinc-900/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-zinc-100">
                        <button
                          type="button"
                          onClick={() => setSelectedGymId(g._id)}
                          className="hover:text-red-400 transition text-left cursor-pointer"
                        >
                          {g.name} <span className="font-mono text-zinc-500 font-normal">({g.branchCode})</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 uppercase font-bold text-[10px]">
                        <span className="bg-red-950/40 text-red-400 border border-red-800/40 px-2 py-0.5 rounded-full">
                          {g.subscriptionPlan}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={isExpired ? 'text-rose-400' : 'text-amber-400'}>
                          {formatDate(g.validUntil)}
                          {isExpired && ' (Expired)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            g.subscriptionStatus === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {g.subscriptionStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedGymId(g._id)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-750 transition"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleQuickExtend(g._id, g.validUntil, 30)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
                        >
                          + 30 Days
                        </button>
                        <button
                          onClick={() => handleQuickExtend(g._id, g.validUntil, 365)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold border border-emerald-500/40 transition"
                        >
                          + 1 Year
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Inspector Drawer */}
      <GymInspectorDrawer
        gymId={selectedGymId}
        onClose={() => setSelectedGymId(null)}
        onGymUpdated={refetch}
        onGymDeleted={refetch}
      />
    </AdminLayoutShell>
  );
}
