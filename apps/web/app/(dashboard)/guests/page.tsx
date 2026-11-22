'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  CreditCard,
  Globe,
  Crown,
  Calendar,
  MapPin,
  Edit2,
  Clock,
  BedDouble,
  CheckCircle2,
} from 'lucide-react';
import {
  DataTable,
  Column,
  StatusPill,
  SlideOverDrawer,
  useToast,
  RoomStatusType,
} from '@ehms/ui';
import { api, isApiClientError } from '@/lib/api-client';
import type {
  GuestItem,
  CreateGuestInput,
  UpdateGuestInput,
  GuestListResult,
} from '@ehms/api-client';

const VIP_CONFIGS: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  STANDARD: {
    label: 'Standard',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: 'text-slate-400',
  },
  SILVER: {
    label: 'Silver VIP',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    icon: 'text-sky-500',
  },
  GOLD: {
    label: 'Gold VIP',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    icon: 'text-amber-500',
  },
  PLATINUM: {
    label: 'Platinum VIP',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-300',
    icon: 'text-purple-500',
  },
};

const ID_TYPE_LABELS: Record<string, string> = {
  PASSPORT: 'Passport',
  NATIONAL_ID: 'National ID / Fayda',
  DRIVING_LICENSE: 'Driving License',
};

export default function GuestsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // ---------------------------------------------------------------------------
  // Search & Pagination State
  // ---------------------------------------------------------------------------
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  const { data, isLoading } = useQuery<GuestListResult>({
    queryKey: ['guests', { search: debouncedSearch, page, limit: pageSize }],
    queryFn: () =>
      api.guests.getAll({
        search: debouncedSearch || undefined,
        page,
        limit: pageSize,
      }),
  });

  const guests = data?.guests || [];
  const pagination = data?.pagination || { page: 1, limit: pageSize, total: 0, totalPages: 1 };

  // ---------------------------------------------------------------------------
  // Guest Form & Drawer State
  // ---------------------------------------------------------------------------
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestItem | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nationality, setNationality] = useState('Ethiopian');
  const [idType, setIdType] = useState<string>('NATIONAL_ID');
  const [idNumber, setIdNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [vipLevel, setVipLevel] = useState<string>('STANDARD');
  const [notes, setNotes] = useState('');

  // ---------------------------------------------------------------------------
  // Profile Drawer State
  // ---------------------------------------------------------------------------
  const [selectedGuest, setSelectedGuest] = useState<GuestItem | null>(null);

  // Query individual guest with reservation history when profile is opened
  const { data: fullGuestProfile, isLoading: isLoadingProfile } = useQuery<GuestItem>({
    queryKey: ['guest', selectedGuest?.id],
    queryFn: () => api.guests.getById(selectedGuest!.id),
    enabled: Boolean(selectedGuest?.id),
  });

  const activeGuest = fullGuestProfile || selectedGuest;

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const createGuestMutation = useMutation({
    mutationFn: (newGuest: CreateGuestInput) => api.guests.create(newGuest),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast.success(
        `Guest ${created.firstName} ${created.lastName} registered successfully.`,
        'Guest Registered'
      );
      setIsFormDrawerOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      const msg = isApiClientError(err) ? err.message : 'Failed to register guest.';
      toast.error(msg, 'Registration Error');
    },
  });

  const updateGuestMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGuestInput }) =>
      api.guests.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guest', updated.id] });
      toast.success(
        `Profile for ${updated.firstName} ${updated.lastName} updated.`,
        'Profile Updated'
      );
      setIsFormDrawerOpen(false);
      if (selectedGuest?.id === updated.id) {
        setSelectedGuest(updated);
      }
      resetForm();
    },
    onError: (err: any) => {
      const msg = isApiClientError(err) ? err.message : 'Failed to update guest profile.';
      toast.error(msg, 'Update Error');
    },
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const resetForm = () => {
    setEditingGuest(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setNationality('Ethiopian');
    setIdType('NATIONAL_ID');
    setIdNumber('');
    setDateOfBirth('');
    setAddress('');
    setVipLevel('STANDARD');
    setNotes('');
  };

  const openCreateDrawer = () => {
    resetForm();
    setIsFormDrawerOpen(true);
  };

  const openEditDrawer = (guest: GuestItem) => {
    setEditingGuest(guest);
    setFirstName(guest.firstName || '');
    setLastName(guest.lastName || '');
    setPhone(guest.phone || '');
    setEmail(guest.email || '');
    setNationality(guest.nationality || 'Ethiopian');
    setIdType(guest.idType || 'NATIONAL_ID');
    setIdNumber(guest.idNumber || '');
    setDateOfBirth(guest.dateOfBirth ? guest.dateOfBirth.slice(0, 10) : '');
    setAddress(guest.address || '');
    setVipLevel(guest.vipLevel || 'STANDARD');
    setNotes(guest.notes || '');
    setIsFormDrawerOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      toast.error('First Name is required.', 'Validation Error');
      return;
    }
    if (!lastName.trim()) {
      toast.error('Last Name is required.', 'Validation Error');
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      toast.error('A valid phone number (min 7 digits) is required.', 'Validation Error');
      return;
    }

    // Critical Requirement: Optional email must submit null/undefined rather than empty string ""
    // so the database @unique constraint on optional emails is respected.
    const emailPayload = email.trim() ? email.trim() : null;

    const payload: CreateGuestInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: emailPayload,
      nationality: nationality.trim() || null,
      idType: idType || null,
      idNumber: idNumber.trim() || null,
      dateOfBirth: dateOfBirth || null,
      address: address.trim() || null,
      vipLevel: vipLevel || 'STANDARD',
      notes: notes.trim() || null,
    };

    if (editingGuest) {
      updateGuestMutation.mutate({
        id: editingGuest.id,
        data: payload,
      });
    } else {
      createGuestMutation.mutate(payload);
    }
  };

  // ---------------------------------------------------------------------------
  // Table Columns
  // ---------------------------------------------------------------------------
  const columns: Column<GuestItem>[] = [
    {
      key: 'name',
      header: 'Guest Name',
      render: (row) => {
        const vip = VIP_CONFIGS[row.vipLevel] || VIP_CONFIGS.STANDARD;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
              {row.firstName?.[0]}
              {row.lastName?.[0]}
            </div>
            <div>
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <span>
                  {row.firstName} {row.lastName}
                </span>
                {row.vipLevel !== 'STANDARD' && (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${vip.bg} ${vip.text} ${vip.border}`}
                  >
                    <Crown className="w-2.5 h-2.5" />
                    {vip.label}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                {row.email ? (
                  <span className="flex items-center gap-1 text-slate-600">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {row.email}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">No email (walk-in)</span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'phone',
      header: 'Phone Number',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-700 text-sm">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.phone}</span>
        </div>
      ),
    },
    {
      key: 'idRecord',
      header: 'Identification Record',
      render: (row) => {
        if (!row.idNumber) {
          return <span className="text-xs text-slate-400 italic">Unrecorded</span>;
        }
        const typeLabel = row.idType ? ID_TYPE_LABELS[row.idType] || row.idType : 'ID';
        return (
          <div className="text-xs">
            <div className="font-medium text-slate-800 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span>{row.idNumber}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{typeLabel}</div>
          </div>
        );
      },
    },
    {
      key: 'nationality',
      header: 'Nationality',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.nationality || 'Unspecified'}</span>
        </div>
      ),
    },
    {
      key: 'vipLevel',
      header: 'VIP Tier',
      render: (row) => {
        const vip = VIP_CONFIGS[row.vipLevel] || VIP_CONFIGS.STANDARD;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${vip.bg} ${vip.text} ${vip.border}`}
          >
            <Crown className="w-3 h-3" />
            {vip.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedGuest(row);
            }}
            className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
            title="View Profile & History"
          >
            View Profile
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditDrawer(row);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Edit Guest"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Guest Directory & Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Register walk-in guests, verify Ethiopian Fayda or passport identity, and inspect stay history.
          </p>
        </div>

        <button
          onClick={openCreateDrawer}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          <UserPlus className="w-4 h-4" />
          Register New Guest
        </button>
      </div>

      {/* Search & Fast Lookup Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by guest name, phone, email, or ID number..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-3">
          <span>
            Showing <strong className="text-slate-800">{guests.length}</strong> of{' '}
            <strong className="text-slate-800">{pagination.total}</strong> registered guests
          </span>
          {debouncedSearch && (
            <button
              onClick={() => setSearchInput('')}
              className="text-xs text-rose-600 hover:underline"
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* Directory Data Table */}
      <DataTable
        columns={columns}
        data={guests}
        isLoading={isLoading}
        emptyTitle="No Guests Found"
        emptyMessage={
          debouncedSearch
            ? `No guest records matching "${debouncedSearch}". Check for spelling or register a new guest.`
            : 'No guests registered yet. Register your first guest or walk-in above.'
        }
        pagination={{
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          totalItems: pagination.total,
          pageSize: pagination.limit,
          onPageChange: (newPage) => setPage(newPage),
        }}
        onRowClick={(row) => setSelectedGuest(row)}
      />

      {/* =================================================================== */}
      {/* Register / Edit Guest SlideOver Drawer                              */}
      {/* =================================================================== */}
      <SlideOverDrawer
        isOpen={isFormDrawerOpen}
        onClose={() => setIsFormDrawerOpen(false)}
        title={editingGuest ? 'Edit Guest Profile' : 'Register Guest'}
        description="Capture guest identity, contact information, VIP classification, and preferences."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormDrawerOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitForm}
              disabled={createGuestMutation.isPending || updateGuestMutation.isPending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
            >
              {createGuestMutation.isPending || updateGuestMutation.isPending
                ? 'Saving...'
                : editingGuest
                ? 'Save Changes'
                : 'Register Guest'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmitForm} className="space-y-6">
          {/* Section 1: Basic Identity & Contact (Required) */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              Primary Contact Information
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Abebe"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Bikila"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +251 911 234 567"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. abebe@example.com (leave blank for walk-in)"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Walk-in guests without email are accepted and won&apos;t trigger uniqueness conflicts.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Identification & Nationality */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              Identification & Demographic Details
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  ID Type
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                >
                  <option value="NATIONAL_ID">National ID / Fayda Card</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  ID / Document Number
                </label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. ET-1234567890"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nationality
                </label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="e.g. Ethiopian, Kenyan, British"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Address / City
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Bole Subcity, Woreda 03, Addis Ababa"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>

          {/* Section 3: VIP Classification & Special Notes */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              VIP Tier & Preferences
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                VIP Classification Tier
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['STANDARD', 'SILVER', 'GOLD', 'PLATINUM'] as const).map((tier) => {
                  const isSelected = vipLevel === tier;
                  const cfg = VIP_CONFIGS[tier];
                  return (
                    <button
                      type="button"
                      key={tier}
                      onClick={() => setVipLevel(tier)}
                      className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? `${cfg.bg} ${cfg.border} shadow-2xs ring-2 ring-emerald-500/20`
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <Crown className={`w-4 h-4 ${cfg.icon}`} />
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Guest Notes / Dietary / Bedding Preferences
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. High floor preference, feather pillows, late checkout request..."
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>
        </form>
      </SlideOverDrawer>

      {/* =================================================================== */}
      {/* Guest Detail & Reservation History Profile Drawer                  */}
      {/* =================================================================== */}
      <SlideOverDrawer
        isOpen={Boolean(selectedGuest)}
        onClose={() => setSelectedGuest(null)}
        title={activeGuest ? `${activeGuest.firstName} ${activeGuest.lastName}` : 'Guest Profile'}
        description="Identity record, contact details, and historical reservation timeline."
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-slate-500">
              Registered on{' '}
              {activeGuest?.createdAt ? activeGuest.createdAt.slice(0, 10) : '—'}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedGuest(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
              {activeGuest && (
                <button
                  type="button"
                  onClick={() => openEditDrawer(activeGuest)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        }
      >
        {activeGuest && (
          <div className="space-y-6">
            {/* Guest Summary Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-bold text-lg flex items-center justify-center border border-emerald-200">
                    {activeGuest.firstName?.[0]}
                    {activeGuest.lastName?.[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {activeGuest.firstName} {activeGuest.lastName}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Globe className="w-3 h-3 text-slate-400" />
                      {activeGuest.nationality || 'Unspecified Nationality'}
                    </p>
                  </div>
                </div>

                {(() => {
                  const vip = VIP_CONFIGS[activeGuest.vipLevel] || VIP_CONFIGS.STANDARD;
                  return (
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${vip.bg} ${vip.text} ${vip.border}`}
                    >
                      <Crown className="w-3.5 h-3.5" />
                      {vip.label}
                    </span>
                  );
                })()}
              </div>

              {/* Contact & ID Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Phone Number
                    </span>
                    <span className="font-medium text-slate-800">{activeGuest.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Email Address
                    </span>
                    <span className="font-medium text-slate-800">
                      {activeGuest.email || <span className="italic text-slate-400">None</span>}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      ID Document
                    </span>
                    <span className="font-medium text-slate-800">
                      {activeGuest.idType
                        ? ID_TYPE_LABELS[activeGuest.idType] || activeGuest.idType
                        : 'ID'}
                      : {activeGuest.idNumber || 'Unrecorded'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Date of Birth
                    </span>
                    <span className="font-medium text-slate-800">
                      {activeGuest.dateOfBirth ? activeGuest.dateOfBirth.slice(0, 10) : '—'}
                    </span>
                  </div>
                </div>

                {activeGuest.address && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Address
                      </span>
                      <span className="font-medium text-slate-800">{activeGuest.address}</span>
                    </div>
                  </div>
                )}
              </div>

              {activeGuest.notes && (
                <div className="pt-2 border-t border-slate-200 text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">
                    Staff & Hospitality Remarks
                  </span>
                  <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                    {activeGuest.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Reservation History Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Reservation History
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  {activeGuest.reservationGuests?.length || 0} stay(s)
                </span>
              </h4>

              {isLoadingProfile ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Loading reservation records...
                </div>
              ) : activeGuest.reservationGuests && activeGuest.reservationGuests.length > 0 ? (
                <div className="space-y-2">
                  {activeGuest.reservationGuests.map((rg) => {
                    const res = rg.reservation;
                    if (!res) return null;
                    return (
                      <div
                        key={rg.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              #{res.confirmationNumber}
                            </span>
                            <StatusPill status={res.status as RoomStatusType} size="sm" showDot />
                          </div>
                          <div className="text-slate-500 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {res.checkInDate ? res.checkInDate.slice(0, 10) : '—'} &rarr;{' '}
                              {res.checkOutDate ? res.checkOutDate.slice(0, 10) : '—'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-medium text-slate-800">
                            {res.roomType?.name || 'Room'}
                          </div>
                          {res.room?.roomNumber && (
                            <div className="text-slate-500 text-[11px]">
                              Room {res.room.roomNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                  <BedDouble className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <div className="text-xs font-semibold text-slate-700">No Prior Stays</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    This guest has no registered reservations on file yet.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
}
