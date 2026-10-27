export const reservationService = {
  async getReservations() {
    return [];
  },
  async createReservation(data: any) {
    return { id: 'res-new', ...data };
  }
};
