'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useCreateGymMutation,
  useUpdateGymMutation,
  useUploadImageMutation,
} from '../redux/baseApi';
import {
  Building2,
  CreditCard,
  Sliders,
  KeyRound,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Upload,
  Image as ImageIcon,
  X,
  Cpu,
  Clock,
  ShieldCheck,
  Calendar,
  Sparkles,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface GymFormProps {
  initialData?: any; // If editing an existing gym
  isEditing?: boolean;
}

export function GymForm({ initialData, isEditing = false }: GymFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<'identity' | 'subscription' | 'hardware' | 'owner'>('identity');

  const [createGym, { isLoading: isCreating }] = useCreateGymMutation();
  const [updateGym, { isLoading: isUpdating }] = useUpdateGymMutation();
  const [uploadImage, { isLoading: isUploadingLogo }] = useUploadImageMutation();

  const [formData, setFormData] = useState({
    // Section 1: Identity & Contact
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    branchCode: initialData?.branchCode || '',
    address: initialData?.address || '',
    city: initialData?.city || 'Lahore',
    country: initialData?.country || 'Pakistan',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    logoUrl: initialData?.logoUrl || '',
    // Section 2: SaaS Subscription & Financials
    subscriptionPlan: initialData?.subscriptionPlan || 'pro',
    subscriptionStatus: initialData?.subscriptionStatus || 'active',
    mrrAmount: initialData?.mrrAmount ?? 4999,
    currency: initialData?.currency || 'PKR',
    validUntil: initialData?.validUntil
      ? new Date(initialData.validUntil).toISOString().split('T')[0]
      : '',
    // Section 3: Hardware & Operational Rules
    deviceIp: initialData?.deviceIp || initialData?.settings?.deviceIp || '192.168.1.201',
    devicePort: initialData?.devicePort || initialData?.settings?.devicePort || 4370,
    checkInCutoffHour: initialData?.settings?.checkInCutoffHour ?? 0,
    checkInCutoffMinute: initialData?.settings?.checkInCutoffMinute ?? 0,
    openingTime: initialData?.settings?.openingTime || '06:00',
    closingTime: initialData?.settings?.closingTime || '23:00',
    taxRate: initialData?.settings?.taxRate ?? 0,
    allowPartialPayments: initialData?.settings?.allowPartialPayments ?? true,
    freezeFee: initialData?.settings?.freezeFee ?? 500,
    gracePeriodDays: initialData?.settings?.gracePeriodDays ?? 3,
    // Section 4: Owner Credentials (only for new creation)
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    confirmPassword: '',
  });

  // Auto-generate slug from name if creating
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => {
      const updated = { ...prev, name: value };
      if (!isEditing && (!prev.slug || prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]/g, '-'))) {
        updated.slug = value.toLowerCase().replace(/[^a-z0-9]/g, '-');
      }
      return updated;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }

    const uploadPayload = new FormData();
    uploadPayload.append('file', file);

    try {
      toast.loading('Uploading gym logo...', { id: 'logo-upload' });
      const res = await uploadImage(uploadPayload).unwrap();
      setFormData((prev) => ({ ...prev, logoUrl: res.file?.url || '' }));
      toast.success('Logo uploaded successfully!', { id: 'logo-upload' });
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to upload logo image', { id: 'logo-upload' });
    }
  };

  const handleQuickExtendValidity = (days: number) => {
    const baseDate = formData.validUntil ? new Date(formData.validUntil) : new Date();
    const newDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
    setFormData((prev) => ({
      ...prev,
      validUntil: newDate.toISOString().split('T')[0],
      subscriptionStatus: 'active',
    }));
    toast.success(`Expiry set to ${newDate.toLocaleDateString()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Gym Name is required');
      document.getElementById('section-identity')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (!formData.branchCode.trim()) {
      toast.error('Branch Code is required (e.g. GYM-001)');
      document.getElementById('section-identity')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (isEditing) {
      try {
        await updateGym({
          id: initialData._id,
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          branchCode: formData.branchCode.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          country: formData.country.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          logoUrl: formData.logoUrl,
          subscriptionPlan: formData.subscriptionPlan,
          subscriptionStatus: formData.subscriptionStatus,
          mrrAmount: Number(formData.mrrAmount) || 0,
          currency: formData.currency,
          validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
          deviceIp: formData.deviceIp.trim(),
          devicePort: Number(formData.devicePort) || 4370,
          checkInCutoffHour: Number(formData.checkInCutoffHour) || 0,
          checkInCutoffMinute: Number(formData.checkInCutoffMinute) || 0,
          settings: {
            deviceIp: formData.deviceIp.trim(),
            devicePort: Number(formData.devicePort) || 4370,
            checkInCutoffHour: Number(formData.checkInCutoffHour) || 0,
            checkInCutoffMinute: Number(formData.checkInCutoffMinute) || 0,
            openingTime: formData.openingTime,
            closingTime: formData.closingTime,
            taxRate: Number(formData.taxRate) || 0,
            allowPartialPayments: formData.allowPartialPayments,
            freezeFee: Number(formData.freezeFee) || 0,
            gracePeriodDays: Number(formData.gracePeriodDays) || 3,
          },
        }).unwrap();

        toast.success(`Gym "${formData.name}" updated successfully!`);
        router.push('/gyms');
      } catch (err: any) {
        toast.error(err?.data?.message || 'Failed to update gym');
      }
      return;
    }

    // Creating new gym
    if (!formData.ownerEmail.trim() || !formData.ownerPassword) {
      toast.error('Primary Owner Email and Password are required');
      document.getElementById('section-owner')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (formData.ownerPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      document.getElementById('section-owner')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    try {
      const res = await createGym({
        name: formData.name.trim(),
        slug: formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        branchCode: formData.branchCode.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        logoUrl: formData.logoUrl,
        subscriptionPlan: formData.subscriptionPlan,
        mrrAmount: Number(formData.mrrAmount) || 0,
        currency: formData.currency,
        deviceIp: formData.deviceIp.trim(),
        devicePort: Number(formData.devicePort) || 4370,
        settings: {
          deviceIp: formData.deviceIp.trim(),
          devicePort: Number(formData.devicePort) || 4370,
          checkInCutoffHour: Number(formData.checkInCutoffHour) || 0,
          checkInCutoffMinute: Number(formData.checkInCutoffMinute) || 0,
          openingTime: formData.openingTime,
          closingTime: formData.closingTime,
          taxRate: Number(formData.taxRate) || 0,
          allowPartialPayments: formData.allowPartialPayments,
          freezeFee: Number(formData.freezeFee) || 0,
          gracePeriodDays: Number(formData.gracePeriodDays) || 3,
        },
        ownerName: formData.ownerName.trim() || `${formData.name} Owner`,
        ownerEmail: formData.ownerEmail.trim(),
        ownerPassword: formData.ownerPassword,
      }).unwrap();

      toast.success(res.message || 'Gym & Owner account provisioned!');
      router.push('/gyms');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to provision gym');
    }
  };

  const isLoading = isCreating || isUpdating;

  const scrollToSection = (id: string, sectionKey: any) => {
    setActiveSection(sectionKey);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Page Header with Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-900 sticky top-0 bg-[#09090b]/95 backdrop-blur-md z-20 py-2">
        <div className="flex items-center gap-3">
          <Link
            href="/gyms"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
            title="Back to Fleet Directory"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-red-600/10 text-red-500 border border-red-500/20 text-[10px] font-extrabold uppercase tracking-wider">
                {isEditing ? 'Fleet Configuration' : 'New Gym Setup'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
              {isEditing ? `Edit ${formData.name || 'Gym'}` : 'Add New Gym'}
            </h1>
          </div>
        </div>

        {/* Top Save & Cancel Controls */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/gyms"
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> {isEditing ? 'Save Changes' : 'Save & Add Gym'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sticky Section Anchor Quick-Nav (No next step clicks required!) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-850 text-xs">
        <button
          type="button"
          onClick={() => scrollToSection('section-identity', 'identity')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
            activeSection === 'identity'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-850'
          }`}
        >
          <Building2 className="w-4 h-4" /> 1. Identity & Branding
        </button>
        <button
          type="button"
          onClick={() => scrollToSection('section-subscription', 'subscription')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
            activeSection === 'subscription'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-850'
          }`}
        >
          <CreditCard className="w-4 h-4" /> 2. SaaS Plan & MRR
        </button>
        <button
          type="button"
          onClick={() => scrollToSection('section-hardware', 'hardware')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
            activeSection === 'hardware'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-850'
          }`}
        >
          <Cpu className="w-4 h-4" /> 3. Hardware & Cutoff Rules
        </button>
        {!isEditing && (
          <button
            type="button"
            onClick={() => scrollToSection('section-owner', 'owner')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
              activeSection === 'owner'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <KeyRound className="w-4 h-4" /> 4. Owner Credentials
          </button>
        )}
      </div>

      {/* Section 1: Identity & Branding */}
      <div id="section-identity" className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-6 shadow-xl scroll-mt-28">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          <Building2 className="w-5 h-5 text-red-500" /> Gym Identity & Brand Profile
        </h2>
        <p className="text-xs text-zinc-400 mb-6">
          Set basic gym identifying details, branch code, and brand logo.
        </p>

        {/* Logo Upload Component */}
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Gym Brand Logo
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-zinc-950 border border-zinc-750 flex items-center justify-center overflow-hidden flex-shrink-0 relative shadow-inner">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Gym Logo Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-zinc-600" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoFileUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-700 transition cursor-pointer"
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" /> Select Image from Device
                    </>
                  )}
                </button>
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                    className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
              <input
                type="text"
                name="logoUrl"
                value={formData.logoUrl}
                onChange={handleChange}
                placeholder="Or paste direct image URL (https://...)"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Identity Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Gym / Business Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleNameChange}
              placeholder="e.g. Divinesoft GYM Gulberg Branch"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Branch Code (Unique) *
            </label>
            <input
              type="text"
              name="branchCode"
              required
              value={formData.branchCode}
              onChange={handleChange}
              placeholder="e.g. GYM-002"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-sm focus:outline-none focus:border-red-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              URL Slug
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="divinesoft-gulberg"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-sm focus:outline-none focus:border-red-500 lowercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Official Contact Phone
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+92 300 1234567"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Official Contact Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="info@branchgym.com"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Lahore"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Physical Facility Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Building #, Street, Commercial Area, City"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* Section 2: SaaS Subscription & Pricing */}
      <div id="section-subscription" className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-6 shadow-xl scroll-mt-28">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          <CreditCard className="w-5 h-5 text-red-500" /> SaaS Subscription & Plan Tier
        </h2>
        <p className="text-xs text-zinc-400 mb-6">
          Configure recurring license billing, subscription status, and license expiration.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              SaaS Plan Tier
            </label>
            <select
              name="subscriptionPlan"
              value={formData.subscriptionPlan}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-red-500"
            >
              <option value="starter">Starter (Single Desk / 250 Members)</option>
              <option value="pro">Pro (Unlimited Desks / 1000 Members)</option>
              <option value="enterprise">Enterprise (Multi-Floor / Unlimited)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-red-500"
            >
              <option value="PKR">PKR (Pakistani Rupee)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="AED">AED (UAE Dirham)</option>
              <option value="GBP">GBP (British Pound)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Monthly Recurring Revenue (MRR)
            </label>
            <input
              type="number"
              name="mrrAmount"
              value={formData.mrrAmount}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Account Status
            </label>
            <select
              name="subscriptionStatus"
              value={formData.subscriptionStatus}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-red-500"
            >
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="past_due">Past Due</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="md:col-span-2 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                License Expiry Date (validUntil)
              </label>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-zinc-500 text-[11px] mr-1">Quick Extend:</span>
                <button
                  type="button"
                  onClick={() => handleQuickExtendValidity(30)}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold border border-zinc-700 transition"
                >
                  +30 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickExtendValidity(90)}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold border border-zinc-700 transition"
                >
                  +90 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickExtendValidity(365)}
                  className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/40 transition"
                >
                  +1 Year
                </button>
              </div>
            </div>
            <input
              type="date"
              name="validUntil"
              value={formData.validUntil}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-sm focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Hardware & Cutoff Rules */}
      <div id="section-hardware" className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-6 shadow-xl scroll-mt-28">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          <Cpu className="w-5 h-5 text-red-500" /> Biometric Hardware & Operational Rules
        </h2>
        <p className="text-xs text-zinc-400 mb-6">
          Configure ZKTeco machine connection parameters, 24/7 check-in cutoff thresholds, and financial policies.
        </p>

        {/* Biometric Hardware Card */}
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl mb-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
            <Cpu className="w-4 h-4" /> Physical ZKTeco Machine Configuration
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Machine IP Address
              </label>
              <input
                type="text"
                name="deviceIp"
                value={formData.deviceIp}
                onChange={handleChange}
                placeholder="192.168.1.201"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Machine Port
              </label>
              <input
                type="number"
                name="devicePort"
                value={formData.devicePort}
                onChange={handleChange}
                placeholder="4370"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Check-In Cutoff Time Card */}
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl mb-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Daily Check-In Roll-Over Threshold
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Cutoff Hour (0 to 23)
              </label>
              <input
                type="number"
                min={0}
                max={23}
                name="checkInCutoffHour"
                value={formData.checkInCutoffHour}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-red-500"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                E.g. 4 means workouts from 12:00 AM to 3:59 AM count toward yesterday.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Cutoff Minute (0 to 59)
              </label>
              <input
                type="number"
                min={0}
                max={59}
                name="checkInCutoffMinute"
                value={formData.checkInCutoffMinute}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-zinc-100 font-mono text-xs focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Hours & Financial Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Facility Opening Time
            </label>
            <input
              type="text"
              name="openingTime"
              value={formData.openingTime}
              onChange={handleChange}
              placeholder="06:00"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Facility Closing Time
            </label>
            <input
              type="text"
              name="closingTime"
              value={formData.closingTime}
              onChange={handleChange}
              placeholder="23:00"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Grace Period (Days before alert)
            </label>
            <input
              type="number"
              name="gracePeriodDays"
              value={formData.gracePeriodDays}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Default Freeze Fee
            </label>
            <input
              type="number"
              name="freezeFee"
              value={formData.freezeFee}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Tax Rate (%)
            </label>
            <input
              type="number"
              name="taxRate"
              value={formData.taxRate}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="allowPartialPayments"
              name="allowPartialPayments"
              checked={formData.allowPartialPayments}
              onChange={handleChange}
              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-zinc-900 border-zinc-700"
            />
            <label htmlFor="allowPartialPayments" className="text-sm text-zinc-300 font-medium">
              Allow Partial Payments & Outstanding Dues
            </label>
          </div>
        </div>
      </div>

      {/* Section 4: Owner Credentials Setup (Only for new creation) */}
      {!isEditing && (
        <div id="section-owner" className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-6 shadow-xl scroll-mt-28">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
            <KeyRound className="w-5 h-5 text-red-500" /> Primary Owner Account & Credentials
          </h2>
          <p className="text-xs text-zinc-400 mb-6">
            Create the primary Gym Owner account used to log into the client desktop and mobile portal.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Owner Full Name *
              </label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="e.g. Imran Khan"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Owner Login Email *
              </label>
              <input
                type="email"
                name="ownerEmail"
                value={formData.ownerEmail}
                onChange={handleChange}
                placeholder="owner@branchgym.com"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Account Password *
              </label>
              <input
                type="password"
                name="ownerPassword"
                value={formData.ownerPassword}
                onChange={handleChange}
                placeholder="Min 6 characters"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 text-sm focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#121215]/95 border-t border-zinc-800 backdrop-blur-md p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/gyms"
            className="text-xs font-bold text-zinc-400 hover:text-white transition flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Cancel & Return
          </Link>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Account...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> {isEditing ? 'Save Gym Changes' : 'Save & Add Gym'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
