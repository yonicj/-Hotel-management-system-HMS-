'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BedDouble,
  Building2,
  Plus,
  CheckCircle2,
  Sparkles,
  Search,
  LayoutGrid,
  List,
  Edit2,
  Cigarette,
  CigaretteOff,
  Layers,
  Wrench,
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
import type { RoomItem, FloorItem, RoomTypeItem, RoomStatus } from '@ehms/api-client';

const ALL_ROOM_STATUSES: { value: RoomStatus; label: string; desc: string }[] = [
  { value: 'AVAILABLE', label: 'Available', desc: 'Clean, inspected, and ready for guest check-in' },
  { value: 'RESERVED', label: 'Reserved', desc: 'Assigned to confirmed upcoming arrival' },
  { value: 'OCCUPIED', label: 'Occupied', desc: 'Guest is currently checked-in and in residence' },
  { value: 'CLEANING', label: 'Cleaning', desc: 'Housekeeping turnaround actively in progress' },
  { value: 'DIRTY', label: 'Dirty', desc: 'Guest departed or daily stayover turnover required' },
  { value: 'MAINTENANCE', label: 'Maintenance', desc: 'Repairs or engineering inspection underway' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service', desc: 'Blocked due to major defect or refurbishment' },
];

export default function RoomsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // ---------------------------------------------------------------------------
  // Data Queries
  // ---------------------------------------------------------------------------
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery<RoomItem[]>({
    queryKey: ['rooms'],
    queryFn: () => api.rooms.getAll(),
  });

  const { data: floors = [] } = useQuery<FloorItem[]>({
    queryKey: ['floors'],
    queryFn: () => api.floors.getAll(),
  });

  const { data: roomTypes = [] } = useQuery<RoomTypeItem[]>({
    queryKey: ['room-types'],
    queryFn: () => api.roomTypes.getAll(),
  });

  // ---------------------------------------------------------------------------
  // Filters & View State
  // ---------------------------------------------------------------------------
  const [selectedFloorId, setSelectedFloorId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // ---------------------------------------------------------------------------
  // Drawer & Modal States
  // ---------------------------------------------------------------------------
  // Create Floor Modal
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [floorNumber, setFloorNumber] = useState<number | ''>('');
  const [floorName, setFloorName] = useState('');
  const [floorDescription, setFloorDescription] = useState('');

  // Create Room Drawer
  const [isCreateRoomDrawerOpen, setIsCreateRoomDrawerOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomFloorId, setNewRoomFloorId] = useState('');
  const [newRoomTypeId, setNewRoomTypeId] = useState('');
  const [newRoomIsSmoking, setNewRoomIsSmoking] = useState(false);
  const [newRoomNotes, setNewRoomNotes] = useState('');

  // Room Status & Details Drawer
  const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);
  const [updatedStatus, setUpdatedStatus] = useState<RoomStatus>('AVAILABLE');
  const [statusNotes, setStatusNotes] = useState('');

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  // Create Floor
  const createFloorMutation = useMutation({
    mutationFn: (data: { floorNumber: number; name?: string; description?: string }) =>
      api.floors.create(data),
    onSuccess: (newFloor) => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      toast.success(
        `Floor ${newFloor.floorNumber} ${newFloor.name ? `(${newFloor.name})` : ''} created successfully.`,
        'Floor Created'
      );
      setIsFloorModalOpen(false);
      setFloorNumber('');
      setFloorName('');
      setFloorDescription('');
    },
    onError: (err: any) => {
      const msg = isApiClientError(err) ? err.message : 'Failed to create floor. Verify floor number is unique.';
      toast.error(msg, 'Floor Creation Error');
    },
  });

  // Create Room
  const createRoomMutation = useMutation({
    mutationFn: (data: {
      roomNumber: string;
      floorId: string;
      roomTypeId: string;
      isSmoking?: boolean;
      notes?: string;
    }) => api.rooms.create(data),
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(`Room ${room.roomNumber} created successfully.`, 'Room Created');
      setIsCreateRoomDrawerOpen(false);
      resetCreateRoomForm();
    },
    onError: (err: any) => {
      const msg = isApiClientError(err) ? err.message : 'Failed to create room. Verify room number is unique.';
      toast.error(msg, 'Room Creation Error');
    },
  });

  // Update Room Status
  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: RoomStatus;
      notes?: string;
    }) => api.rooms.updateStatus(id, status, notes),
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(
        `Room ${room.roomNumber} status updated to ${room.status}.`,
        'Status Updated'
      );
      setSelectedRoom(null);
    },
    onError: (err: any) => {
      const msg = isApiClientError(err) ? err.message : 'Failed to update room status.';
      toast.error(msg, 'Status Update Failed');
    },
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const resetCreateRoomForm = () => {
    setNewRoomNumber('');
    setNewRoomFloorId(floors[0]?.id || '');
    setNewRoomTypeId(roomTypes[0]?.id || '');
    setNewRoomIsSmoking(false);
    setNewRoomNotes('');
  };

  const openCreateRoomDrawer = () => {
    resetCreateRoomForm();
    if (floors.length > 0) setNewRoomFloorId(floors[0].id);
    if (roomTypes.length > 0) setNewRoomTypeId(roomTypes[0].id);
    setIsCreateRoomDrawerOpen(true);
  };

  const openRoomDetail = (room: RoomItem) => {
    setSelectedRoom(room);
    setUpdatedStatus(room.status);
    setStatusNotes(room.notes || '');
  };

  const handleCreateFloor = (e: React.FormEvent) => {
    e.preventDefault();
    if (floorNumber === '') {
      toast.error('Floor number is required.', 'Validation Error');
      return;
    }
    createFloorMutation.mutate({
      floorNumber: Number(floorNumber),
      name: floorName.trim() || undefined,
      description: floorDescription.trim() || undefined,
    });
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) {
      toast.error('Room number is required.', 'Validation Error');
      return;
    }
    if (!newRoomFloorId) {
      toast.error('Please select a Floor.', 'Validation Error');
      return;
    }
    if (!newRoomTypeId) {
      toast.error('Please select a Room Type.', 'Validation Error');
      return;
    }

    createRoomMutation.mutate({
      roomNumber: newRoomNumber.trim(),
      floorId: newRoomFloorId,
      roomTypeId: newRoomTypeId,
      isSmoking: newRoomIsSmoking,
      notes: newRoomNotes.trim() || undefined,
    });
  };

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    updateStatusMutation.mutate({
      id: selectedRoom.id,
      status: updatedStatus,
      notes: statusNotes.trim() || undefined,
    });
  };

  // ---------------------------------------------------------------------------
  // Filtering & Stats
  // ---------------------------------------------------------------------------
  const filteredRooms = rooms.filter((room) => {
    // Floor filter
    if (selectedFloorId !== 'all' && room.floorId !== selectedFloorId) {
      return false;
    }
    // Status filter
    if (selectedStatus !== 'all' && room.status !== selectedStatus) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNumber = room.roomNumber.toLowerCase().includes(q);
      const matchType = room.roomType?.name.toLowerCase().includes(q);
      const matchFloor = room.floor?.name?.toLowerCase().includes(q) || String(room.floor?.floorNumber).includes(q);
      const matchNotes = room.notes?.toLowerCase().includes(q);
      return matchNumber || matchType || matchFloor || matchNotes;
    }
    return true;
  });

  // Calculate status counts
  const totalCount = rooms.length;
  const availableCount = rooms.filter((r) => r.status === 'AVAILABLE').length;
  const occupiedCount = rooms.filter((r) => r.status === 'OCCUPIED').length;
  const dirtyCount = rooms.filter((r) => r.status === 'DIRTY').length;
  const cleaningCount = rooms.filter((r) => r.status === 'CLEANING').length;
  const maintenanceCount = rooms.filter((r) => r.status === 'MAINTENANCE').length;
  const oosCount = rooms.filter((r) => r.status === 'OUT_OF_SERVICE').length;

  // ---------------------------------------------------------------------------
  // Table Columns Definition
  // ---------------------------------------------------------------------------
  const columns: Column<RoomItem>[] = [
    {
      key: 'roomNumber',
      header: 'Room',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-800 text-sm">
            {row.roomNumber}
          </div>
          <div>
            <span className="font-semibold text-slate-900">Room {row.roomNumber}</span>
            {row.isSmoking ? (
              <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <Cigarette className="w-3 h-3" /> Smoking
              </span>
            ) : (
              <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                <CigaretteOff className="w-3 h-3" /> Non-Smoking
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'floor',
      header: 'Floor',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-700 text-sm">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Floor {row.floor?.floorNumber ?? '—'}
            {row.floor?.name ? ` (${row.floor.name})` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'roomType',
      header: 'Room Type & Rate',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800">{row.roomType?.name || 'Standard'}</div>
          {row.roomType?.baseRate && (
            <div className="text-xs text-emerald-700 font-medium">
              {Number(row.roomType.baseRate).toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}{' '}
              ETB / night
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusPill status={row.status as RoomStatusType} size="sm" showDot />,
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (row) => (
        <span className="text-xs text-slate-500 line-clamp-1">
          {row.notes || <span className="text-slate-300 italic">No notes</span>}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openRoomDetail(row);
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition"
        >
          <Edit2 className="w-3 h-3 text-slate-400" />
          Update Status
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            Rooms & Floor Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure hotel floors, physical room inventory, smoking policies, and operational room statuses.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFloorModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-lg border border-slate-300 shadow-2xs transition"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            Add Floor
          </button>
          <button
            onClick={openCreateRoomDrawer}
            disabled={floors.length === 0 || roomTypes.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm transition disabled:opacity-50"
            title={
              floors.length === 0
                ? 'Create a floor first'
                : roomTypes.length === 0
                ? 'Create a room type first'
                : 'Create room'
            }
          >
            <Plus className="w-4 h-4" />
            Add Room
          </button>
        </div>
      </div>

      {/* Quick KPI Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Rooms</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
        </div>
        <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
            Available
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{availableCount}</div>
        </div>
        <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200 shadow-2xs">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider flex items-center justify-between">
            Occupied
            <BedDouble className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-800 mt-1">{occupiedCount}</div>
        </div>
        <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 shadow-2xs">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center justify-between">
            Dirty / Cleaning
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-800 mt-1">{dirtyCount + cleaningCount}</div>
        </div>
        <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center justify-between">
            Maintenance / OOS
            <Wrench className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-800 mt-1">{maintenanceCount + oosCount}</div>
        </div>
      </div>

      {/* Floors Filter Tabs */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-slate-400" />
            Filter by Floor
          </div>
          <div className="text-xs text-slate-400">
            {floors.length} {floors.length === 1 ? 'floor configured' : 'floors configured'}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedFloorId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedFloorId === 'all'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Floors ({rooms.length})
          </button>

          {floors.map((floor) => {
            const countOnFloor = rooms.filter((r) => r.floorId === floor.id).length;
            const isSelected = selectedFloorId === floor.id;
            return (
              <button
                key={floor.id}
                onClick={() => setSelectedFloorId(floor.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Floor {floor.floorNumber}</span>
                {floor.name && <span className="opacity-80">({floor.name})</span>}
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {countOnFloor}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Filter & Search Row */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Status Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              selectedStatus === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All ({rooms.length})
          </button>
          {ALL_ROOM_STATUSES.map((st) => {
            const count = rooms.filter((r) => r.status === st.value).length;
            const isSelected = selectedStatus === st.value;
            return (
              <button
                key={st.value}
                onClick={() => setSelectedStatus(st.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{st.label}</span>
                <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & View Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room, type, floor..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            />
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'table'
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* Rooms Content: Grid View or Table View                             */}
      {/* =================================================================== */}
      {viewMode === 'grid' ? (
        filteredRooms.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No Rooms Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              No rooms match your active floor and status filters. Adjust filters or add a new room.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredRooms.map((room) => {
              return (
                <div
                  key={room.id}
                  onClick={() => openRoomDetail(room)}
                  className="bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition cursor-pointer p-4 flex flex-col justify-between group relative"
                >
                  {/* Top: Room Number & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition flex items-center gap-2">
                        <span>Room {room.roomNumber}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Floor {room.floor?.floorNumber ?? '—'}
                        {room.floor?.name ? ` • ${room.floor.name}` : ''}
                      </div>
                    </div>
                    <StatusPill status={room.status as RoomStatusType} size="sm" showDot />
                  </div>

                  {/* Middle: Type & Rate */}
                  <div className="my-3 py-2 border-y border-slate-100 space-y-1">
                    <div className="text-sm font-medium text-slate-800">
                      {room.roomType?.name || 'Standard'}
                    </div>
                    {room.roomType?.baseRate && (
                      <div className="text-xs text-emerald-700 font-semibold">
                        {Number(room.roomType.baseRate).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        ETB <span className="text-slate-400 font-normal">/ night</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom: Smoking & Notes */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      {room.isSmoking ? (
                        <span className="flex items-center gap-1 text-amber-700 font-medium">
                          <Cigarette className="w-3.5 h-3.5" /> Smoking
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-400">
                          <CigaretteOff className="w-3.5 h-3.5" /> Non-Smoking
                        </span>
                      )}
                    </div>
                    <span className="text-emerald-600 font-medium text-[11px] group-hover:underline">
                      Manage &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <DataTable
          columns={columns}
          data={filteredRooms}
          isLoading={isLoadingRooms}
          emptyTitle="No Rooms Match Filter"
          emptyMessage="No rooms found matching your current filter criteria."
          onRowClick={(row) => openRoomDetail(row)}
        />
      )}

      {/* =================================================================== */}
      {/* Create Floor Modal                                                  */}
      {/* =================================================================== */}
      {isFloorModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  Add Hotel Floor
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFloorModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateFloor} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Floor Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={floorNumber}
                    onChange={(e) =>
                      setFloorNumber(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                    }
                    placeholder="e.g. 1, 2, 3"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Must be unique per property.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Floor Name / Wing
                  </label>
                  <input
                    type="text"
                    value={floorName}
                    onChange={(e) => setFloorName(e.target.value)}
                    placeholder="e.g. Executive Club, Garden Wing"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={floorDescription}
                    onChange={(e) => setFloorDescription(e.target.value)}
                    placeholder="e.g. VIP floor with lounge access and keycard security"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFloorModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createFloorMutation.isPending}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
                  >
                    {createFloorMutation.isPending ? 'Creating...' : 'Create Floor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* Create Room Drawer                                                  */}
      {/* =================================================================== */}
      <SlideOverDrawer
        isOpen={isCreateRoomDrawerOpen}
        onClose={() => setIsCreateRoomDrawerOpen(false)}
        title="Add Room"
        description="Provision a new physical room and assign its floor, room type classification, and smoking policy."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateRoomDrawerOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateRoom}
              disabled={createRoomMutation.isPending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
            >
              {createRoomMutation.isPending ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateRoom} className="space-y-5">
          {/* Room Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Room Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newRoomNumber}
              onChange={(e) => setNewRoomNumber(e.target.value)}
              placeholder="e.g. 101, 204-B"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Floor Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Floor Location <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={newRoomFloorId}
              onChange={(e) => setNewRoomFloorId(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              <option value="" disabled>
                Select Floor...
              </option>
              {floors.map((fl) => (
                <option key={fl.id} value={fl.id}>
                  Floor {fl.floorNumber} {fl.name ? `— ${fl.name}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Room Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Room Type Classification <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={newRoomTypeId}
              onChange={(e) => setNewRoomTypeId(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              <option value="" disabled>
                Select Room Type...
              </option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} ({Number(rt.baseRate).toLocaleString()} ETB / night)
                </option>
              ))}
            </select>
          </div>

          {/* Smoking Policy */}
          <div className="pt-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isSmoking"
                checked={newRoomIsSmoking}
                onChange={(e) => setNewRoomIsSmoking(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="isSmoking" className="text-sm font-medium text-slate-700">
                Designated Smoking Room
              </label>
            </div>
            <span className="text-xs text-slate-400 mt-1 block pl-7">
              Leave unchecked if this is a standard 100% smoke-free guest room.
            </span>
          </div>

          {/* Room Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Room Notes / Keycard Configuration
            </label>
            <textarea
              rows={3}
              value={newRoomNotes}
              onChange={(e) => setNewRoomNotes(e.target.value)}
              placeholder="e.g. Connecting door with 102, handicap accessible bathroom..."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>
        </form>
      </SlideOverDrawer>

      {/* =================================================================== */}
      {/* Room Details & Status Management Drawer                             */}
      {/* =================================================================== */}
      <SlideOverDrawer
        isOpen={Boolean(selectedRoom)}
        onClose={() => setSelectedRoom(null)}
        title={selectedRoom ? `Room ${selectedRoom.roomNumber}` : 'Room Details'}
        description="Inspect room attributes and transition through canonical SRS operational statuses."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedRoom(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleUpdateStatus}
              disabled={updateStatusMutation.isPending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Save Status'}
            </button>
          </div>
        }
      >
        {selectedRoom && (
          <div className="space-y-6">
            {/* Room Summary Header Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-slate-900">
                    Room {selectedRoom.roomNumber}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Floor {selectedRoom.floor?.floorNumber ?? '—'}
                    {selectedRoom.floor?.name ? ` • ${selectedRoom.floor.name}` : ''}
                  </div>
                </div>
                <StatusPill status={selectedRoom.status as RoomStatusType} size="md" showDot />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400 block">Classification</span>
                  <span className="font-semibold text-slate-800">
                    {selectedRoom.roomType?.name || 'Standard'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Nightly Base Rate</span>
                  <span className="font-semibold text-emerald-800">
                    {Number(selectedRoom.roomType?.baseRate ?? 0).toLocaleString()} ETB
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Smoking Policy</span>
                  <span className="font-semibold text-slate-800">
                    {selectedRoom.isSmoking ? 'Smoking Allowed' : '100% Smoke-Free'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Max Guests</span>
                  <span className="font-semibold text-slate-800">
                    {selectedRoom.roomType?.maxOccupancy || 2} Guests
                  </span>
                </div>
              </div>
            </div>

            {/* Status Transition Control */}
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Update Operational Status <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  {ALL_ROOM_STATUSES.map((st) => {
                    const isSelected = updatedStatus === st.value;
                    return (
                      <label
                        key={st.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-50/60 border-emerald-400 shadow-2xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="roomStatus"
                          value={st.value}
                          checked={isSelected}
                          onChange={() => setUpdatedStatus(st.value)}
                          className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900">{st.label}</span>
                            <StatusPill status={st.value as RoomStatusType} size="sm" showDot />
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{st.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status Update Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Update Notes / Housekeeping Remarks
                </label>
                <textarea
                  rows={3}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="e.g. Cleaned by staff, ready for inspection, AC repaired..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </form>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
}
