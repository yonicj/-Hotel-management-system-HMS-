import { Injectable } from '@nestjs/common';

@Injectable()
export class TelebirrService {
  async initiatePayment(orderId: string, amount: number, title: string) {
    return {
      success: true,
      checkoutUrl: `https://app.ethiomobilemoney.et:2121/gateway?order=${orderId}`,
      orderId,
    };
  }

  async verifyWebhook(payload: any) {
    return { verified: true, payload };
  }
}
