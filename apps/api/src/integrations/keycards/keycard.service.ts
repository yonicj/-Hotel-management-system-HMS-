import { Injectable } from '@nestjs/common';

@Injectable()
export class KeycardEncoderService {
  async encodeCard(roomNumber: string, validUntil: string) {
    return {
      success: true,
      cardUid: `RFID-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      roomNumber,
      validUntil,
    };
  }
}
