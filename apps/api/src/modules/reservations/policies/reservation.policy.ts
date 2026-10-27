export class ReservationPolicy {
  static canModify(user: any, reservation: any): boolean {
    if (user.role === 'SUPER_ADMIN' || user.role === 'HOTEL_MANAGER') return true;
    return reservation.status !== 'CHECKED_OUT';
  }
}
