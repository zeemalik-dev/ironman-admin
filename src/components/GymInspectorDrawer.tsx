'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  useGetGymByIdQuery,
  useGetGymTelemetryQuery,
  useUpdateGymMutation,
  useDeleteGymMutation,
  useResetUserPasswordMutation,
  useUpdateUserStatusMutation,
  useCreateStaffUserMutation,
} from '../redux/baseApi';
import {
  X,
  Activity,
  Cpu,
  Users,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Building2,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Loader2,
  UserCheck,
  UserX,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '../lib/utils';

interface GymInspectorDrawerProps {
  gymId: string | null;
  onClose: () => void;
  onGymUpdated?: () => void;
  onGymDeleted?: () => void;
}

export function GymInspectorDrawer({
  gymId,
  onClose,
  onGymUpdated,
  onGymDeleted,
}: GymInspectorDrawerProps) {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'hardware' | 'staff' | 'subscription'>('telemetry');

  // Staff Reset Modal
  const [showResetModal, setShowResetModal] = useState<any>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetAccessPinVal, setResetAccessPinVal] = useState('');

  // Add Staff Modal
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'receptionist',
    phone: '',
  });

  // Hardware form
  const [hardwareForm, setHardwareForm] = useState<any>(null);

  // Queries & Mutations
  const {
    data: gymData,
    isLoading: isGymLoading,
    isFetching: isGymFetching,
    refetch: refetchGym,
  } = useGetGymByIdQuery(gymId, { skip: !gymId });

  const {
    data: telemetryData,
    isLoading: isTelemetryLoading,
    refetch: refetchTelemetry,
  } = useGetGymTelemetryQuery(gymId, { skip: !gymId });

  const [updateGym, { isLoading: isUpdatingGym }] = useUpdateGymMutation();
  const [deleteGym, { isLoading: isDeletingGym }] = useDeleteGymMutation();
  const [resetUserPassword, { isLoading: isResettingPassword }] = useResetUserPasswordMutation();
  const [updateUserStatus] = useUpdateUserStatusMutation();
  const [createStaffUser, { isLoading: isCreatingStaff }] = useCreateStaffUserMutation();

  const gym = gymData?.gym;
  const staff = gymData?.staff || [];
  const telemetry = telemetryData?.telemetry;

  // Initialize hardware form
  useEffect(() => {
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

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (gymId) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gymId, onClose]);

  if (!gymId) return null;

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
      toast.success('Hardware and cutoff rules updated!');
      refetchGym();
      onGymUpdated?.();
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
      onGymUpdated?.();
    } catch {
      toast.error('Failed to extend subscription');
    }
  };

  const handleDeleteGym = async () => {
    if (!confirm(`Are you SURE you want to permanently delete gym "${gym?.name}" and all staff accounts?`)) return;
    try {
      await deleteGym(gymId).unwrap();
      toast.success(`Gym "${gym?.name}" deleted`);
      onClose();
      onGymDeleted?.();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete gym');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-[#0e0e11] border-l border-zinc-800 shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-out">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-850 flex items-center justify-between gap-3 bg-zinc-950/80 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-750 flex items-center justify-center overflow-hidden flex-shrink-0 font-black text-red-500 shadow-md">
              {gym?.logoUrl ? (
                <img src={gym.logoUrl} alt={gym.name} className="w-full h-full object-cover" />
              ) : (
                gym?.name?.charAt(0) || 'G'
              )}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white truncate">{gym?.name || 'Loading Gym...'}</h2>
                {gym?.branchCode && (
                  <span className="font-mono text-[10px] font-bold bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
                    {gym.branchCode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                {gym?.address || 'No physical address'} • {gym?.phone || gym?.email || 'No contact'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => {
                refetchGym();
                refetchTelemetry();
              }}
              title="Refresh"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-850 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGymFetching ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href={`/gyms/${gym?._id}/edit`}
              title="Edit Gym Details & Branding (Full Page)"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-850 transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleDeleteGym}
              disabled={isDeletingGym}
              title="Delete Gym"
              className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              title="Close Panel (Esc)"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-850 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status / Quick Action Strip */}
        {gym && (
          <div className="px-5 py-2.5 bg-zinc-900/40 border-b border-zinc-850 flex items-center justify-between text-xs flex-shrink-0">
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  gym.subscriptionStatus === 'active'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {gym.subscriptionStatus}
              </span>
              <span className="text-[11px] font-bold uppercase text-red-400 bg-red-950/40 border border-red-800/30 px-2 py-0.5 rounded-full">
                {gym.subscriptionPlan}
              </span>
              <span className="font-mono text-zinc-400 text-[11px]">
                Valid: <strong className="text-zinc-200">{formatDate(gym.validUntil)}</strong>
              </span>
            </div>

            <span className="font-mono font-bold text-emerald-400">
              {formatCurrency(gym.mrrAmount, gym.currency)}/mo
            </span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-zinc-850 bg-zinc-950/50 flex-shrink-0">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'telemetry'
                ? 'border-red-600 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Telemetry & Health
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'hardware'
                ? 'border-red-600 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> Hardware & Cutoff
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'staff'
                ? 'border-red-600 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Staff & PIN ({staff.length})
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'subscription'
                ? 'border-red-600 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> License & Expiry
          </button>
        </div>

        {/* Drawer Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {isGymLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-7 h-7 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Loading Tenant Data...</p>
            </div>
          ) : !gym ? (
            <div className="py-12 text-center text-xs text-zinc-400">Gym account not found.</div>
          ) : (
            <>
              {/* Tab 1: Telemetry */}
              {activeTab === 'telemetry' && (
                <div className="space-y-4">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Total Members</span>
                        <Users className="w-3.5 h-3.5 text-sky-400" />
                      </div>
                      <p className="text-2xl font-black text-white mt-1.5">{telemetry?.totalMembers ?? '-'}</p>
                      <p className="text-[10px] text-emerald-400 mt-0.5 font-semibold">
                        {telemetry?.activeMembers ?? 0} Active • {telemetry?.expiredMembers ?? 0} Expired
                      </p>
                    </div>

                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Today Check-Ins</span>
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <p className="text-2xl font-black text-emerald-400 mt-1.5">
                        {telemetry?.checkInsToday ?? '-'}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                        {telemetry?.lastAttendance ? (
                          <>Last: #{telemetry.lastAttendance.softwareId || telemetry.lastAttendance.machineUid} ({formatDate(telemetry.lastAttendance.checkInTime)})</>
                        ) : (
                          'No punches today'
                        )}
                      </p>
                    </div>

                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Cash Closing</span>
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <p className="text-lg font-black text-white mt-1.5 capitalize truncate">
                        {telemetry?.latestCashClosing?.status || 'No closing'}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                        {telemetry?.latestCashClosing ? (
                          <>Diff: {formatCurrency(telemetry.latestCashClosing.difference, gym.currency)} on {telemetry.latestCashClosing.dateStr}</>
                        ) : (
                          'No closing recorded'
                        )}
                      </p>
                    </div>

                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Pending Dues</span>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                      <p className="text-lg font-black text-rose-400 mt-1.5 font-mono truncate">
                        {formatCurrency(telemetry?.pendingDues ?? 0, gym.currency)}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {telemetry?.pendingDuesCount ?? 0} members pending
                      </p>
                    </div>
                  </div>

                  {/* Hardware Quick Summary Card */}
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-red-500" /> Biometric Bridge & Schedule
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-zinc-500 text-[10px] uppercase">ZKT Machine IP:</span>
                        <p className="font-mono text-zinc-200 font-bold">
                          {gym.deviceIp || gym.settings?.deviceIp || '192.168.1.201'}:{gym.devicePort || 4370}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[10px] uppercase">Check-in Rollover:</span>
                        <p className="font-mono text-emerald-400 font-bold">
                          {String(gym.settings?.checkInCutoffHour ?? 0).padStart(2, '0')}:
                          {String(gym.settings?.checkInCutoffMinute ?? 0).padStart(2, '0')} Cutoff
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Hardware & Cutoff Times */}
              {activeTab === 'hardware' && hardwareForm && (
                <form onSubmit={handleSaveHardware} className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Physical ZKTeco Bridge & Daily Roll-Over
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Configure IP and cutoff times used by the client hardware bridge.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Device IP Address
                      </label>
                      <input
                        type="text"
                        required
                        value={hardwareForm.deviceIp}
                        onChange={(e) => setHardwareForm({ ...hardwareForm, deviceIp: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Port
                      </label>
                      <input
                        type="number"
                        required
                        value={hardwareForm.devicePort}
                        onChange={(e) => setHardwareForm({ ...hardwareForm, devicePort: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Cutoff Hour (0-23)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={23}
                        value={hardwareForm.checkInCutoffHour}
                        onChange={(e) => setHardwareForm({ ...hardwareForm, checkInCutoffHour: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-red-500"
                      />
                      <p className="text-[9px] text-zinc-500 mt-0.5">e.g. 4 for 4:00 AM cutoff</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Cutoff Minute (0-59)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={hardwareForm.checkInCutoffMinute}
                        onChange={(e) => setHardwareForm({ ...hardwareForm, checkInCutoffMinute: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Opening Time
                      </label>
                      <input
                        type="text"
                        value={hardwareForm.openingTime}
                        onChange={(e) => setHardwareForm({ ...hardwareForm, openingTime: e.target.value })}
                        placeholder="06:00"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Closing Time
                      </label>
                      <input
                        type="text"
                        value={hardwareForm.closingTime}
                        onChange={(e) => setHardwareForm({ ...hardwareForm, closingTime: e.target.value })}
                        placeholder="23:00"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingGym}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                    >
                      {isUpdatingGym ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Save Hardware Rules
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 3: Staff & Passwords */}
              {activeTab === 'staff' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">Staff Roster & Credentials</h3>
                      <p className="text-[11px] text-zinc-400">Reset owner password or access PINs in 1 click.</p>
                    </div>
                    <button
                      onClick={() => setShowAddStaffModal(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition"
                    >
                      <Plus className="w-3 h-3" /> Add Account
                    </button>
                  </div>

                  <div className="space-y-2">
                    {staff.map((u: any) => (
                      <div
                        key={u._id}
                        className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-200">{u.name}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                u.role === 'owner'
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              {u.role}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                u.isActive !== false ? 'text-emerald-400' : 'text-zinc-500'
                              }`}
                            >
                              {u.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">{u.email}</p>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => {
                              setShowResetModal(u);
                              setResetPasswordVal('');
                              setResetAccessPinVal('');
                            }}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition"
                            title="Reset Password or PIN"
                          >
                            <KeyRound className="w-3 h-3 inline mr-1" /> Reset
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`p-1.5 rounded-lg border transition ${
                              u.isActive !== false
                                ? 'text-zinc-500 hover:text-rose-400 border-zinc-800'
                                : 'text-emerald-400 border-emerald-500/30'
                            }`}
                            title={u.isActive !== false ? 'Deactivate User' : 'Activate User'}
                          >
                            {u.isActive !== false ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: License & Subscription */}
              {activeTab === 'subscription' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">License & Expiry Controls</h3>
                    <p className="text-[11px] text-zinc-400">Instantly extend license validity or update status.</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Quick License Extension
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleExtendSubscription(30)}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-xs font-bold text-zinc-200 rounded-xl transition"
                      >
                        + 30 Days
                      </button>
                      <button
                        onClick={() => handleExtendSubscription(90)}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-xs font-bold text-zinc-200 rounded-xl transition"
                      >
                        + 90 Days
                      </button>
                      <button
                        onClick={() => handleExtendSubscription(365)}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-bold text-emerald-400 rounded-xl transition"
                      >
                        + 1 Year
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-850">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                        Subscription Status
                      </label>
                      <select
                        value={gym.subscriptionStatus}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          try {
                            await updateGym({ id: gymId, subscriptionStatus: newStatus }).unwrap();
                            toast.success(`Gym status changed to "${newStatus}"`);
                            refetchGym();
                            onGymUpdated?.();
                          } catch {
                            toast.error('Failed to change status');
                          }
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-red-500"
                      >
                        <option value="active">Active</option>
                        <option value="trial">Trial</option>
                        <option value="past_due">Past Due</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
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
                            onGymUpdated?.();
                          } catch {
                            toast.error('Failed to change plan');
                          }
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-red-500"
                      >
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal: Reset Staff Credentials */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-sm w-full p-5 relative shadow-2xl">
            <button
              onClick={() => setShowResetModal(null)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-white mb-0.5">Reset User Credentials</h3>
            <p className="text-xs text-zinc-400 mb-4">{showResetModal.name} ({showResetModal.email})</p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  New Login Password
                </label>
                <input
                  type="text"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Min 6 chars (blank to keep)"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  New Owner Access PIN (For Cash Closing / Fees)
                </label>
                <input
                  type="text"
                  value={resetAccessPinVal}
                  onChange={(e) => setResetAccessPinVal(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowResetModal(null)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword || (!resetPasswordVal && resetAccessPinVal === '')}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition disabled:opacity-50"
                >
                  {isResettingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Staff Member */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-sm w-full p-5 relative shadow-2xl">
            <button
              onClick={() => setShowAddStaffModal(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-white mb-0.5">Add Staff Account</h3>
            <p className="text-xs text-zinc-400 mb-3">Provision user for {gym?.name}.</p>

            <form onSubmit={handleAddStaff} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newStaffData.name}
                  onChange={(e) => setNewStaffData({ ...newStaffData, name: e.target.value })}
                  placeholder="e.g. Asad Ali"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={newStaffData.email}
                  onChange={(e) => setNewStaffData({ ...newStaffData, email: e.target.value })}
                  placeholder="asad@gym.com"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
                    Role *
                  </label>
                  <select
                    value={newStaffData.role}
                    onChange={(e) => setNewStaffData({ ...newStaffData, role: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-red-500"
                  >
                    <option value="receptionist">Receptionist</option>
                    <option value="owner">Owner</option>
                    <option value="trainer">Trainer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={newStaffData.phone}
                    onChange={(e) => setNewStaffData({ ...newStaffData, phone: e.target.value })}
                    placeholder="+92 300 ..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={newStaffData.password}
                  onChange={(e) => setNewStaffData({ ...newStaffData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingStaff}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition disabled:opacity-50"
                >
                  {isCreatingStaff ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
