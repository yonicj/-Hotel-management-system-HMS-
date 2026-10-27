import { Injectable } from '@nestjs/common';

@Injectable()
export class ChapaService {
  async initializeTransaction(txRef: string, amount: number, email: string) {
    return {
      status: 'success',
      checkoutUrl: `https://checkout.chapa.co/checkout/payment/${txRef}`,
      txRef,
    };
  }
}
