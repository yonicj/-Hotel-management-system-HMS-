'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { StatusPill, DataTable, Column, SlideOverDrawer, Button } from '@ehms/ui';
import {
  BedDouble,
  Users,
  Sparkles,
  CalendarCheck,
  TrendingUp,
  Eye,
} from 'lucide-react';

interface RoomPreview {
  id: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  status: string;
  rate: string;
}

const SAMPLE_ROOMS: RoomPreview[] = [
  { id: '1', roomNumber: '101', roomType: 'Standard Single', floor: 1, status: 'AVAILABLE', rate: 'ETB 1,800' },
  { id: '2', roomNumber: '102', roomType: 'Standard Single', floor: 1, status: 'OCCUPIED', rate: 'ETB 1,800' },
  { id: '3', roomNumber: '103', roomType: 'Standard Double', floor: 1, status: 'DIRTY', rate: 'ETB 2,500' },
  { id: '4', roomNumber: '201', roomType: 'Standard Double', floor: 2, status: 'CLEANING', rate: 'ETB 2,500' },
  { id: '5', roomNumber: '202', roomType: 'Standard Double', floor: 2, status: 'RESERVED', rate: 'ETB 2,500' },
  { id: '6', roomNumber: '301', roomType: 'Deluxe Suite', floor: 3, status: 'MAINTENANCE', rate: 'ETB 5,200' },
  { id: '7', roomNumber: '302', roomType: 'Deluxe Suite', floor: 3, status: 'OUT_OF_SERVICE', rate: 'ETB 5,200' },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [selectedRoom, setSelectedRoom] = useState<RoomPreview | null>(null);
  const [search, setSearch] = useState('');

  const filteredRooms = SAMPLE_ROOMS.filter(
    (r) =>
      r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.roomType.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<RoomPreview>[] = [
    {
      key: 'roomNumber',
      header: 'Room',
      render: (r) => (
        <span className="font-bold text-slate-900 flex items-center gap-2">
          <BedDouble className="w-4 h-4 text-slate-400" />
          Room {r.roomNumber}
        </span>
      ),
    },
    {
      key: 'roomType',
      header: 'Category',
      render: (r) => <span className="text-slate-600">{r.roomType}</span>,
    },
    {
      key: 'floor',
      header: 'Floor',
      render: (r) => <span className="text-slate-500">Floor {r.floor}</span>,
    },
    {
      key: 'rate',
      header: 'Base Rate',
      render: (r) => <span className="font-medium text-slate-700">{r.rate}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusPill status={r.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRoom(r);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
          title="Inspect Room Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const srsStatuses = [
    'AVAILABLE',
    'RESERVED',
    'OCCUPIED',
    'CLEANING',
    'DIRTY',
    'MAINTENANCE',
    'OUT_OF_SERVICE',
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back,{' '}
            <span className="font-semibold text-slate-800">
              {user?.firstName ? `${user.firstName} ${user.lastName}` : (user?.name || user?.email)}
            </span>
            . Hotel live status overview in Addis Ababa (EAT).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Property System
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Occupancy
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">72.4%</div>
            <p className="text-xs text-slate-500 mt-0.5">48 of 66 Rooms In-House</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Arrivals Today
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">14</div>
            <p className="text-xs text-slate-500 mt-0.5">8 Checked-In • 6 Pending</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Housekeeping
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">6</div>
            <p className="text-xs text-slate-500 mt-0.5">4 Dirty • 2 In Progress</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              In-House Guests
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">83</div>
            <p className="text-xs text-slate-500 mt-0.5">Active Guest Profiles</p>
          </div>
        </div>
      </div>

      {/* 7 SRS Room Status Tokens Showcase */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Design System: 7 SRS Room Status Tokens
            </h2>
            <p className="text-xs text-slate-500">
              Canonical color tokens adhering to Ethiopian Hospitality Requirements (SRS).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {srsStatuses.map((s) => (
            <StatusPill key={s} status={s} size="md" />
          ))}
        </div>
      </div>

      {/* Live Room Rack Data Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Room Status Overview</h2>
            <p className="text-xs text-slate-500">
              Click any room row to open the SlideOverDrawer inspector.
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredRooms}
          searchable
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search rooms, category, or status..."
          onRowClick={(r) => setSelectedRoom(r)}
        />
      </div>

      {/* SlideOverDrawer for Room Details Inspection */}
      <SlideOverDrawer
        isOpen={Boolean(selectedRoom)}
        onClose={() => setSelectedRoom(null)}
        title={selectedRoom ? `Room ${selectedRoom.roomNumber} Inspection` : 'Room Details'}
        description="View and update room status, housekeeping notes, and rate configuration."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              onClick={() => setSelectedRoom(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              Close
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setSelectedRoom(null)}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        {selectedRoom && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-medium">Room Number</div>
                <div className="text-xl font-bold text-slate-900">
                  Room {selectedRoom.roomNumber}
                </div>
              </div>
              <StatusPill status={selectedRoom.status} size="lg" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Category</label>
                <input
                  type="text"
                  readOnly
                  value={selectedRoom.roomType}
                  className="w-full mt-1.5 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Floor Location</label>
                <input
                  type="text"
                  readOnly
                  value={`Floor ${selectedRoom.floor}`}
                  className="w-full mt-1.5 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Base Rate (ETB)</label>
                <input
                  type="text"
                  readOnly
                  value={selectedRoom.rate}
                  className="w-full mt-1.5 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Housekeeping Transition</label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Per ADR 2.5: Room cleaning completion transitions status directly to AVAILABLE (no supervisor inspection gate).
                </p>
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
}
