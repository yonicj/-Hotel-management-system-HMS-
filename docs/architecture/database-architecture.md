# Database Architecture

The central PostgreSQL schema is structured across clear domain boundaries:
1. **Identity**: Users, Roles, Permissions, UserProperties
2. **Hotel**: Organizations, Properties, Buildings, Floors, RoomTypes, Rooms, Amenities
3. **Guest**: Guests, GuestDocuments, CorporateAccounts
4. **Reservation**: Reservations, ReservationRooms, GroupBookings, ReservationHolds, Stays
5. **Rates**: RatePlans, RateRules, SeasonalRates, Promotions
6. **Finance**: Folios, FolioItems, Deposits, Payments, PaymentAttempts, Invoices, TaxRules, CashierShifts
7. **Operations**: HousekeepingTasks, MaintenanceWorkOrders, LostFoundItems
8. **POS**: Outlets, Tables, MenuCategories, MenuItems, PosOrders, KitchenTickets
9. **Inventory**: InventoryItems, Stores, StockMovements, Suppliers, PurchaseOrders
10. **System**: AuditLogs, Devices, SyncEvents, Notifications
