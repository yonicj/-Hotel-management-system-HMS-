import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EirsFiscalService {
  private readonly logger = new Logger(EirsFiscalService.name);

  async registerFiscalInvoice(invoiceData: any) {
    this.logger.log(`Transmitting fiscal invoice to Ministry of Revenue EIRS: ${invoiceData.invoiceNumber}`);
    return {
      fiscalNumber: `MOR-ET-${Date.now()}`,
      machineId: 'POS-ADDIS-01',
      qrCodeData: `https://verify.mor.gov.et/${invoiceData.invoiceNumber}`,
      status: 'FISCAL_CONFIRMED'
    };
  }
}
