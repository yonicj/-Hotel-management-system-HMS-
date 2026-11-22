'use client';

import React from 'react';
import Link from 'next/link';
import {
  Settings,
  Building2,
  Tag,
  Layers,
  Percent,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-600" />
          Property & System Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage hotel configuration, physical property layout, pricing schemas, and operational defaults.
        </p>
      </div>

      {/* Property Setup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Physical Property Setup */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Physical Property & Rooms</h2>
              <p className="text-xs text-slate-500">
                Floors, wings, guest room numbers, and smoking policies.
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600">
            Configure hotel floors, provision individual rooms, set smoking policies, and update real-time room statuses across all 7 canonical SRS lifecycles.
          </p>

          <div className="pt-2">
            <Link
              href="/rooms"
              className="inline-flex items-center justify-between w-full px-4 py-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-sm font-medium transition text-slate-700 group"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Manage Floors & Rooms
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </div>

        {/* Pricing & Rate Plans Setup */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Room Types & Rate Plans</h2>
              <p className="text-xs text-slate-500">
                Classifications, ETB base rates, occupancy, and promotional plans.
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600">
            Define standard room categories, set baseline ETB nightly prices, customize in-room amenities, and create seasonal promotional rate plans with stay requirements.
          </p>

          <div className="pt-2">
            <Link
              href="/rates"
              className="inline-flex items-center justify-between w-full px-4 py-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-sm font-medium transition text-slate-700 group"
            >
              <span className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600" />
                Manage Room Types & Rate Plans
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </div>
      </div>

      {/* Property Operational Configuration Defaults */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Ethiopian Hotel Management System (EHMS) Defaults
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Primary Currency
            </span>
            <span className="text-lg font-bold text-slate-900 mt-1 block">ETB (Ethiopian Birr)</span>
            <span className="text-xs text-slate-500 mt-0.5 block">Standard accounting currency</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Operational Timezone
            </span>
            <span className="text-lg font-bold text-slate-900 mt-1 block">EAT (UTC+3)</span>
            <span className="text-xs text-slate-500 mt-0.5 block">Africa / Addis Ababa</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Check-In / Out Times
            </span>
            <span className="text-lg font-bold text-slate-900 mt-1 block">14:00 / 11:00</span>
            <span className="text-xs text-slate-500 mt-0.5 block">Standard hotel turnover window</span>
          </div>
        </div>
      </div>
    </div>
  );
}
