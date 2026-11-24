'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarPlus,
  Search,
  BedDouble,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Edit3,
  Copy,
  Check,
  Phone,
  Mail,
  List,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Layers,
  Wrench,
  Ban,
} from 'lucide-react';
import {
  DataTable,
  Column,
  StatusPill,
  SlideOverDrawer,
  ConfirmDialog,
  useToast,
  ReservationStatusType,
} from '@ehms/ui';
import { api, isApiClientError } from '@/lib/api-client';
import type {
  ReservationItem,
  CreateReservationInput,
  ModifyReservationInput,
  ReservationSource,
  RoomItem,
  RoomTypeItem,
  RatePlanItem,
  GuestItem,
} from '@ehms/api-client';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatETB(amount: number | string | undefined | null): string {
  const num = Number(amount || 0);
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  const diff = end - start;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getTomorrowString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

const SOURCES: { value: ReservationSource; label: string }[] = [
  { value: 'WALK_IN', label: 'Walk-In' },
  { value: 'PHONE', label: 'Phone Booking' },
  { value: 'WEBSITE', label: 'Direct Website' },
  { value: 'OTA_BOOKING', label: 'OTA / Online Agency' },
  { value: 'AGENT', label: 'Travel Agent' },
];

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CHECKED_IN', label: 'Checked In' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No Show' },
];

const STATUS_BAR_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  PENDING: {
    bg: 'bg-amber-100 hover:bg-amber-200',
    border: 'border-amber-300',
    text: 'text-amber-900',
    dot: 'bg-amber-500',
  },
  CONFIRMED: {
    bg: 'bg-blue-100 hover:bg-blue-200',
    border: 'border-blue-300',
    text: 'text-blue-900',
    dot: 'bg-blue-500',
  },
  CHECKED_IN: {
    bg: 'bg-emerald-100 hover:bg-emerald-200',
    border: 'border-emerald-300',
    text: 'text-emerald-900',
    dot: 'bg-emerald-500',
  },
  COMPLETED: {
    bg: 'bg-slate-200 hover:bg-slate-300',
    border: 'border-slate-300',
    text: 'text-slate-800',
    dot: 'bg-slate-500',
  },
  CANCELLED: {
    bg: 'bg-rose-100 hover:bg-rose-200',
    border: 'border-rose-300',
    text: 'text-rose-800',
    dot: 'bg-rose-500',
  },
  NO_SHOW: {
    bg: 'bg-purple-100 hover:bg-purple-200',
    border: 'border-purple-300',
    text: 'text-purple-800',
    dot: 'bg-purple-500',
  },
};

