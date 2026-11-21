'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminLayoutShell } from '../../../components/AdminLayoutShell';
import {
  useGetGymByIdQuery,
  useUpdateGymMutation,
  useDeleteGymMutation,
  useGetGymTelemetryQuery,
  useResetUserPasswordMutation,
  useUpdateUserStatusMutation,
  useCreateStaffUserMutation,
} from '../../../redux/baseApi';
import {
  Building2,
  ChevronLeft,
  KeyRound,
  ShieldCheck,
  Cpu,
  Clock,
  Users,
  DollarSign,
  Activity,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Plus,
  RefreshCw,
  X,
  Loader2,
  UserCheck,
  UserX,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '../../../lib/utils';

export default function GymDetailPage() {
  const params = useParams();
  const gymId = params.id as string;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'telemetry' | 'hardware' | 'staff' | 'subscription'>('telemetry');

  // Modals for staff
  const [showResetModal, setShowResetModal] = useState<any>(null); // user object
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetAccessPinVal, setResetAccessPinVal] = useState('');

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'receptionist',
    phone: '',
  });

  // Hardware form local state
  const [hardwareForm, setHardwareForm] = useState<any>(null);

  // Queries & Mutations
  const { data: gymData, isLoading: isGymLoading, refetch: refetchGym } = useGetGymByIdQuery(gymId, {
    pollingInterval: 12000,
  });
  const { data: telemetryData, isLoading: isTelemetryLoading, refetch: refetchTelemetry } = useGetGymTelemetryQuery(gymId, {
    pollingInterval: 10000,
  });

  const [updateGym, { isLoading: isUpdatingGym }] = useUpdateGymMutation();
  const [deleteGym] = useDeleteGymMutation();
  const [resetUserPassword, { isLoading: isResettingPassword }] = useResetUserPasswordMutation();
  const [updateUserStatus, { isLoading: isUpdatingUserStatus }] = useUpdateUserStatusMutation();
  const [createStaffUser, { isLoading: isCreatingStaff }] = useCreateStaffUserMutation();

  const gym = gymData?.gym;
  const staff = gymData?.staff || [];
  const telemetry = telemetryData?.telemetry;

  // Sync hardware form when gym data loads
  React.useEffect(() => {
    if (gym) {
      setHardwareForm({
        deviceIp: gym.deviceIp || gym.settings?.deviceIp || '192.168.1.201',
        devicePort: gym.devicePort || gym.settings?.devicePort || 4370,
        checkInCutoffHour: gym.settings?.checkInCutoffHour ?? 0,
        checkInCutoffMinute: gym.settings?.checkInCutoffMinute ?? 0,
        openingTime: gym.settings?.openingTime || '06:00',
        closingTime: gym.settings?.closingTime || '23:00',
      });
    }
  }, [gym]);

  const handleSaveHardware = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hardwareForm) return;
    try {
      await updateGym({
        id: gymId,
        deviceIp: hardwareForm.deviceIp,
        devicePort: Number(hardwareForm.devicePort),
        checkInCutoffHour: Number(hardwareForm.checkInCutoffHour),
        checkInCutoffMinute: Number(hardwareForm.checkInCutoffMinute),
        settings: {
          deviceIp: hardwareForm.deviceIp,
          devicePort: Number(hardwareForm.devicePort),
          checkInCutoffHour: Number(hardwareForm.checkInCutoffHour),
          checkInCutoffMinute: Number(hardwareForm.checkInCutoffMinute),
          openingTime: hardwareForm.openingTime,
          closingTime: hardwareForm.closingTime,
        },
      }).unwrap();
      toast.success('Hardware & operational rules updated!');
      refetchGym();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update hardware rules');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetModal) return;
    try {
      const res = await resetUserPassword({
        gymId,
        userId: showResetModal._id,
        newPassword: resetPasswordVal || undefined,
        newAccessPassword: resetAccessPinVal !== '' ? resetAccessPinVal : undefined,
      }).unwrap();
      toast.success(res.message || 'Credentials reset successfully!');
      setShowResetModal(null);
      setResetPasswordVal('');
      setResetAccessPinVal('');
      refetchGym();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to reset credentials');
    }
  };

  const handleToggleUserStatus = async (user: any) => {
    try {
      await updateUserStatus({
        gymId,
        userId: user._id,
        isActive: !user.isActive,
      }).unwrap();
      toast.success(`Account for ${user.name} ${user.isActive ? 'deactivated' : 'activated'}`);
      refetchGym();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to change user status');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createStaffUser({
        gymId,
        ...newStaffData,
      }).unwrap();
      toast.success(`Staff user "${newStaffData.name}" provisioned!`);
      setShowAddStaffModal(false);
      setNewStaffData({ name: '', email: '', password: '', role: 'receptionist', phone: '' });
      refetchGym();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to provision staff');
    }
  };

  const handleExtendSubscription = async (days: number) => {
    if (!gym) return;
    const currentExpiry = gym.validUntil ? new Date(gym.validUntil) : new Date();
    const newDate = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
    try {
      await updateGym({
        id: gymId,
        validUntil: newDate,
        subscriptionStatus: 'active',
      }).unwrap();
      toast.success(`Subscription extended by ${days} days! (Valid until ${formatDate(newDate)})`);
      refetchGym();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to extend subscription');
    }
  };

  const handleDeleteGym = async () => {
    if (!confirm(`Are you SURE you want to permanently delete gym "${gym?.name}" and all staff accounts?`)) return;
    try {
      await deleteGym(gymId).unwrap();
      toast.success(`Gym "${gym?.name}" deleted`);
      router.push('/gyms');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete gym');
    }
  };

  if (isGymLoading) {
    return (
      <AdminLayoutShell>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Loading Gym Account...</p>
        </div>
      </AdminLayoutShell>
    );
  }

  if (!gym) {
    return (
      <AdminLayoutShell>
        <div className="py-16 text-center">
          <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-base font-bold text-white">Gym Not Found</p>
          <Link href="/gyms" className="text-xs text-red-400 hover:underline mt-2 inline-block">
            ← Return to Fleet Directory
          </Link>
        </div>
      </AdminLayoutShell>
    );
  }

  return (
    <AdminLayoutShell>
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
        <Link
          href="/gyms"
          className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" /> Gym Fleet Directory
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchGym();
              refetchTelemetry();
            }}
            title="Refresh gym telemetry"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <Link
            href={`/gyms/${gymId}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-xs font-bold text-zinc-200 transition"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Profile
          </Link>
          <button
            onClick={handleDeleteGym}
            className="p-2 rounded-xl bg-red-950/30 border border-red-800/40 text-red-400 hover:bg-red-900/50 transition"
            title="Delete Gym Account"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Gym Hero Card */}
      <div className="mt-4 bg-[#121215] border border-zinc-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-750 flex items-center justify-center overflow-hidden flex-shrink-0 font-black text-2xl text-red-500 shadow-lg">
              {gym.logoUrl ? (
                <img src={gym.logoUrl} alt={gym.name} className="w-full h-full object-cover" />
              ) : (
                gym.name.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white tracking-tight">{gym.name}</h1>
                <span className="font-mono text-xs font-bold bg-zinc-900 border border-zinc-750 px-2 py-0.5 rounded text-zinc-300">
                  {gym.branchCode}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {gym.address || 'No address set'} • {gym.city || 'Lahore'}, {gym.country || 'Pakistan'} •{' '}
                <span className="text-zinc-300 font-mono">{gym.phone || gym.email || 'No contact'}</span>
              </p>
            </div>
          </div>

          {/* SaaS Status Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Plan Tier</p>
              <p className="text-xs font-black uppercase text-red-400 tracking-wider mt-0.5">{gym.subscriptionPlan}</p>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">MRR</p>
              <p className="text-xs font-black font-mono text-emerald-400 mt-0.5">
                {formatCurrency(gym.mrrAmount, gym.currency)}/mo
              </p>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status</p>
              <span
                className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  gym.subscriptionStatus === 'active'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {gym.subscriptionStatus}
              </span>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">SaaS Valid Until</p>
              <p className="text-xs font-bold text-zinc-200 mt-0.5 font-mono">{formatDate(gym.validUntil)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Members</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{telemetry?.totalMembers ?? '-'}</p>
          <p className="text-[10px] text-emerald-400 mt-1 font-semibold">
            {telemetry?.activeMembers ?? 0} Active • {telemetry?.expiredMembers ?? 0} Expired
          </p>
        </div>

        <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Today Check-Ins</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{telemetry?.checkInsToday ?? '-'}</p>
          <p className="text-[10px] text-zinc-400 mt-1 truncate">
            {telemetry?.lastAttendance ? (
              <>Last: #{telemetry.lastAttendance.softwareId || telemetry.lastAttendance.machineUid} ({formatDate(telemetry.lastAttendance.checkInTime)})</>
            ) : (
              'No check-ins yet today'
            )}
          </p>
        </div>

        <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Cash Closing</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2 capitalize">
            {telemetry?.latestCashClosing?.status || 'No closing'}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1">
            {telemetry?.latestCashClosing ? (
              <>Diff: {formatCurrency(telemetry.latestCashClosing.difference, gym.currency)} on {telemetry.latestCashClosing.dateStr}</>
            ) : (
              'No closing recorded'
            )}
          </p>
        </div>

        <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Pending Dues</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 mt-2 font-mono">
            {formatCurrency(telemetry?.pendingDues ?? 0, gym.currency)}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1">
            {telemetry?.pendingDuesCount ?? 0} members with pending dues
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 mt-8 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'telemetry'
              ? 'border-red-600 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Activity className="w-4 h-4" /> Live Telemetry
        </button>
        <button
          onClick={() => setActiveTab('hardware')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'hardware'
              ? 'border-red-600 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Cpu className="w-4 h-4" /> Hardware & Cutoff Times
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'staff'
              ? 'border-red-600 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-4 h-4" /> Staff & Owners ({staff.length})
        </button>
        <button
          onClick={() => setActiveTab('subscription')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'subscription'
              ? 'border-red-600 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <CreditCard className="w-4 h-4" /> SaaS Subscription & Expiry
        </button>
      </div>

      {/* Tab 1: Live Telemetry & Quick Overview */}
      {activeTab === 'telemetry' && (
        <div className="mt-6 space-y-6">
          <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-red-500" /> Active Biometric Bridge Config
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase text-zinc-500">ZKTeco Device IP</p>
                <p className="text-sm font-mono font-bold text-white mt-1">
                  {gym.deviceIp || gym.settings?.deviceIp || '192.168.1.201'}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">Default port: {gym.devicePort || 4370}</p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase text-zinc-500">Daily Check-In Cutoff</p>
                <p className="text-sm font-mono font-bold text-emerald-400 mt-1">
                  {String(gym.settings?.checkInCutoffHour ?? 0).padStart(2, '0')}:
                  {String(gym.settings?.checkInCutoffMinute ?? 0).padStart(2, '0')}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {(gym.settings?.checkInCutoffHour ?? 0) === 0 ? 'Standard Midnight Cutoff' : 'Late Night / Early AM Cutoff'}
                </p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase text-zinc-500">Facility Operating Hours</p>
                <p className="text-sm font-mono font-bold text-white mt-1">
                  {gym.settings?.openingTime || '06:00'} - {gym.settings?.closingTime || '23:00'}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">Timezone: {gym.timezone || 'Asia/Karachi'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Hardware & Cutoff Times */}
      {activeTab === 'hardware' && hardwareForm && (
        <div className="mt-6 bg-[#121215] border border-zinc-800/80 rounded-2xl p-6 max-w-3xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-red-500" /> Biometric Hardware & Operational Time Rules
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Configure IP, port, and daily check-in day rollover for the physical ZKTeco bridge.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveHardware} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Biometric Device IP Address
                </label>
                <input
                  type="text"
                  value={hardwareForm.deviceIp}
                  onChange={(e) => setHardwareForm({ ...hardwareForm, deviceIp: e.target.value })}
                  placeholder="192.168.1.201"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Biometric Machine Port
                </label>
                <input
                  type="number"
                  value={hardwareForm.devicePort}
                  onChange={(e) => setHardwareForm({ ...hardwareForm, devicePort: e.target.value })}
                  placeholder="4370"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Check-in Cutoff Hour (0 to 23)
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={hardwareForm.checkInCutoffHour}
                  onChange={(e) => setHardwareForm({ ...hardwareForm, checkInCutoffHour: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-sm focus:outline-none focus:border-red-500"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Example: 4 means workouts from 12:00 AM to 3:59 AM count toward yesterday's workout.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Check-in Cutoff Minute (0 to 59)
                </label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={hardwareForm.checkInCutoffMinute}
                  onChange={(e) => setHardwareForm({ ...hardwareForm, checkInCutoffMinute: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Gym Opening Time
                </label>
                <input
                  type="text"
                  value={hardwareForm.openingTime}
                  onChange={(e) => setHardwareForm({ ...hardwareForm, openingTime: e.target.value })}
                  placeholder="06:00"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Gym Closing Time
                </label>
                <input
                  type="text"
                  value={hardwareForm.closingTime}
                  onChange={(e) => setHardwareForm({ ...hardwareForm, closingTime: e.target.value })}
                  placeholder="23:00"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingGym}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition cursor-pointer disabled:opacity-50"
              >
                {isUpdatingGym ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving Rules...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Save Hardware & Operational Rules
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Staff & Owners Directory */}
      {activeTab === 'staff' && (
        <div className="mt-6 bg-[#121215] border border-zinc-800/80 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-red-500" /> Gym Staff & Owner Accounts
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Manage login credentials, role assignments, and emergency access PIN resets for this tenant.
              </p>
            </div>

            <button
              onClick={() => setShowAddStaffModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Add Staff Account
            </button>
          </div>

          {staff.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No staff accounts found for this gym. Click "Add Staff Account" above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase font-bold text-[10px] tracking-wider bg-zinc-950/40">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {staff.map((u: any) => (
                    <tr key={u._id} className="hover:bg-zinc-900/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-zinc-100">
                        <div>
                          <p className="font-bold text-zinc-100 text-sm">{u.name}</p>
                          <p className="text-[11px] text-zinc-400 font-mono">{u.email}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 uppercase font-bold text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            u.role === 'owner'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 font-mono">{u.phone || '-'}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            u.isActive !== false
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {u.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400">{formatDate(u.createdAt)}</td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setShowResetModal(u);
                            setResetPasswordVal('');
                            setResetAccessPinVal('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 transition"
                          title="Reset Login Password & PIN"
                        >
                          <KeyRound className="w-3.5 h-3.5 inline mr-1" /> Reset Credentials
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`p-1.5 rounded-lg border transition ${
                            u.isActive !== false
                              ? 'text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border-zinc-800'
                              : 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30'
                          }`}
                          title={u.isActive !== false ? 'Deactivate User' : 'Activate User'}
                        >
                          {u.isActive !== false ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: SaaS Subscription & Validity */}
      {activeTab === 'subscription' && (
        <div className="mt-6 bg-[#121215] border border-zinc-800/80 rounded-2xl p-6 max-w-3xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-red-500" /> Subscription License & Validity Controls
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Extend license validity, update plan tiers, or suspend/reactivate client tenant status.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Quick Extension Buttons */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Quick Extend License Validity
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleExtendSubscription(30)}
                  disabled={isUpdatingGym}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-xs font-bold text-zinc-200 transition"
                >
                  + 30 Days
                </button>
                <button
                  onClick={() => handleExtendSubscription(90)}
                  disabled={isUpdatingGym}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-xs font-bold text-zinc-200 transition"
                >
                  + 90 Days (Quarterly)
                </button>
                <button
                  onClick={() => handleExtendSubscription(365)}
                  disabled={isUpdatingGym}
                  className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-bold text-emerald-400 transition"
                >
                  + 1 Year (Annual)
                </button>
              </div>
            </div>

            {/* Status & Plan Quick Switch */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Tenant Subscription Status
                </label>
                <select
                  value={gym.subscriptionStatus}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    try {
                      await updateGym({ id: gymId, subscriptionStatus: newStatus }).unwrap();
                      toast.success(`Gym status changed to "${newStatus}"`);
                      refetchGym();
                    } catch (err: any) {
                      toast.error('Failed to change status');
                    }
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="past_due">Past Due</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  SaaS Plan Tier
                </label>
                <select
                  value={gym.subscriptionPlan}
                  onChange={async (e) => {
                    const newPlan = e.target.value;
                    try {
                      await updateGym({ id: gymId, subscriptionPlan: newPlan }).unwrap();
                      toast.success(`Gym plan updated to "${newPlan}"`);
                      refetchGym();
                    } catch (err: any) {
                      toast.error('Failed to change plan');
                    }
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reset Staff Credentials */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setShowResetModal(null)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset User Credentials</h3>
                <p className="text-xs text-zinc-400">{showResetModal.name} ({showResetModal.email})</p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  New Login Password
                </label>
                <input
                  type="text"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Min 6 characters (leave blank to keep current)"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  New Owner Access PIN / Password
                </label>
                <input
                  type="text"
                  value={resetAccessPinVal}
                  onChange={(e) => setResetAccessPinVal(e.target.value)}
                  placeholder="e.g. 1234 (used for cash closing & fee edits)"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-red-500 font-mono"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Protects sensitive gym actions like editing fees, discounts, and closing balances.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowResetModal(null)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword || (!resetPasswordVal && resetAccessPinVal === '')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  {isResettingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Update Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Staff Member */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setShowAddStaffModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-500" /> Add Staff / Owner Account
            </h3>
            <p className="text-xs text-zinc-400 mb-4">Provision a new user account for {gym.name}.</p>

            <form onSubmit={handleAddStaff} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newStaffData.name}
                  onChange={(e) => setNewStaffData({ ...newStaffData, name: e.target.value })}
                  placeholder="e.g. Asad Ali"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Login Email *
                </label>
                <input
                  type="email"
                  required
                  value={newStaffData.email}
                  onChange={(e) => setNewStaffData({ ...newStaffData, email: e.target.value })}
                  placeholder="asad@gym.com"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Role *
                  </label>
                  <select
                    value={newStaffData.role}
                    onChange={(e) => setNewStaffData({ ...newStaffData, role: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-red-500"
                  >
                    <option value="receptionist">Receptionist</option>
                    <option value="owner">Owner</option>
                    <option value="trainer">Trainer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={newStaffData.phone}
                    onChange={(e) => setNewStaffData({ ...newStaffData, phone: e.target.value })}
                    placeholder="+92 300 ..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={newStaffData.password}
                  onChange={(e) => setNewStaffData({ ...newStaffData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingStaff}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  {isCreatingStaff ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayoutShell>
  );
}
