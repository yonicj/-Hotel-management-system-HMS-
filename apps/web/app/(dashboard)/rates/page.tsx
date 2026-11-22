'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Tag,
  BedDouble,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Percent,
} from 'lucide-react';
import {
  DataTable,
  Column,
  SlideOverDrawer,
  ConfirmDialog,
  useToast,
} from '@ehms/ui';
import { api, isApiClientError } from '@/lib/api-client';
import type { RoomTypeItem, RatePlanItem } from '@ehms/api-client';

const COMMON_AMENITIES = [
  'High-Speed Wi-Fi',
  'Air Conditioning',
  'Flat Screen TV',
  'Mini Bar',
  'Balcony',
  'Work Desk',
  'In-Room Safe',
  'Coffee / Tea Maker',
  'City View',
  'Mountain View',
  'Room Service',
  'En-suite Bathroom',
  'Bathtub',
  'Iron & Board',
];

export default function RatesAndPlansPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'room-types' | 'rate-plans'>('room-types');

  // Room Types Queries & State
  const { data: roomTypes = [], isLoading: isLoadingRoomTypes } = useQuery<RoomTypeItem[]>({
    queryKey: ['room-types'],
    queryFn: () => api.roomTypes.getAll(),
  });

  // Rate Plans Queries & State
  const { data: ratePlans = [], isLoading: isLoadingRatePlans } = useQuery<RatePlanItem[]>({
    queryKey: ['rate-plans'],
    queryFn: () => api.ratePlans.getAll(),
  });

  // Room Type Drawer & Modal State
  const [isRoomTypeDrawerOpen, setIsRoomTypeDrawerOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomTypeItem | null>(null);
  const [roomTypeName, setRoomTypeName] = useState('');
  const [roomTypeDesc, setRoomTypeDesc] = useState('');
  const [roomTypeBaseRate, setRoomTypeBaseRate] = useState<number | ''>('');
  const [roomTypeMaxOccupancy, setRoomTypeMaxOccupancy] = useState<number | ''>(2);
  const [roomTypeAmenities, setRoomTypeAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');

  // Delete Room Type State
  const [deletingRoomType, setDeletingRoomType] = useState<RoomTypeItem | null>(null);

  // Rate Plan Drawer State
  const [isRatePlanDrawerOpen, setIsRatePlanDrawerOpen] = useState(false);
  const [editingRatePlan, setEditingRatePlan] = useState<RatePlanItem | null>(null);
  const [ratePlanName, setRatePlanName] = useState('');
  const [ratePlanRoomTypeId, setRatePlanRoomTypeId] = useState('');
  const [ratePlanRate, setRatePlanRate] = useState<number | ''>('');
  const [ratePlanStartDate, setRatePlanStartDate] = useState('');
  const [ratePlanEndDate, setRatePlanEndDate] = useState('');
  const [ratePlanMinStay, setRatePlanMinStay] = useState<number | ''>(1);
  const [ratePlanIsActive, setRatePlanIsActive] = useState(true);

  // Room Types Search Query
  const [roomTypeSearch, setRoomTypeSearch] = useState('');
  // Rate Plans Search Query
  const [ratePlanSearch, setRatePlanSearch] = useState('');

  // ---------------------------------------------------------------------------
  // Room Type Mutations
  // ---------------------------------------------------------------------------
  const createRoomTypeMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      baseRate: number;
      maxOccupancy: number;
      amenities?: string[];
    }) => api.roomTypes.create(data),
    onSuccess: (newType) => {
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
      toast.success(`Room Type "${newType.name}" created successfully.`, 'Room Type Created');
      setIsRoomTypeDrawerOpen(false);
      resetRoomTypeForm();
    },
    onError: (err: any) => {
      const msg = isApiClientError(err) ? err.message : 'Failed to create room type.';
      toast.error(msg, 'Creation Error');
    },
  });

  const updateRoomTypeMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        description?: string;
        baseRate?: number;
        maxOccupancy?: number;
        amenities?: string[];
      };
    }) => api.roomTypes.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
      toast.success(`Room Type "${updated.name}" updated successfully.`, 'Room Type Updated');
      setIsRoomTypeDrawerOpen(false);
      resetRoomTypeForm();
    },
    onError: (err: any) => {
      const msg = isApiClientError(err) ? err.message : 'Failed to update room type.';
      toast.error(msg, 'Update Error');
    },
  });

  const deleteRoomTypeMutation = useMutation({
    mutationFn: (id: string) => api.roomTypes.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
      toast.success('Room type has been removed.', 'Room Type Deleted');
      setDeletingRoomType(null);
    },
    onError: (err: any) => {
      const msg = isApiClientError(err) ? err.message : 'Cannot delete room type with active rooms or reservations.';
      toast.error(msg, 'Deletion Error');
      setDeletingRoomType(null);
    },
  });

  // ---------------------------------------------------------------------------
  // Rate Plan Mutations
  // ---------------------------------------------------------------------------
  const createRatePlanMutation = useMutation({
    mutationFn: (data: {
      roomTypeId: string;
      name: string;
      rate: number;
      startDate: string;
      endDate: string;
      minStay?: number;
      isActive?: boolean;
    }) => api.ratePlans.create(data),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: ['rate-plans'] });
      toast.success(`Rate Plan "${plan.name}" created successfully.`, 'Rate Plan Created');
      setIsRatePlanDrawerOpen(false);
      resetRatePlanForm();
    },
    onError: (err: any) => {
      const msg = isApiClientError(err) ? err.message : 'Failed to create rate plan.';
      toast.error(msg, 'Creation Error');
    },
  });

  const updateRatePlanMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        roomTypeId?: string;
        name?: string;
        rate?: number;
        startDate?: string;
        endDate?: string;
        minStay?: number;
        isActive?: boolean;
      };
    }) => api.ratePlans.update(id, data),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: ['rate-plans'] });
      toast.success(`Rate Plan "${plan.name}" updated successfully.`, 'Rate Plan Updated');
      setIsRatePlanDrawerOpen(false);
      resetRatePlanForm();
    },
    onError: (err: any) => {
      const msg = isApiClientError(err) ? err.message : 'Failed to update rate plan.';
      toast.error(msg, 'Update Error');
    },
  });

  const toggleRatePlanStatus = (plan: RatePlanItem) => {
    updateRatePlanMutation.mutate({
      id: plan.id,
      data: { isActive: !plan.isActive },
    });
  };

  // ---------------------------------------------------------------------------
  // Form Helpers
  // ---------------------------------------------------------------------------
  const resetRoomTypeForm = () => {
    setEditingRoomType(null);
    setRoomTypeName('');
    setRoomTypeDesc('');
    setRoomTypeBaseRate('');
    setRoomTypeMaxOccupancy(2);
    setRoomTypeAmenities([]);
    setCustomAmenity('');
  };

  const openCreateRoomTypeDrawer = () => {
    resetRoomTypeForm();
    setIsRoomTypeDrawerOpen(true);
  };

  const openEditRoomTypeDrawer = (item: RoomTypeItem) => {
    setEditingRoomType(item);
    setRoomTypeName(item.name);
    setRoomTypeDesc(item.description || '');
    setRoomTypeBaseRate(Number(item.baseRate));
    setRoomTypeMaxOccupancy(item.maxOccupancy);
    let parsedAmenities: string[] = [];
    if (Array.isArray(item.amenities)) {
      parsedAmenities = item.amenities;
    } else if (typeof item.amenities === 'string') {
      try {
        parsedAmenities = JSON.parse(item.amenities);
      } catch {
        parsedAmenities = [item.amenities];
      }
    }
    setRoomTypeAmenities(parsedAmenities);
    setIsRoomTypeDrawerOpen(true);
  };

  const handleSaveRoomType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomTypeName.trim()) {
      toast.error('Room Type name is required.', 'Validation Error');
      return;
    }
    if (roomTypeBaseRate === '' || Number(roomTypeBaseRate) <= 0) {
      toast.error('Base Rate must be a positive number in ETB.', 'Validation Error');
      return;
    }
    if (roomTypeMaxOccupancy === '' || Number(roomTypeMaxOccupancy) < 1) {
      toast.error('Max occupancy must be at least 1 guest.', 'Validation Error');
      return;
    }

    if (editingRoomType) {
      updateRoomTypeMutation.mutate({
        id: editingRoomType.id,
        data: {
          name: roomTypeName.trim(),
          description: roomTypeDesc.trim(),
          baseRate: Number(roomTypeBaseRate),
          maxOccupancy: Number(roomTypeMaxOccupancy),
          amenities: roomTypeAmenities,
        },
      });
    } else {
      createRoomTypeMutation.mutate({
        name: roomTypeName.trim(),
        description: roomTypeDesc.trim(),
        baseRate: Number(roomTypeBaseRate),
        maxOccupancy: Number(roomTypeMaxOccupancy),
        amenities: roomTypeAmenities,
      });
    }
  };

  const toggleAmenity = (amenity: string) => {
    setRoomTypeAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const addCustomAmenity = () => {
    if (customAmenity.trim() && !roomTypeAmenities.includes(customAmenity.trim())) {
      setRoomTypeAmenities((prev) => [...prev, customAmenity.trim()]);
      setCustomAmenity('');
    }
  };

  // Rate Plan Helpers
  const resetRatePlanForm = () => {
    setEditingRatePlan(null);
    setRatePlanName('');
    setRatePlanRoomTypeId(roomTypes[0]?.id || '');
    setRatePlanRate('');
    setRatePlanStartDate('');
    setRatePlanEndDate('');
    setRatePlanMinStay(1);
    setRatePlanIsActive(true);
  };

  const openCreateRatePlanDrawer = () => {
    resetRatePlanForm();
    if (roomTypes.length > 0) {
      setRatePlanRoomTypeId(roomTypes[0].id);
    }
    setIsRatePlanDrawerOpen(true);
  };

  const openEditRatePlanDrawer = (plan: RatePlanItem) => {
    setEditingRatePlan(plan);
    setRatePlanName(plan.name);
    setRatePlanRoomTypeId(plan.roomTypeId);
    setRatePlanRate(Number(plan.rate));
    setRatePlanStartDate(plan.startDate ? plan.startDate.slice(0, 10) : '');
    setRatePlanEndDate(plan.endDate ? plan.endDate.slice(0, 10) : '');
    setRatePlanMinStay(plan.minStay || 1);
    setRatePlanIsActive(plan.isActive ?? true);
    setIsRatePlanDrawerOpen(true);
  };

  const handleSaveRatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratePlanName.trim()) {
      toast.error('Rate Plan name is required.', 'Validation Error');
      return;
    }
    if (!ratePlanRoomTypeId) {
      toast.error('Please select an applicable Room Type.', 'Validation Error');
      return;
    }
    if (ratePlanRate === '' || Number(ratePlanRate) <= 0) {
      toast.error('Rate must be a positive number in ETB.', 'Validation Error');
      return;
    }
    if (!ratePlanStartDate || !ratePlanEndDate) {
      toast.error('Please provide valid start and end dates (YYYY-MM-DD).', 'Validation Error');
      return;
    }
    if (new Date(ratePlanStartDate) > new Date(ratePlanEndDate)) {
      toast.error('Start date cannot be after end date.', 'Validation Error');
      return;
    }
    if (ratePlanMinStay === '' || Number(ratePlanMinStay) < 1) {
      toast.error('Minimum stay must be at least 1 night.', 'Validation Error');
      return;
    }

    if (editingRatePlan) {
      updateRatePlanMutation.mutate({
        id: editingRatePlan.id,
        data: {
          name: ratePlanName.trim(),
          roomTypeId: ratePlanRoomTypeId,
          rate: Number(ratePlanRate),
          startDate: ratePlanStartDate,
          endDate: ratePlanEndDate,
          minStay: Number(ratePlanMinStay),
          isActive: ratePlanIsActive,
        },
      });
    } else {
      createRatePlanMutation.mutate({
        name: ratePlanName.trim(),
        roomTypeId: ratePlanRoomTypeId,
        rate: Number(ratePlanRate),
        startDate: ratePlanStartDate,
        endDate: ratePlanEndDate,
        minStay: Number(ratePlanMinStay),
        isActive: ratePlanIsActive,
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Filtered Data
  // ---------------------------------------------------------------------------
  const filteredRoomTypes = roomTypes.filter((rt) => {
    if (!roomTypeSearch) return true;
    const q = roomTypeSearch.toLowerCase();
    return (
      rt.name.toLowerCase().includes(q) ||
      (rt.description && rt.description.toLowerCase().includes(q))
    );
  });

  const filteredRatePlans = ratePlans.filter((rp) => {
    if (!ratePlanSearch) return true;
    const q = ratePlanSearch.toLowerCase();
    const rtName =
      rp.roomType?.name?.toLowerCase() ||
      roomTypes.find((t) => t.id === rp.roomTypeId)?.name?.toLowerCase() ||
      '';
    return rp.name.toLowerCase().includes(q) || rtName.includes(q);
  });

  // ---------------------------------------------------------------------------
  // Table Columns
  // ---------------------------------------------------------------------------
  const roomTypeColumns: Column<RoomTypeItem>[] = [
    {
      key: 'name',
      header: 'Room Type',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.name}</div>
          {row.description && (
            <div className="text-xs text-slate-500 line-clamp-1">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'baseRate',
      header: 'Base Rate (ETB)',
      render: (row) => (
        <span className="font-medium text-emerald-800">
          {Number(row.baseRate).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{' '}
          <span className="text-xs text-slate-500 font-normal">ETB / night</span>
        </span>
      ),
    },
    {
      key: 'maxOccupancy',
      header: 'Capacity',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-700">
          <Users className="w-4 h-4 text-slate-400" />
          <span>
            {row.maxOccupancy} {row.maxOccupancy === 1 ? 'Guest' : 'Guests'}
          </span>
        </div>
      ),
    },
    {
      key: 'amenities',
      header: 'Amenities',
      render: (row) => {
        let list: string[] = [];
        if (Array.isArray(row.amenities)) {
          list = row.amenities;
        } else if (typeof row.amenities === 'string') {
          try {
            list = JSON.parse(row.amenities);
          } catch {
            list = [row.amenities];
          }
        }
        if (!list || list.length === 0) {
          return <span className="text-xs text-slate-400">None specified</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {list.slice(0, 3).map((item, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-md font-medium"
              >
                {item}
              </span>
            ))}
            {list.length > 3 && (
              <span className="inline-block px-1.5 py-0.5 text-xs bg-slate-100 text-slate-500 rounded-md">
                +{list.length - 3} more
              </span>
            )}
          </div>
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
              openEditRoomTypeDrawer(row);
            }}
            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
            title="Edit Room Type"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingRoomType(row);
            }}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete Room Type"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const ratePlanColumns: Column<RatePlanItem>[] = [
    {
      key: 'name',
      header: 'Plan Name',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.name}</div>
          <div className="text-xs text-slate-500">Min {row.minStay || 1} night stay</div>
        </div>
      ),
    },
    {
      key: 'roomType',
      header: 'Room Type',
      render: (row) => {
        const rt =
          row.roomType ||
          roomTypes.find((t) => t.id === row.roomTypeId);
        return (
          <div className="flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-slate-400" />
            <div>
              <span className="font-medium text-slate-800">{rt?.name || 'Unknown Type'}</span>
              {rt?.baseRate && (
                <div className="text-xs text-slate-400">
                  Base: {Number(rt.baseRate).toLocaleString()} ETB
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'rate',
      header: 'Plan Rate (ETB)',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-emerald-700">
            {Number(row.rate).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs text-slate-500">ETB / night</span>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Validity Period',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {row.startDate ? row.startDate.slice(0, 10) : '—'} &rarr;{' '}
            {row.endDate ? row.endDate.slice(0, 10) : '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleRatePlanStatus(row);
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition ${
            row.isActive
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
          }`}
          title="Click to toggle active state"
        >
          {row.isActive ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active</span>
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Inactive</span>
            </>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditRatePlanDrawer(row);
            }}
            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
            title="Edit Rate Plan"
          >
            <Edit2 className="w-4 h-4" />
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
            <Tag className="w-6 h-6 text-emerald-600" />
            Room Types & Rate Plans
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure room classifications, ETB baseline pricing, and seasonal promotional rate plans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'room-types' ? (
            <button
              onClick={openCreateRoomTypeDrawer}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <Plus className="w-4 h-4" />
              Add Room Type
            </button>
          ) : (
            <button
              onClick={openCreateRatePlanDrawer}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <Plus className="w-4 h-4" />
              Add Rate Plan
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('room-types')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
              activeTab === 'room-types'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <BedDouble className="w-4 h-4" />
            Room Types
            <span
              className={`ml-1.5 py-0.5 px-2 rounded-full text-xs ${
                activeTab === 'room-types'
                  ? 'bg-emerald-100 text-emerald-700 font-semibold'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {roomTypes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rate-plans')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
              activeTab === 'rate-plans'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Percent className="w-4 h-4" />
            Rate Plans
            <span
              className={`ml-1.5 py-0.5 px-2 rounded-full text-xs ${
                activeTab === 'rate-plans'
                  ? 'bg-emerald-100 text-emerald-700 font-semibold'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {ratePlans.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Room Types Table */}
      {activeTab === 'room-types' && (
        <DataTable
          columns={roomTypeColumns}
          data={filteredRoomTypes}
          isLoading={isLoadingRoomTypes}
          searchable
          searchQuery={roomTypeSearch}
          onSearchChange={setRoomTypeSearch}
          searchPlaceholder="Search room types by name or description..."
          emptyTitle="No Room Types Found"
          emptyMessage="Create your first room type (e.g. Standard, Deluxe, Presidential Suite) to get started."
          actions={
            <div className="text-xs text-slate-500">
              Showing {filteredRoomTypes.length} of {roomTypes.length} types
            </div>
          }
        />
      )}

      {/* Tab 2: Rate Plans Table */}
      {activeTab === 'rate-plans' && (
        <DataTable
          columns={ratePlanColumns}
          data={filteredRatePlans}
          isLoading={isLoadingRatePlans}
          searchable
          searchQuery={ratePlanSearch}
          onSearchChange={setRatePlanSearch}
          searchPlaceholder="Search rate plans by name or room type..."
          emptyTitle="No Rate Plans Found"
          emptyMessage="Create promotional, seasonal, or corporate rate plans to override standard room rates."
          actions={
            <div className="text-xs text-slate-500">
              Showing {filteredRatePlans.length} of {ratePlans.length} plans
            </div>
          }
        />
      )}

      {/* =================================================================== */}
      {/* Create / Edit Room Type SlideOver Drawer                            */}
      {/* =================================================================== */}
      <SlideOverDrawer
        isOpen={isRoomTypeDrawerOpen}
        onClose={() => setIsRoomTypeDrawerOpen(false)}
        title={editingRoomType ? 'Edit Room Type' : 'Create Room Type'}
        description="Define physical room classification, baseline nightly rate in ETB, and standard guest capacity."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsRoomTypeDrawerOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveRoomType}
              disabled={createRoomTypeMutation.isPending || updateRoomTypeMutation.isPending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
            >
              {createRoomTypeMutation.isPending || updateRoomTypeMutation.isPending
                ? 'Saving...'
                : editingRoomType
                ? 'Save Changes'
                : 'Create Room Type'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveRoomType} className="space-y-5">
          {/* Room Type Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Room Type Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={roomTypeName}
              onChange={(e) => setRoomTypeName(e.target.value)}
              placeholder="e.g. Deluxe Double, Executive Suite"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={roomTypeDesc}
              onChange={(e) => setRoomTypeDesc(e.target.value)}
              placeholder="Features, balcony views, bed specifications..."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
          </div>

          {/* Base Rate & Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Base Rate (ETB) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={roomTypeBaseRate}
                  onChange={(e) =>
                    setRoomTypeBaseRate(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  placeholder="2500.00"
                  className="w-full pl-3.5 pr-12 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 pointer-events-none">
                  ETB
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Max Occupancy <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={roomTypeMaxOccupancy}
                onChange={(e) =>
                  setRoomTypeMaxOccupancy(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                }
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Standard Amenities
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_AMENITIES.map((item) => {
                const isSelected = roomTypeAmenities.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleAmenity(item)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {/* Custom Amenity input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomAmenity();
                  }
                }}
                placeholder="Add custom amenity..."
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <button
                type="button"
                onClick={addCustomAmenity}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
              >
                Add
              </button>
            </div>
          </div>
        </form>
      </SlideOverDrawer>

      {/* =================================================================== */}
      {/* Create / Edit Rate Plan SlideOver Drawer                            */}
      {/* =================================================================== */}
      <SlideOverDrawer
        isOpen={isRatePlanDrawerOpen}
        onClose={() => setIsRatePlanDrawerOpen(false)}
        title={editingRatePlan ? 'Edit Rate Plan' : 'Create Rate Plan'}
        description="Set seasonal, corporate, or promotional pricing for a specific room type."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsRatePlanDrawerOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveRatePlan}
              disabled={createRatePlanMutation.isPending || updateRatePlanMutation.isPending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
            >
              {createRatePlanMutation.isPending || updateRatePlanMutation.isPending
                ? 'Saving...'
                : editingRatePlan
                ? 'Save Changes'
                : 'Create Rate Plan'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveRatePlan} className="space-y-5">
          {/* Plan Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Plan Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={ratePlanName}
              onChange={(e) => setRatePlanName(e.target.value)}
              placeholder="e.g. Summer Holiday Promotion, UN Diplomats Special"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
          </div>

          {/* Applicable Room Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Applicable Room Type <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={ratePlanRoomTypeId}
              onChange={(e) => setRatePlanRoomTypeId(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            >
              <option value="" disabled>
                Select a Room Type...
              </option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} (Base: {Number(rt.baseRate).toLocaleString()} ETB)
                </option>
              ))}
            </select>
          </div>

          {/* Plan Rate (ETB) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Special Plan Rate (ETB) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={ratePlanRate}
                onChange={(e) =>
                  setRatePlanRate(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                placeholder="2200.00"
                className="w-full pl-3.5 pr-12 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 pointer-events-none">
                ETB
              </span>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={ratePlanStartDate}
                onChange={(e) => setRatePlanStartDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={ratePlanEndDate}
                onChange={(e) => setRatePlanEndDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>

          {/* Min Stay */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Minimum Stay (Nights)
            </label>
            <input
              type="number"
              min="1"
              value={ratePlanMinStay}
              onChange={(e) =>
                setRatePlanMinStay(e.target.value === '' ? '' : parseInt(e.target.value, 10))
              }
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
          </div>

          {/* Active Switch */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="ratePlanIsActive"
              checked={ratePlanIsActive}
              onChange={(e) => setRatePlanIsActive(e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="ratePlanIsActive" className="text-sm font-medium text-slate-700">
              Active plan (enabled for reservations during validity period)
            </label>
          </div>
        </form>
      </SlideOverDrawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingRoomType)}
        onClose={() => setDeletingRoomType(null)}
        onConfirm={() => {
          if (deletingRoomType) {
            deleteRoomTypeMutation.mutate(deletingRoomType.id);
          }
        }}
        title="Delete Room Type"
        message={
          <div>
            Are you sure you want to delete{' '}
            <strong className="text-slate-900">{deletingRoomType?.name}</strong>? Any room or
            reservation depending on this room type will prevent its deletion.
          </div>
        }
        confirmText="Delete Room Type"
        variant="danger"
        isLoading={deleteRoomTypeMutation.isPending}
      />
    </div>
  );
}