export default function ReservationsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // ---------------------------------------------------------------------------
  // Top View Toggle: List vs Timeline
  // ---------------------------------------------------------------------------
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  // ---------------------------------------------------------------------------
  // Availability Search Bar State
  // ---------------------------------------------------------------------------
  const [searchCheckIn, setSearchCheckIn] = useState<string>(getTodayString());
  const [searchCheckOut, setSearchCheckOut] = useState<string>(getTomorrowString());
  const [searchRoomTypeId, setSearchRoomTypeId] = useState<string>('');
  const [availabilitySearched, setAvailabilitySearched] = useState(false);

  // ---------------------------------------------------------------------------
  // Reservations Table State (List View)
  // ---------------------------------------------------------------------------
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ---------------------------------------------------------------------------
  // Timeline Grid State
  // ---------------------------------------------------------------------------
  const [timelineWindowDays, setTimelineWindowDays] = useState<7 | 14>(14);
  const [timelineStartDate, setTimelineStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [timelineGroupBy, setTimelineGroupBy] = useState<'floor' | 'roomType'>('floor');

  // ---------------------------------------------------------------------------
  // Drawer States
  // ---------------------------------------------------------------------------
  // New Booking Drawer
  const [isNewDrawerOpen, setIsNewDrawerOpen] = useState(false);
  const [bookingGuestMode, setBookingGuestMode] = useState<'existing' | 'walkin'>('existing');

  // Existing Guest Search
  const [guestSearchInput, setGuestSearchInput] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<GuestItem | null>(null);

  // Walk-in Guest Inline Form
  const [walkinFirstName, setWalkinFirstName] = useState('');
  const [walkinLastName, setWalkinLastName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinEmail, setWalkinEmail] = useState('');
  const [walkinIdType, setWalkinIdType] = useState('NATIONAL_ID');
  const [walkinIdNumber, setWalkinIdNumber] = useState('');

  // Stay Inputs
  const [bookingCheckIn, setBookingCheckIn] = useState(getTodayString());
  const [bookingCheckOut, setBookingCheckOut] = useState(getTomorrowString());
  const [bookingRoomTypeId, setBookingRoomTypeId] = useState('');
  const [bookingRoomId, setBookingRoomId] = useState('');
  const [bookingRatePlanId, setBookingRatePlanId] = useState('');
  const [bookingAdults, setBookingAdults] = useState(1);
  const [bookingChildren, setBookingChildren] = useState(0);
  const [bookingSource, setBookingSource] = useState<ReservationSource>('WALK_IN');
  const [bookingSpecialRequests, setBookingSpecialRequests] = useState('');

  // Detail / Action Drawer
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isModifyMode, setIsModifyMode] = useState(false);

  // Modify Form State
  const [modifyCheckIn, setModifyCheckIn] = useState('');
  const [modifyCheckOut, setModifyCheckOut] = useState('');
  const [modifyRoomId, setModifyRoomId] = useState('');
  const [modifySpecialRequests, setModifySpecialRequests] = useState('');

  // Cancel Confirmation Modal
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // Copied confirmation number feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  // 1. Room Types & Rate Plans
  const { data: roomTypes = [] } = useQuery<RoomTypeItem[]>({
    queryKey: ['roomTypes'],
    queryFn: () => api.roomTypes.getAll(),
  });

  const { data: ratePlans = [] } = useQuery<RatePlanItem[]>({
    queryKey: ['ratePlans'],
    queryFn: () => api.ratePlans.getAll(),
  });

  // 2. All Rooms (used in Timeline & room mapping)
  const { data: allRooms = [], isLoading: isLoadingRooms } = useQuery<RoomItem[]>({
    queryKey: ['rooms-all'],
    queryFn: () => api.rooms.getAll(),
  });

  // 3. Reservations List Query (for List View)
  const {
    data: reservationsData,
    isLoading: isLoadingReservations,
  } = useQuery({
    queryKey: ['reservations', page, statusFilter, debouncedSearch],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit: pageSize };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      return api.reservations.getAll(params);
    },
  });

  const reservationsList = useMemo(() => {
    const list = reservationsData?.reservations || [];
    if (!debouncedSearch) return list;
    const q = debouncedSearch.toLowerCase();
    return list.filter((r) => {
      const conf = r.confirmationNumber?.toLowerCase() || '';
      const guestName =
        r.reservationGuests?.[0]?.guest
          ? `${r.reservationGuests[0].guest.firstName} ${r.reservationGuests[0].guest.lastName}`.toLowerCase()
          : '';
      const guestPhone = r.reservationGuests?.[0]?.guest?.phone?.toLowerCase() || '';
      return conf.includes(q) || guestName.includes(q) || guestPhone.includes(q);
    });
  }, [reservationsData?.reservations, debouncedSearch]);

  // 4. Availability Search Query
  const isSearchValid = Boolean(
    searchCheckIn &&
    searchCheckOut &&
    new Date(searchCheckOut) > new Date(searchCheckIn)
  );

  const {
    data: availableRooms = [],
    isLoading: isSearchingAvailability,
    refetch: refetchAvailability,
  } = useQuery<RoomItem[]>({
    queryKey: ['rooms-availability', searchCheckIn, searchCheckOut, searchRoomTypeId],
    queryFn: async () => {
      if (!isSearchValid) return [];
      return api.rooms.getAvailability({
        checkInDate: searchCheckIn,
        checkOutDate: searchCheckOut,
        roomTypeId: searchRoomTypeId || undefined,
      });
    },
    enabled: availabilitySearched && isSearchValid,
  });

  // 5. Booking Drawer Available Rooms (filtered by booking dates + selected room type)
  const isBookingDatesValid = Boolean(
    bookingCheckIn &&
    bookingCheckOut &&
    new Date(bookingCheckOut) > new Date(bookingCheckIn)
  );

  const { data: bookingAvailableRooms = [] } = useQuery<RoomItem[]>({
    queryKey: ['booking-available-rooms', bookingCheckIn, bookingCheckOut, bookingRoomTypeId],
    queryFn: async () => {
      if (!isBookingDatesValid) return [];
      return api.rooms.getAvailability({
        checkInDate: bookingCheckIn,
        checkOutDate: bookingCheckOut,
        roomTypeId: bookingRoomTypeId || undefined,
      });
    },
    enabled: isNewDrawerOpen && isBookingDatesValid,
  });

  // 6. Modify Drawer Available Rooms (when modifying)
  const isModifyDatesValid = Boolean(
    modifyCheckIn &&
    modifyCheckOut &&
    new Date(modifyCheckOut) > new Date(modifyCheckIn)
  );

  const { data: modifyAvailableRooms = [] } = useQuery<RoomItem[]>({
    queryKey: [
      'modify-available-rooms',
      modifyCheckIn,
      modifyCheckOut,
      selectedReservation?.roomTypeId,
    ],
    queryFn: async () => {
      if (!isModifyDatesValid || !selectedReservation?.roomTypeId) return [];
      return api.rooms.getAvailability({
        checkInDate: modifyCheckIn,
        checkOutDate: modifyCheckOut,
        roomTypeId: selectedReservation.roomTypeId,
      });
    },
    enabled: isDetailDrawerOpen && isModifyMode && isModifyDatesValid,
  });

  // 7. Guest Search in Booking Drawer
  const { data: guestsSearchData } = useQuery({
    queryKey: ['guests-search', guestSearchInput],
    queryFn: async () => {
      return api.guests.getAll({ search: guestSearchInput, limit: 8 });
    },
    enabled: isNewDrawerOpen && bookingGuestMode === 'existing',
  });

  // 8. Timeline Reservations Query (covering the timeline window)
  const timelineStartStr = useMemo(
    () => timelineStartDate.toISOString().split('T')[0],
    [timelineStartDate]
  );
  const timelineEndStr = useMemo(() => {
    const end = new Date(timelineStartDate);
    end.setDate(end.getDate() + timelineWindowDays);
    return end.toISOString().split('T')[0];
  }, [timelineStartDate, timelineWindowDays]);

  const {
    data: timelineReservationsData,
    isLoading: isLoadingTimelineRes,
  } = useQuery({
    queryKey: ['reservations-timeline', timelineStartStr, timelineEndStr],
    queryFn: () =>
      api.reservations.getAll({
        startDate: timelineStartStr,
        endDate: timelineEndStr,
        limit: 150,
      }),
    enabled: viewMode === 'timeline',
  });

  // ---------------------------------------------------------------------------
  // Timeline Grid Computations
  // ---------------------------------------------------------------------------
  const timelineDays = useMemo(() => {
    const days: {
      date: Date;
      iso: string;
      dayName: string;
      dayNum: number;
      monthName: string;
      isToday: boolean;
      isWeekend: boolean;
    }[] = [];
    const todayIso = new Date().toISOString().split('T')[0];

    for (let i = 0; i < timelineWindowDays; i++) {
      const d = new Date(timelineStartDate);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      days.push({
        date: d,
        iso,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: iso === todayIso,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }
    return days;
  }, [timelineStartDate, timelineWindowDays]);

  // Group rooms for Timeline
  const groupedRooms = useMemo(() => {
    if (timelineGroupBy === 'roomType') {
      const groups: Record<string, { label: string; rooms: RoomItem[] }> = {};
      allRooms.forEach((room) => {
        const typeName = room.roomType?.name || 'Standard';
        if (!groups[typeName]) {
          groups[typeName] = { label: typeName, rooms: [] };
        }
        groups[typeName].rooms.push(room);
      });
      return Object.values(groups);
    }

    // Default: Group by Floor
    const groups: Record<string, { label: string; rooms: RoomItem[] }> = {};
    allRooms.forEach((room) => {
      const floorNum = room.floor?.floorNumber ?? 0;
      const key = `Floor ${floorNum}`;
      if (!groups[key]) {
        groups[key] = { label: key, rooms: [] };
      }
      groups[key].rooms.push(room);
    });
    return Object.values(groups);
  }, [allRooms, timelineGroupBy]);

  const timelineReservations = useMemo(() => {
    return timelineReservationsData?.reservations || [];
  }, [timelineReservationsData]);

  // ---------------------------------------------------------------------------
  // Estimated Rate Calculation
  // ---------------------------------------------------------------------------
  const searchNights = useMemo(
    () => calculateNights(searchCheckIn, searchCheckOut),
    [searchCheckIn, searchCheckOut]
  );

  const bookingNights = useMemo(
    () => calculateNights(bookingCheckIn, bookingCheckOut),
    [bookingCheckIn, bookingCheckOut]
  );

  const selectedBookingRoomType = useMemo(
    () => roomTypes.find((rt) => rt.id === bookingRoomTypeId),
    [roomTypes, bookingRoomTypeId]
  );

  const estimatedTotalCost = useMemo(() => {
    if (!selectedBookingRoomType || bookingNights <= 0) return 0;
    const baseRate = Number(selectedBookingRoomType.baseRate || 0);
    return bookingNights * baseRate;
  }, [selectedBookingRoomType, bookingNights]);

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  // Create Reservation Mutation
  const createReservationMutation = useMutation({
    mutationFn: async () => {
      let guestId = selectedGuest?.id;

      // Quick create walk-in guest if mode is 'walkin'
      if (bookingGuestMode === 'walkin') {
        if (!walkinFirstName.trim() || !walkinLastName.trim() || !walkinPhone.trim()) {
          throw new Error('Please fill out all required guest fields (First Name, Last Name, Phone).');
        }
        const createdGuest = await api.guests.create({
          firstName: walkinFirstName.trim(),
          lastName: walkinLastName.trim(),
          phone: walkinPhone.trim(),
          email: walkinEmail.trim() ? walkinEmail.trim() : null,
          idType: walkinIdType,
          idNumber: walkinIdNumber.trim() ? walkinIdNumber.trim() : null,
        });
        guestId = createdGuest.id;
      }

      if (!guestId) {
        throw new Error('Please select an existing guest or provide walk-in guest details.');
      }
      if (!bookingRoomTypeId) {
        throw new Error('Please select a room type.');
      }
      if (!isBookingDatesValid) {
        throw new Error('Check-out date must be after check-in date.');
      }

      const payload: CreateReservationInput = {
        guestId,
        roomTypeId: bookingRoomTypeId,
        roomId: bookingRoomId || null,
        ratePlanId: bookingRatePlanId || null,
        checkInDate: bookingCheckIn,
        checkOutDate: bookingCheckOut,
        adults: bookingAdults,
        children: bookingChildren,
        source: bookingSource,
        specialRequests: bookingSpecialRequests.trim() || null,
      };

      return api.reservations.create(payload);
    },
    onSuccess: (res) => {
      toast.success(
        'Reservation Created',
        `Booking ${res.confirmationNumber} has been successfully recorded.`
      );
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['rooms-availability'] });
      setIsNewDrawerOpen(false);
      resetNewBookingForm();
    },
    onError: (err: any) => {
      if (isApiClientError(err) && err.code === 'ROOM_UNAVAILABLE') {
        toast.error(
          'Room Unavailable',
          err.message || 'Room is no longer available for the selected dates.'
        );
      } else {
        toast.error('Booking Failed', err.message || 'Unable to create reservation.');
      }
    },
  });

  // Confirm Reservation Mutation
  const confirmMutation = useMutation({
    mutationFn: async (id: string) => api.reservations.confirm(id),
    onSuccess: (updated) => {
      toast.success('Reservation Confirmed', `Booking ${updated.confirmationNumber} is now confirmed.`);
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['rooms-availability'] });
      setSelectedReservation((prev) => (prev ? { ...prev, status: 'CONFIRMED' } : null));
    },
    onError: (err: any) => {
      if (isApiClientError(err) && err.code === 'ROOM_UNAVAILABLE') {
        toast.error('Confirmation Blocked', 'Assigned room is no longer available.');
      } else {
        toast.error('Confirmation Failed', err.message || 'Could not confirm reservation.');
      }
    },
  });

  // Modify Reservation Mutation
  const modifyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedReservation) return;
      const payload: ModifyReservationInput = {
        checkInDate: modifyCheckIn || undefined,
        checkOutDate: modifyCheckOut || undefined,
        roomId: modifyRoomId !== '' ? modifyRoomId : undefined,
        specialRequests: modifySpecialRequests || undefined,
      };
      return api.reservations.modify(selectedReservation.id, payload);
    },
    onSuccess: (updated) => {
      toast.success('Reservation Updated', 'Dates and room assignments were updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['rooms-availability'] });
      if (updated) setSelectedReservation(updated);
      setIsModifyMode(false);
    },
    onError: (err: any) => {
      if (isApiClientError(err) && err.code === 'ROOM_UNAVAILABLE') {
        toast.error('Update Rejected', err.message || 'Room is unavailable for modified dates.');
      } else {
        toast.error('Modification Failed', err.message || 'Could not update reservation.');
      }
    },
  });

  // Cancel Reservation Mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => api.reservations.cancel(id),
    onSuccess: (updated) => {
      toast.success(
        'Reservation Cancelled',
        `Booking ${updated.confirmationNumber} has been cancelled and the room is released.`
      );
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['rooms-availability'] });
      setIsCancelConfirmOpen(false);
      setIsDetailDrawerOpen(false);
      setSelectedReservation(null);
    },
    onError: (err: any) => {
      toast.error('Cancellation Failed', err.message || 'Could not cancel reservation.');
    },
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const resetNewBookingForm = () => {
    setSelectedGuest(null);
    setGuestSearchInput('');
    setWalkinFirstName('');
    setWalkinLastName('');
    setWalkinPhone('');
    setWalkinEmail('');
    setWalkinIdType('NATIONAL_ID');
    setWalkinIdNumber('');
    setBookingCheckIn(getTodayString());
    setBookingCheckOut(getTomorrowString());
    setBookingRoomTypeId('');
    setBookingRoomId('');
    setBookingRatePlanId('');
    setBookingAdults(1);
    setBookingChildren(0);
    setBookingSource('WALK_IN');
    setBookingSpecialRequests('');
  };

  const handleOpenBookRoomFromSearch = (room: RoomItem) => {
    setBookingCheckIn(searchCheckIn);
    setBookingCheckOut(searchCheckOut);
    setBookingRoomTypeId(room.roomTypeId);
    setBookingRoomId(room.id);
    setIsNewDrawerOpen(true);
  };

  const handleTimelineCellClick = (room: RoomItem, dateStr: string) => {
    if (room.status === 'MAINTENANCE' || room.status === 'OUT_OF_SERVICE') {
      toast.error(
        'Room Unavailable',
        `Room ${room.roomNumber} is currently in ${room.status} and cannot be booked.`
      );
      return;
    }

    const nextDay = new Date(dateStr);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];

    resetNewBookingForm();
    setBookingCheckIn(dateStr);
    setBookingCheckOut(nextDayStr);
    setBookingRoomTypeId(room.roomTypeId);
    setBookingRoomId(room.id);
    setIsNewDrawerOpen(true);
  };

  const handleRowClick = (reservation: ReservationItem) => {
    setSelectedReservation(reservation);
    setModifyCheckIn(reservation.checkInDate ? reservation.checkInDate.split('T')[0] : '');
    setModifyCheckOut(reservation.checkOutDate ? reservation.checkOutDate.split('T')[0] : '');
    setModifyRoomId(reservation.roomId || '');
    setModifySpecialRequests(reservation.specialRequests || '');
    setIsModifyMode(false);
    setIsDetailDrawerOpen(true);
  };

  const handleCopyConfirmation = (e: React.MouseEvent, confNum: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(confNum);
    setCopiedId(confNum);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied', `Confirmation #${confNum} copied to clipboard.`);
  };

  // Timeline Navigation
  const handleTimelinePrev = () => {
    setTimelineStartDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - timelineWindowDays);
      return d;
    });
  };

  const handleTimelineNext = () => {
    setTimelineStartDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + timelineWindowDays);
      return d;
    });
  };

  const handleTimelineToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setTimelineStartDate(d);
  };

  // ---------------------------------------------------------------------------
  // Table Columns Definition (List View)
  // ---------------------------------------------------------------------------
  const columns: Column<ReservationItem>[] = [
    {
      key: 'confirmationNumber',
      header: 'Confirmation #',
      render: (row) => (
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-800">
          <span>{row.confirmationNumber}</span>
          <button
            onClick={(e) => handleCopyConfirmation(e, row.confirmationNumber)}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition"
            title="Copy Confirmation Number"
          >
            {copiedId === row.confirmationNumber ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      ),
    },
    {
      key: 'guest',
      header: 'Guest Name',
      render: (row) => {
        const guest = row.reservationGuests?.[0]?.guest;
        if (!guest) return <span className="text-slate-400">No Guest Attached</span>;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">
              {guest.firstName} {guest.lastName}
            </span>
            <span className="text-xs text-slate-500">{guest.phone}</span>
          </div>
        );
      },
    },
    {
      key: 'room',
      header: 'Room & Type',
      render: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-800">
              {row.room ? `Room ${row.room.roomNumber}` : 'Auto-Assign'}
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {row.roomType?.name || 'Standard'}
          </span>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Stay Dates',
      render: (row) => {
        const nights = calculateNights(row.checkInDate, row.checkOutDate);
        return (
          <div className="flex flex-col">
            <span className="text-xs text-slate-800">
              {formatDate(row.checkInDate)} → {formatDate(row.checkOutDate)}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {nights} {nights === 1 ? 'night' : 'nights'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'totalAmount',
      header: 'Total Cost',
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {formatETB(row.totalAmount)}
        </span>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (row) => (
        <span className="text-xs px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700">
          {row.source?.replace('_', ' ') || 'DIRECT'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusPill status={row.status as ReservationStatusType} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(row);
          }}
          className="text-xs font-medium px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          Details
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* ───────────────────────────────────────────────────────────────────────
          Page Header & View Toggle
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reservations & Availability
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search real-time room availability, inspect the calendar timeline grid, and manage bookings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
              <span>Timeline Grid</span>
            </button>
          </div>

          <button
            onClick={() => {
              resetNewBookingForm();
              setIsNewDrawerOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-sm transition"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          Live Availability Search Bar (Accessible across both views)
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <Search className="w-4 h-4 text-emerald-600" />
            <span>Quick Availability Search</span>
          </div>
          {searchNights > 0 && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
              {searchNights} {searchNights === 1 ? 'Night' : 'Nights'} Selected
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Check-In */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Check-In Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={searchCheckIn}
                min={getTodayString()}
                onChange={(e) => {
                  setSearchCheckIn(e.target.value);
                  setAvailabilitySearched(true);
                }}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>

          {/* Check-Out */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Check-Out Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={searchCheckOut}
                min={searchCheckIn || getTodayString()}
                onChange={(e) => {
                  setSearchCheckOut(e.target.value);
                  setAvailabilitySearched(true);
                }}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>
          </div>

          {/* Room Type Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Room Type (Optional)
            </label>
            <select
              value={searchRoomTypeId}
              onChange={(e) => {
                setSearchRoomTypeId(e.target.value);
                setAvailabilitySearched(true);
              }}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            >
              <option value="">All Room Types</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} ({formatETB(rt.baseRate)}/night)
                </option>
              ))}
            </select>
          </div>

          {/* Search Trigger Button */}
          <div>
            <button
              type="button"
              onClick={() => {
                setAvailabilitySearched(true);
                refetchAvailability();
              }}
              disabled={!isSearchValid || isSearchingAvailability}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition disabled:opacity-50"
            >
              {isSearchingAvailability ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Check Availability</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Availability Results Grid */}
        {availabilitySearched && (
          <div className="pt-4 border-t border-slate-100">
            {isSearchingAvailability ? (
              <div className="py-8 text-center text-slate-400 text-sm animate-pulse">
                Checking availability across rooms...
              </div>
            ) : availableRooms.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <BedDouble className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  No rooms available for the selected dates
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try adjusting the check-in and check-out dates, or removing the room type filter.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Found{' '}
                    <strong className="text-slate-800">{availableRooms.length}</strong>{' '}
                    available {availableRooms.length === 1 ? 'room' : 'rooms'}
                  </span>
                  <span>Rates shown in Ethiopian Birr (ETB)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableRooms.map((room) => {
                    const baseRate = Number(room.roomType?.baseRate || 0);
                    const totalCost = searchNights * baseRate;

                    return (
                      <div
                        key={room.id}
                        className="bg-slate-50/60 hover:bg-emerald-50/30 border border-slate-200 hover:border-emerald-300 rounded-xl p-4 transition flex flex-col justify-between space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base text-slate-900">
                                Room {room.roomNumber}
                              </span>
                              <StatusPill status="AVAILABLE" size="sm" />
                            </div>
                            <p className="text-xs font-medium text-slate-600 mt-0.5">
                              {room.roomType?.name || 'Standard'}
                            </p>
                            {room.floor && (
                              <p className="text-xs text-slate-400">
                                Floor {room.floor.floorNumber}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-emerald-700">
                              {formatETB(baseRate)}
                            </span>
                            <span className="block text-[11px] text-slate-400">/ night</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-slate-500">Total ({searchNights} nts): </span>
                            <strong className="text-slate-800 font-semibold">
                              {formatETB(totalCost)}
                            </strong>
                          </div>
                          <button
                            onClick={() => handleOpenBookRoomFromSearch(room)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs shadow-sm transition"
                          >
                            <span>Book Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          MAIN VIEW: List View vs Timeline Grid
      ──────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'list' ? (
        /* ─── List View ─────────────────────────────────────────────────────── */
        <div className="space-y-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
            {STATUS_FILTERS.map((tab) => {
              const isActive = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    setStatusFilter(tab.value);
                    setPage(1);
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* DataTable */}
          <DataTable
            columns={columns}
            data={reservationsList}
            isLoading={isLoadingReservations}
            searchable
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search confirmation #, guest name, or phone..."
            onRowClick={handleRowClick}
            emptyTitle="No reservations found"
            emptyMessage="No reservations match the selected status filter or search query."
            pagination={{
              currentPage: page,
              totalPages: reservationsData?.pagination?.totalPages || 1,
              totalItems: reservationsData?.pagination?.total || reservationsList.length,
              pageSize,
              onPageChange: (newPage) => setPage(newPage),
            }}
          />
        </div>
      ) : (
        /* ─── Timeline Grid View ────────────────────────────────────────────── */
        <div className="space-y-4">
          {/* Timeline Controls & Navigation Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Left: Previous / Today / Next Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTimelinePrev}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                title="Previous window"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleTimelineToday}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition"
              >
                Today
              </button>
              <button
                onClick={handleTimelineNext}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                title="Next window"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="text-sm font-bold text-slate-900 ml-2">
                {timelineDays[0]?.monthName} {timelineDays[0]?.dayNum} –{' '}
                {timelineDays[timelineDays.length - 1]?.monthName}{' '}
                {timelineDays[timelineDays.length - 1]?.dayNum},{' '}
                {timelineDays[0]?.date.getFullYear()}
              </span>
            </div>

            {/* Right: Window Size (7/14 days) & Grouping */}
            <div className="flex items-center gap-3">
              {/* Group By selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium">
                <span className="text-slate-400 pl-1">Group:</span>
                <button
                  onClick={() => setTimelineGroupBy('floor')}
                  className={`px-2 py-1 rounded transition ${
                    timelineGroupBy === 'floor'
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Floor
                </button>
                <button
                  onClick={() => setTimelineGroupBy('roomType')}
                  className={`px-2 py-1 rounded transition ${
                    timelineGroupBy === 'roomType'
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Room Type
                </button>
              </div>

              {/* 7 or 14 Days window selector */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setTimelineWindowDays(7)}
                  className={`px-2.5 py-1 rounded transition ${
                    timelineWindowDays === 7
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setTimelineWindowDays(14)}
                  className={`px-2.5 py-1 rounded transition ${
                    timelineWindowDays === 14
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  14 Days
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Status Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-800">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-200 border border-amber-400" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-200 border border-blue-400" />
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-400" />
              <span>Checked In</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-300 border border-slate-400" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-200 border border-rose-400" />
              <span>Maintenance / Out of Service</span>
            </div>
            <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
              * Click empty cell to book; click reservation to view/edit.
            </span>
          </div>

          {/* The Horizontal Timeline Grid Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <div
                className="min-w-[950px]"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `220px repeat(${timelineWindowDays}, minmax(65px, 1fr))`,
                }}
              >
                {/* Header: Room Column Label */}
                <div className="sticky left-0 z-30 bg-slate-100/95 backdrop-blur-sm p-3.5 border-b border-r border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Room / Unit</span>
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Header: Date Columns */}
                {timelineDays.map((day) => (
                  <div
                    key={day.iso}
                    className={`p-2.5 text-center border-b border-r border-slate-200 flex flex-col items-center justify-center transition ${
                      day.isToday
                        ? 'bg-emerald-50/80 font-bold text-emerald-900'
                        : day.isWeekend
                        ? 'bg-slate-50/90 text-slate-700'
                        : 'bg-white text-slate-700'
                    }`}
                  >
                    <span className="text-[11px] font-semibold uppercase">{day.dayName}</span>
                    <span
                      className={`text-sm mt-0.5 w-6 h-6 flex items-center justify-center rounded-full ${
                        day.isToday ? 'bg-emerald-600 text-white font-bold' : 'font-medium'
                      }`}
                    >
                      {day.dayNum}
                    </span>
                    <span className="text-[10px] text-slate-400">{day.monthName}</span>
                  </div>
                ))}

                {/* Loading State */}
                {(isLoadingRooms || isLoadingTimelineRes) && (
                  <div
                    style={{ gridColumn: `1 / span ${timelineWindowDays + 1}` }}
                    className="p-12 text-center text-slate-400 text-sm animate-pulse"
                  >
                    Loading timeline occupancy grid...
                  </div>
                )}

                {/* Body Rows Grouped */}
                {!isLoadingRooms &&
                  !isLoadingTimelineRes &&
                  groupedRooms.map((group) => (
                    <React.Fragment key={group.label}>
                      {/* Group Header Row */}
                      <div
                        style={{ gridColumn: `1 / span ${timelineWindowDays + 1}` }}
                        className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 sticky left-0 z-20"
                      >
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>{group.label}</span>
                        <span className="text-slate-400 text-[11px] font-normal lowercase">
                          ({group.rooms.length} {group.rooms.length === 1 ? 'room' : 'rooms'})
                        </span>
                      </div>

                      {/* Rooms inside Group */}
                      {group.rooms.map((room) => {
                        const isUnderMaintenance =
                          room.status === 'MAINTENANCE' || room.status === 'OUT_OF_SERVICE';

                        // Get reservations for this room that fall inside this window
                        const roomReservations = timelineReservations.filter((r) => {
                          if (r.roomId !== room.id) return false;
                          if (r.status === 'CANCELLED' || r.status === 'NO_SHOW') return false;
                          const rStart = new Date(r.checkInDate).getTime();
                          const rEnd = new Date(r.checkOutDate).getTime();
                          const winStart = timelineStartDate.getTime();
                          const winEnd =
                            winStart + timelineWindowDays * 24 * 60 * 60 * 1000;
                          return rStart < winEnd && rEnd > winStart;
                        });

                        return (
                          <React.Fragment key={room.id}>
                            {/* Sticky Left Room Card */}
                            <div className="sticky left-0 z-20 bg-white p-3 border-b border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.04)] flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-sm text-slate-900">
                                    Room {room.roomNumber}
                                  </span>
                                  {isUnderMaintenance && (
                                    <span
                                      className="p-1 rounded text-rose-600 bg-rose-50"
                                      title={room.status}
                                    >
                                      {room.status === 'MAINTENANCE' ? (
                                        <Wrench className="w-3 h-3" />
                                      ) : (
                                        <Ban className="w-3 h-3" />
                                      )}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-500 block truncate max-w-[130px]">
                                  {room.roomType?.name || 'Standard'}
                                </span>
                              </div>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                Fl. {room.floor?.floorNumber ?? 1}
                              </span>
                            </div>

                            {/* Date Track Container spanning the remaining window columns */}
                            <div
                              style={{
                                gridColumn: `2 / span ${timelineWindowDays}`,
                                display: 'grid',
                                gridTemplateColumns: `repeat(${timelineWindowDays}, minmax(0, 1fr))`,
                              }}
                              className="relative h-14 border-b border-slate-200 bg-white"
                            >
                              {/* Background Clickable Day Slots */}
                              {timelineDays.map((day) => (
                                <button
                                  key={day.iso}
                                  type="button"
                                  onClick={() => handleTimelineCellClick(room, day.iso)}
                                  disabled={isUnderMaintenance}
                                  className={`h-full border-r border-slate-100 transition group flex items-center justify-center ${
                                    isUnderMaintenance
                                      ? 'bg-rose-50/40 cursor-not-allowed'
                                      : day.isWeekend
                                      ? 'bg-slate-50/40 hover:bg-emerald-50/70 cursor-pointer'
                                      : 'hover:bg-emerald-50/70 cursor-pointer'
                                  }`}
                                  title={
                                    isUnderMaintenance
                                      ? `Room ${room.roomNumber} is in ${room.status}`
                                      : `Click to book Room ${room.roomNumber} on ${day.iso}`
                                  }
                                >
                                  {!isUnderMaintenance && (
                                    <span className="opacity-0 group-hover:opacity-100 text-emerald-600 font-bold text-xs transition">
                                      +
                                    </span>
                                  )}
                                </button>
                              ))}

                              {/* Shaded Indicator for Maintenance / Out of Service */}
                              {isUnderMaintenance && (
                                <div className="absolute inset-0 bg-rose-50/75 border-y border-dashed border-rose-200 flex items-center justify-center pointer-events-none z-10">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100/90 px-2.5 py-0.5 rounded shadow-sm flex items-center gap-1.5">
                                    <Wrench className="w-3 h-3" />
                                    <span>
                                      {room.status === 'MAINTENANCE'
                                        ? 'Under Maintenance'
                                        : 'Out of Service'}
                                    </span>
                                  </span>
                                </div>
                              )}

                              {/* Overlay Layer for Reservation Bars */}
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: `repeat(${timelineWindowDays}, minmax(0, 1fr))`,
                                }}
                                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                              >
                                {roomReservations.map((res) => {
                                  const DAY_MS = 24 * 60 * 60 * 1000;
                                  const rCheckIn = new Date(res.checkInDate).getTime();
                                  const rCheckOut = new Date(res.checkOutDate).getTime();
                                  const winStart = timelineStartDate.getTime();

                                  // Calculate column start and end (1-based for CSS Grid)
                                  const startCol = Math.max(
                                    1,
                                    Math.floor((rCheckIn - winStart) / DAY_MS) + 1
                                  );
                                  const endCol = Math.min(
                                    timelineWindowDays + 1,
                                    Math.ceil((rCheckOut - winStart) / DAY_MS) + 1
                                  );

                                  if (endCol <= startCol || startCol > timelineWindowDays) {
                                    return null;
                                  }

                                  const guestName = res.reservationGuests?.[0]?.guest
                                    ? `${res.reservationGuests[0].guest.firstName} ${res.reservationGuests[0].guest.lastName}`
                                    : 'Guest';

                                  const barStyle =
                                    STATUS_BAR_STYLES[res.status] || STATUS_BAR_STYLES.CONFIRMED;

                                  return (
                                    <div
                                      key={res.id}
                                      style={{
                                        gridColumnStart: startCol,
                                        gridColumnEnd: endCol,
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRowClick(res);
                                      }}
                                      className={`pointer-events-auto my-1.5 mx-0.5 rounded-lg px-2 border flex items-center justify-between text-xs font-semibold shadow-sm cursor-pointer transition hover:scale-[1.01] hover:shadow-md ${barStyle.bg} ${barStyle.border} ${barStyle.text}`}
                                      title={`Booking #${res.confirmationNumber} • ${guestName} (${res.status})\n${res.checkInDate.split('T')[0]} → ${res.checkOutDate.split('T')[0]}`}
                                    >
                                      <div className="truncate flex items-center gap-1.5">
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${barStyle.dot}`}
                                        />
                                        <span className="truncate">{guestName}</span>
                                      </div>
                                      <span className="text-[10px] opacity-75 shrink-0 ml-1 font-mono">
                                        #{res.confirmationNumber.slice(-4)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          New Reservation SlideOverDrawer
      ──────────────────────────────────────────────────────────────────────── */}
      <SlideOverDrawer
        isOpen={isNewDrawerOpen}
        onClose={() => setIsNewDrawerOpen(false)}
        title="New Reservation"
        description="Create a booking for an existing guest or register a walk-in guest inline."
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-slate-500">
              Est. Total:{' '}
              <strong className="text-slate-800 text-sm font-bold">
                {formatETB(estimatedTotalCost)}
              </strong>{' '}
              ({bookingNights} {bookingNights === 1 ? 'night' : 'nights'})
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsNewDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => createReservationMutation.mutate()}
                disabled={createReservationMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 transition inline-flex items-center gap-1.5"
              >
                {createReservationMutation.isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Create</span>
                  </>
                )}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Guest Selection Mode Toggle */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Guest Profile
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setBookingGuestMode('existing')}
                className={`py-1.5 rounded-md transition ${
                  bookingGuestMode === 'existing'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Select Existing Guest
              </button>
              <button
                type="button"
                onClick={() => setBookingGuestMode('walkin')}
                className={`py-1.5 rounded-md transition ${
                  bookingGuestMode === 'walkin'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Walk-In Guest (Inline)
              </button>
            </div>
          </div>

          {/* Existing Guest Search Mode */}
          {bookingGuestMode === 'existing' ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search guest by name, phone, or passport..."
                  value={guestSearchInput}
                  onChange={(e) => setGuestSearchInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>

              {selectedGuest ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {selectedGuest.firstName[0]}
                      {selectedGuest.lastName[0]}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-900 block">
                        {selectedGuest.firstName} {selectedGuest.lastName}
                      </span>
                      <span className="text-xs text-slate-500">
                        {selectedGuest.phone} {selectedGuest.email ? `• ${selectedGuest.email}` : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedGuest(null)}
                    className="text-xs text-rose-600 hover:underline font-medium"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {(guestsSearchData?.guests || []).length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No guests found. Type to search or switch to walk-in guest.
                    </div>
                  ) : (
                    (guestsSearchData?.guests || []).map((guest) => (
                      <div
                        key={guest.id}
                        onClick={() => setSelectedGuest(guest)}
                        className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {guest.firstName} {guest.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{guest.phone}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          Select
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Inline Walk-In Guest Creation Form */
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-700 block">
                Quick Walk-In Guest Registration
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">First Name *</label>
                  <input
                    type="text"
                    required
                    value={walkinFirstName}
                    onChange={(e) => setWalkinFirstName(e.target.value)}
                    placeholder="e.g. Almaz"
                    className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={walkinLastName}
                    onChange={(e) => setWalkinLastName(e.target.value)}
                    placeholder="e.g. Ayana"
                    className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={walkinPhone}
                    onChange={(e) => setWalkinPhone(e.target.value)}
                    placeholder="+251..."
                    className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={walkinEmail}
                    onChange={(e) => setWalkinEmail(e.target.value)}
                    placeholder="guest@mail.com"
                    className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">ID Type</label>
                  <select
                    value={walkinIdType}
                    onChange={(e) => setWalkinIdType(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="NATIONAL_ID">National ID / Fayda</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="DRIVING_LICENSE">Driving License</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">ID Number</label>
                  <input
                    type="text"
                    value={walkinIdNumber}
                    onChange={(e) => setWalkinIdNumber(e.target.value)}
                    placeholder="ID Number"
                    className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stay Dates */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Dates & Duration
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Check-In *</label>
                <input
                  type="date"
                  required
                  value={bookingCheckIn}
                  min={getTodayString()}
                  onChange={(e) => setBookingCheckIn(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Check-Out *</label>
                <input
                  type="date"
                  required
                  value={bookingCheckOut}
                  min={bookingCheckIn || getTodayString()}
                  onChange={(e) => setBookingCheckOut(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Room Type & Room Assignment */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Room & Pricing
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Room Type *</label>
                <select
                  required
                  value={bookingRoomTypeId}
                  onChange={(e) => {
                    setBookingRoomTypeId(e.target.value);
                    setBookingRoomId('');
                  }}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="">Select Room Type</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} ({formatETB(rt.baseRate)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600">
                  Specific Room (Optional)
                </label>
                <select
                  value={bookingRoomId}
                  onChange={(e) => setBookingRoomId(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="">Auto-Assign on Booking</option>
                  {bookingAvailableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.roomType?.name || 'Available'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rate Plan & Source */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">
                  Rate Plan (Optional)
                </label>
                <select
                  value={bookingRatePlanId}
                  onChange={(e) => setBookingRatePlanId(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="">Standard Base Rate</option>
                  {ratePlans.map((rp) => (
                    <option key={rp.id} value={rp.id}>
                      {rp.name} ({formatETB(rp.rate)}/nt)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600">Booking Source</label>
                <select
                  value={bookingSource}
                  onChange={(e) => setBookingSource(e.target.value as ReservationSource)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:border-emerald-600"
                >
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Adults & Children */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Adults</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={bookingAdults}
                  onChange={(e) => setBookingAdults(Number(e.target.value) || 1)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Children</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={bookingChildren}
                  onChange={(e) => setBookingChildren(Number(e.target.value) || 0)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600">
                Special Requests / Notes
              </label>
              <textarea
                rows={3}
                value={bookingSpecialRequests}
                onChange={(e) => setBookingSpecialRequests(e.target.value)}
                placeholder="High floor, quiet room, late check-in..."
                className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>
      </SlideOverDrawer>

      {/* ───────────────────────────────────────────────────────────────────────
          Reservation Details & Action SlideOverDrawer
      ──────────────────────────────────────────────────────────────────────── */}
      <SlideOverDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setIsModifyMode(false);
        }}
        title={
          <div className="flex items-center gap-2">
            <span>Reservation #{selectedReservation?.confirmationNumber}</span>
          </div>
        }
        description={`Status: ${selectedReservation?.status || 'PENDING'}`}
        size="lg"
        footer={
          selectedReservation && (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {/* Cancel Action (only if PENDING or CONFIRMED) */}
                {['PENDING', 'CONFIRMED'].includes(selectedReservation.status) && (
                  <button
                    type="button"
                    onClick={() => setIsCancelConfirmOpen(true)}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isModifyMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsModifyMode(false)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={() => modifyMutation.mutate()}
                      disabled={modifyMutation.isPending}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50"
                    >
                      {modifyMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Confirm Button (only if PENDING) */}
                    {selectedReservation.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => confirmMutation.mutate(selectedReservation.id)}
                        disabled={confirmMutation.isPending}
                        className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-50"
                      >
                        {confirmMutation.isPending ? 'Confirming...' : 'Confirm Reservation'}
                      </button>
                    )}

                    {/* Modify Button (only if PENDING or CONFIRMED) */}
                    {['PENDING', 'CONFIRMED'].includes(selectedReservation.status) && (
                      <button
                        type="button"
                        onClick={() => setIsModifyMode(true)}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition inline-flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modify</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        }
      >
        {selectedReservation && (
          <div className="space-y-6">
            {/* Top Status & Summary Banner */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block font-semibold">
                  Reservation Status
                </span>
                <div className="mt-1">
                  <StatusPill status={selectedReservation.status as ReservationStatusType} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 uppercase tracking-wider block font-semibold">
                  Total Bill
                </span>
                <span className="text-lg font-bold text-slate-900">
                  {formatETB(selectedReservation.totalAmount)}
                </span>
              </div>
            </div>

            {/* Read-Only View vs Inline Modify Form */}
            {isModifyMode ? (
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
                  <Edit3 className="w-4 h-4" />
                  <span>Modify Stay Dates & Room</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Check-In</label>
                    <input
                      type="date"
                      value={modifyCheckIn}
                      onChange={(e) => setModifyCheckIn(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700">Check-Out</label>
                    <input
                      type="date"
                      value={modifyCheckOut}
                      onChange={(e) => setModifyCheckOut(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700">
                    Change Room Assignment
                  </label>
                  <select
                    value={modifyRoomId}
                    onChange={(e) => setModifyRoomId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white"
                  >
                    <option value="">Keep current / Auto-assign</option>
                    {modifyAvailableRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.roomNumber} ({r.roomType?.name || 'Available'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700">
                    Special Requests
                  </label>
                  <textarea
                    rows={2}
                    value={modifySpecialRequests}
                    onChange={(e) => setModifySpecialRequests(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white"
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Guest Profile Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Primary Guest Information
                  </h3>
                  {selectedReservation.reservationGuests?.[0]?.guest ? (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                      <p className="font-semibold text-slate-900 text-sm">
                        {selectedReservation.reservationGuests[0].guest.firstName}{' '}
                        {selectedReservation.reservationGuests[0].guest.lastName}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {selectedReservation.reservationGuests[0].guest.phone}
                        </span>
                        {selectedReservation.reservationGuests[0].guest.email && (
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {selectedReservation.reservationGuests[0].guest.email}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No guest attached to this reservation.</p>
                  )}
                </div>

                {/* Stay & Room Details */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Stay Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block">Check-In</span>
                      <strong className="text-slate-800">
                        {formatDate(selectedReservation.checkInDate)}
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block">Check-Out</span>
                      <strong className="text-slate-800">
                        {formatDate(selectedReservation.checkOutDate)}
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block">Assigned Room</span>
                      <strong className="text-slate-800">
                        {selectedReservation.room
                          ? `Room ${selectedReservation.room.roomNumber}`
                          : 'Not assigned'}
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block">Room Type</span>
                      <strong className="text-slate-800">
                        {selectedReservation.roomType?.name || 'Standard'}
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block">Guests</span>
                      <strong className="text-slate-800">
                        {selectedReservation.adults} Adults
                        {selectedReservation.children ? `, ${selectedReservation.children} Children` : ''}
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 block">Booking Source</span>
                      <strong className="text-slate-800">
                        {selectedReservation.source}
                      </strong>
                    </div>
                  </div>

                  {selectedReservation.specialRequests && (
                    <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                      <span className="text-slate-400 block font-medium">Special Requests</span>
                      <p className="text-slate-700 italic">
                        &ldquo;{selectedReservation.specialRequests}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {/* Checked In / Policy notice */}
                {selectedReservation.status === 'CHECKED_IN' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span>
                      Guest is actively checked in. Modifications and cancellations are blocked
                      while in-house per standard hotel policy.
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </SlideOverDrawer>

      {/* ───────────────────────────────────────────────────────────────────────
          Cancellation Confirm Dialog
      ──────────────────────────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={() => {
          if (selectedReservation) {
            cancelMutation.mutate(selectedReservation.id);
          }
        }}
        title="Cancel Reservation"
        message={
          <div>
            <p>
              Are you sure you want to cancel booking{' '}
              <strong className="font-semibold text-slate-800">
                #{selectedReservation?.confirmationNumber}
              </strong>
              ?
            </p>
            <p className="mt-1 text-xs text-slate-500">
              This will release the assigned room back into available inventory immediately and
              record an audit entry.
            </p>
          </div>
        }
        confirmText="Yes, Cancel Booking"
        cancelText="Keep Booking"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}
