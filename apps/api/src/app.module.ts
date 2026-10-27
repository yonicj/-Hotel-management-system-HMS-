import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

// Core modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { RoomTypesModule } from './modules/room-types/room-types.module';
import { GuestsModule } from './modules/guests/guests.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { StaysModule } from './modules/stays/stays.module';
import { FoliosModule } from './modules/folios/folios.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { HousekeepingModule } from './modules/housekeeping/housekeeping.module';
import { PosModule } from './modules/pos/pos.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SyncModule } from './modules/sync/sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    PropertiesModule,
    RoomsModule,
    RoomTypesModule,
    GuestsModule,
    ReservationsModule,
    StaysModule,
    FoliosModule,
    PaymentsModule,
    HousekeepingModule,
    PosModule,
    InventoryModule,
    ReportsModule,
    SyncModule,
  ],
})
export class AppModule {}
