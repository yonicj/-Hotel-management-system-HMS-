import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';

describe('Guest Management Integration Flow (Register, Search, ID Record, Optional Email)', () => {
  let receptionistToken: string;
  let guestNoEmailId1: string;
  let guestNoEmailId2: string;
  let guestWithEmailId: string;

  const uniqueSuffix = Date.now().toString().slice(-6);
  const passportNumber = `EP${uniqueSuffix}`;
  const faydaNumber = `FAYDA-${uniqueSuffix}`;
  const guestEmail = `athlete.${uniqueSuffix}@athletics.org`;

  beforeAll(async () => {
    // 1. Authenticate as Receptionist
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'receptionist@grandhotel.com', password: 'Admin@1234' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    receptionistToken = loginRes.body.data.accessToken;
    expect(receptionistToken).toBeDefined();
  });

  afterAll(async () => {
    // Cleanup test guests
    const ids = [guestNoEmailId1, guestNoEmailId2, guestWithEmailId].filter(Boolean);
    if (ids.length > 0) {
      await prisma.reservationGuest.deleteMany({ where: { guestId: { in: ids } } });
      await prisma.guest.deleteMany({ where: { id: { in: ids } } });
    }
  });

  it('Step 1: Receptionist registers a walk-in guest without an email address', async () => {
    const res = await request(app)
      .post('/api/guests')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        firstName: 'Tewodros',
        lastName: `Kassahun-${uniqueSuffix}`,
        phone: `+251911${uniqueSuffix}`,
        idType: 'PASSPORT',
        idNumber: passportNumber,
        nationality: 'Ethiopian',
        vipLevel: 'GOLD',
        notes: 'Walk-in guest requesting quiet top floor room',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const guest = res.body.data;
    expect(guest.id).toBeDefined();
    expect(guest.firstName).toBe('Tewodros');
    expect(guest.email).toBeNull();
    expect(guest.idType).toBe('PASSPORT');
    expect(guest.idNumber).toBe(passportNumber);
    expect(guest.vipLevel).toBe('GOLD');
    guestNoEmailId1 = guest.id;
  });

  it('Step 2: Receptionist registers a second guest also without email without uniqueness collisions', async () => {
    const res = await request(app)
      .post('/api/guests')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        firstName: 'Aster',
        lastName: `Aweke-${uniqueSuffix}`,
        phone: `+251922${uniqueSuffix}`,
        email: null, // explicit null
        idType: 'NATIONAL_ID',
        idNumber: faydaNumber,
        nationality: 'Ethiopian',
        vipLevel: 'PLATINUM',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const guest = res.body.data;
    expect(guest.id).toBeDefined();
    expect(guest.firstName).toBe('Aster');
    expect(guest.email).toBeNull();
    expect(guest.idType).toBe('NATIONAL_ID');
    expect(guest.vipLevel).toBe('PLATINUM');
    guestNoEmailId2 = guest.id;
  });

  it('Step 3: Fast debounced search looks up guest immediately by name', async () => {
    const searchRes = await request(app)
      .get('/api/guests')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .query({ search: `Kassahun-${uniqueSuffix}` });

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.success).toBe(true);
    expect(searchRes.body.data).toBeInstanceOf(Array);
    expect(searchRes.body.data.length).toBeGreaterThanOrEqual(1);

    const found = searchRes.body.data.find((g: any) => g.id === guestNoEmailId1);
    expect(found).toBeDefined();
    expect(found.firstName).toBe('Tewodros');
    expect(found.vipLevel).toBe('GOLD');
  });

  it('Step 4: Search looks up guest immediately by passport ID number', async () => {
    const searchRes = await request(app)
      .get('/api/guests')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .query({ search: passportNumber });

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.success).toBe(true);
    expect(searchRes.body.data.length).toBeGreaterThanOrEqual(1);

    const found = searchRes.body.data.find((g: any) => g.idNumber === passportNumber);
    expect(found).toBeDefined();
    expect(found.id).toBe(guestNoEmailId1);
  });

  it('Step 5: Search looks up guest immediately by National ID (Fayda) number', async () => {
    const searchRes = await request(app)
      .get('/api/guests')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .query({ search: faydaNumber });

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.success).toBe(true);
    expect(searchRes.body.data.length).toBeGreaterThanOrEqual(1);

    const found = searchRes.body.data.find((g: any) => g.idNumber === faydaNumber);
    expect(found).toBeDefined();
    expect(found.id).toBe(guestNoEmailId2);
  });

  it('Step 6: Registers guest with email and enforces uniqueness constraint against duplicates', async () => {
    // 1. Successful creation with email
    const createRes = await request(app)
      .post('/api/guests')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        firstName: 'Derartu',
        lastName: `Tulu-${uniqueSuffix}`,
        email: guestEmail,
        phone: `+251933${uniqueSuffix}`,
        nationality: 'Ethiopian',
        vipLevel: 'PLATINUM',
      });

    expect(createRes.status).toBe(201);
    guestWithEmailId = createRes.body.data.id;

    // 2. Duplicate email rejected with 409
    const dupRes = await request(app)
      .post('/api/guests')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        firstName: 'Duplicate',
        lastName: 'EmailUser',
        email: guestEmail,
        phone: '+251944000000',
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.error).toBeDefined();
  });

  it('Step 7: Updates guest profile with new notes and address', async () => {
    const updateRes = await request(app)
      .put(`/api/guests/${guestNoEmailId1}`)
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        address: 'Bole Subcity, House 450, Addis Ababa',
        notes: 'VIP guest - complimentary sparkling water and fruit basket upon arrival',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.address).toBe('Bole Subcity, House 450, Addis Ababa');
    expect(updateRes.body.data.notes).toContain('VIP guest');
  });

  it('Step 8: Retrieves complete guest profile with ID record and reservation structure', async () => {
    const getRes = await request(app)
      .get(`/api/guests/${guestNoEmailId1}`)
      .set('Authorization', `Bearer ${receptionistToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    const guest = getRes.body.data;
    expect(guest.id).toBe(guestNoEmailId1);
    expect(guest.idType).toBe('PASSPORT');
    expect(guest.idNumber).toBe(passportNumber);
    expect(guest.reservationGuests).toBeInstanceOf(Array);
  });
});
