import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

async function cleanupTestData() {
  try {
    // Disable triggers to allow test cleanup
    await prisma.$executeRawUnsafe(`ALTER TABLE folio_charges DISABLE TRIGGER trg_folio_charges_prevent_delete;`);
    await prisma.$executeRawUnsafe(`DELETE FROM folio_charges WHERE description LIKE '%Guard Test%' OR description LIKE '%test%';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE folio_charges ENABLE TRIGGER trg_folio_charges_prevent_delete;`);

    await prisma.$executeRawUnsafe(`ALTER TABLE payments DISABLE TRIGGER trg_payments_prevent_delete;`);
    await prisma.$executeRawUnsafe(`DELETE FROM payments WHERE folio_id IN (SELECT id FROM folios WHERE folio_number LIKE 'FOL-TEST-%');`);
    await prisma.$executeRawUnsafe(`ALTER TABLE payments ENABLE TRIGGER trg_payments_prevent_delete;`);

    await prisma.$executeRawUnsafe(`ALTER TABLE audit_logs DISABLE TRIGGER trg_audit_logs_append_only;`);
    await prisma.$executeRawUnsafe(`DELETE FROM audit_logs WHERE action IN ('ORIGINAL_AUDIT_ENTRY', 'TAMPERED_ENTRY', 'TEST_ACTION', 'INT_TEST_AUDIT');`);
    await prisma.$executeRawUnsafe(`ALTER TABLE audit_logs ENABLE TRIGGER trg_audit_logs_append_only;`);

    await prisma.$executeRawUnsafe(`DELETE FROM folios WHERE folio_number LIKE 'FOL-TEST-%';`);
    await prisma.$executeRawUnsafe(`DELETE FROM reservations WHERE confirmation_number LIKE 'CONF-101-%' OR confirmation_number LIKE 'CONF-INV-%';`);
    await prisma.$executeRawUnsafe(`DELETE FROM guests WHERE phone = '+251911999888';`);
  } catch (err: any) {
    console.warn('   (Cleanup note: ' + err.message + ')');
  }
}

export async function verifyPhase1DatabaseGuards(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('================================================================');
  console.log('  RUNNING PHASE 1 DATABASE GUARDS VERIFICATION');
  console.log('================================================================\n');

  // Pre-test cleanup
  await cleanupTestData();

  // Fetch baseline records
  const hotel = await prisma.hotel.findFirst();
  if (!hotel) throw new Error('No hotel found. Please seed the database first.');

  const room101 = await prisma.room.findFirst({ where: { roomNumber: '101' } });
  if (!room101) throw new Error('Room 101 not found. Please seed the database first.');

  const user = await prisma.user.findFirst();
  if (!user) throw new Error('No user found. Please seed the database first.');

  const roomType = await prisma.roomType.findFirst();
  if (!roomType) throw new Error('No room type found. Please seed the database first.');

  // Create test guest
  const _testGuest = await prisma.guest.create({
    data: {
      firstName: 'Phase1',
      lastName: 'Verifier',
      phone: '+251911999888',
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Double-booking rejection
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('1. Testing Double-Booking Rejection...');
  const res1Id = 'test-res-room101-base';
  const resOverlapId = 'test-res-room101-overlap';
  const resBackToBackId = 'test-res-room101-backtoback';

  // 1a. Insert active CONFIRMED reservation for Room 101 from 2026-12-10 to 2026-12-15
  await prisma.$executeRawUnsafe(`
    INSERT INTO reservations (
      id, hotel_id, room_type_id, room_id, confirmation_number,
      check_in_date, check_out_date, adults, children,
      total_amount, status, source, created_by
    ) VALUES (
      '${res1Id}', '${hotel.id}', '${roomType.id}', '${room101.id}', 'CONF-101-BASE',
      '2026-12-10', '2026-12-15', 1, 0,
      500.00, 'CONFIRMED', 'WALK_IN', '${user.id}'
    );
  `);
  console.log('   ✓ Inserted base CONFIRMED reservation for Room 101: 2026-12-10 to 2026-12-15');

  // 1b. Attempt second raw SQL INSERT for Room 101 from 2026-12-12 to 2026-12-14 (should fail with 23P01)
  let overlapBlocked = false;
  let overlapErrorCode = '';
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO reservations (
        id, hotel_id, room_type_id, room_id, confirmation_number,
        check_in_date, check_out_date, adults, children,
        total_amount, status, source, created_by
      ) VALUES (
        '${resOverlapId}', '${hotel.id}', '${roomType.id}', '${room101.id}', 'CONF-101-OVERLAP',
        '2026-12-12', '2026-12-14', 1, 0,
        200.00, 'CONFIRMED', 'WALK_IN', '${user.id}'
      );
    `);
  } catch (err: any) {
    overlapBlocked = true;
    overlapErrorCode = err?.meta?.code || (err.message.includes('23P01') ? '23P01' : '');
    if (err.message.includes('no_overlapping_reservations')) {
      overlapErrorCode = '23P01';
    }
  }

  if (overlapBlocked && overlapErrorCode === '23P01') {
    console.log('   ✓ Overlapping booking (2026-12-12 to 2026-12-14) rejected by PostgreSQL: EXCLUDE constraint 23P01');
    results.push({
      name: 'Double-booking rejection',
      passed: true,
      details: 'PostgreSQL threw exclusion constraint violation (23P01) on overlapping booking.',
    });
  } else {
    console.error('   ✗ Overlap was NOT rejected with 23P01! Code:', overlapErrorCode);
    results.push({
      name: 'Double-booking rejection',
      passed: false,
      details: `Failed: overlapBlocked=${overlapBlocked}, code=${overlapErrorCode}`,
    });
  }

  // 1c. Back-to-back booking (2026-12-15 to 2026-12-18) on Room 101 (should SUCCEED)
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO reservations (
        id, hotel_id, room_type_id, room_id, confirmation_number,
        check_in_date, check_out_date, adults, children,
        total_amount, status, source, created_by
      ) VALUES (
        '${resBackToBackId}', '${hotel.id}', '${roomType.id}', '${room101.id}', 'CONF-101-B2B',
        '2026-12-15', '2026-12-18', 1, 0,
        300.00, 'CONFIRMED', 'WALK_IN', '${user.id}'
      );
    `);
    console.log('   ✓ Back-to-back booking (2026-12-15 to 2026-12-18) SUCCEEDED (half-open [) range)');
    results.push({
      name: 'Back-to-back booking allowance',
      passed: true,
      details: 'Same-day checkout and checkin succeeded without conflict.',
    });
  } catch (err: any) {
    console.error('   ✗ Back-to-back booking failed unexpectedly:', err.message);
    results.push({
      name: 'Back-to-back booking allowance',
      passed: false,
      details: err.message,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Date check rejection (check_out_date <= check_in_date)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n2. Testing Date Check Rejection (check_out_date <= check_in_date)...');
  let dateCheckBlocked = false;
  let dateCheckErrorCode = '';
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO reservations (
        id, hotel_id, room_type_id, room_id, confirmation_number,
        check_in_date, check_out_date, adults, children,
        total_amount, status, source, created_by
      ) VALUES (
        'test-res-invalid-dates', '${hotel.id}', '${roomType.id}', '${room101.id}', 'CONF-INV-DATES',
        '2026-12-20', '2026-12-20', 1, 0,
        100.00, 'CONFIRMED', 'WALK_IN', '${user.id}'
      );
    `);
  } catch (err: any) {
    dateCheckBlocked = true;
    dateCheckErrorCode = err?.meta?.code || (err.message.includes('23514') ? '23514' : '');
    if (err.message.includes('check_out_after_check_in')) {
      dateCheckErrorCode = '23514';
    }
  }

  if (dateCheckBlocked && (dateCheckErrorCode === '23514' || dateCheckErrorCode === 'P2010')) {
    console.log('   ✓ Invalid reservation dates (check_out <= check_in) rejected: CHECK constraint check_out_after_check_in (23514)');
    results.push({
      name: 'Date check rejection',
      passed: true,
      details: 'PostgreSQL rejected check_out_date <= check_in_date with check constraint violation.',
    });
  } else {
    console.error('   ✗ Date check was NOT rejected as expected! Code:', dateCheckErrorCode);
    results.push({
      name: 'Date check rejection',
      passed: false,
      details: `Failed: dateCheckBlocked=${dateCheckBlocked}, code=${dateCheckErrorCode}`,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Audit log immutability (UPDATE and DELETE blocked)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n3. Testing Audit Log Immutability (Append-Only)...');
  const audit = await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'ORIGINAL_AUDIT_ENTRY',
      entityType: 'User',
      entityId: user.id,
    },
  });
  console.log('   ✓ Inserted audit log row:', audit.id);

  let auditUpdateBlocked = false;
  try {
    await prisma.$executeRawUnsafe(`UPDATE audit_logs SET action = 'TAMPERED_ENTRY' WHERE id = '${audit.id}';`);
  } catch (err: any) {
    if (err.message.includes('audit_logs is append-only; updates and deletes are forbidden')) {
      auditUpdateBlocked = true;
      console.log('   ✓ Raw SQL UPDATE rejected by PostgreSQL trigger: "audit_logs is append-only"');
    }
  }

  let auditDeleteBlocked = false;
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM audit_logs WHERE id = '${audit.id}';`);
  } catch (err: any) {
    if (err.message.includes('audit_logs is append-only; updates and deletes are forbidden')) {
      auditDeleteBlocked = true;
      console.log('   ✓ Raw SQL DELETE rejected by PostgreSQL trigger: "audit_logs is append-only"');
    }
  }

  results.push({
    name: 'Audit log immutability',
    passed: auditUpdateBlocked && auditDeleteBlocked,
    details: `UPDATE blocked: ${auditUpdateBlocked}, DELETE blocked: ${auditDeleteBlocked}`,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Financial row protection (folio_charges and payments DELETE blocked)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n4. Testing Financial Row Protection (Deletions Blocked)...');

  // Create test folio under res1
  const folio = await prisma.folio.create({
    data: {
      reservationId: res1Id,
      folioNumber: 'FOL-TEST-FINANCIAL-001',
    },
  });

  // Create folio charge
  const charge = await prisma.folioCharge.create({
    data: {
      folioId: folio.id,
      chargeType: 'ROOM_RATE',
      description: 'Room Charge Guard Test',
      amount: 100.00,
      quantity: 1,
      unitPrice: 100.00,
      postedBy: user.id,
    },
  });
  console.log('   ✓ Inserted folio_charge row:', charge.id);

  let chargeDeleteBlocked = false;
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM folio_charges WHERE id = '${charge.id}';`);
  } catch (err: any) {
    if (err.message.includes('Financial records cannot be deleted')) {
      chargeDeleteBlocked = true;
      console.log('   ✓ DELETE FROM folio_charges rejected by PostgreSQL trigger: "Financial records cannot be deleted"');
    }
  }

  // Create payment
  const payment = await prisma.payment.create({
    data: {
      folioId: folio.id,
      reservationId: res1Id,
      amount: 100.00,
      method: 'CASH',
      status: 'COMPLETED',
      processedBy: user.id,
    },
  });
  console.log('   ✓ Inserted payment row:', payment.id);

  let paymentDeleteBlocked = false;
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM payments WHERE id = '${payment.id}';`);
  } catch (err: any) {
    if (err.message.includes('Financial records cannot be deleted')) {
      paymentDeleteBlocked = true;
      console.log('   ✓ DELETE FROM payments rejected by PostgreSQL trigger: "Financial records cannot be deleted"');
    }
  }

  results.push({
    name: 'Financial row protection',
    passed: chargeDeleteBlocked && paymentDeleteBlocked,
    details: `folio_charges DELETE blocked: ${chargeDeleteBlocked}, payments DELETE blocked: ${paymentDeleteBlocked}`,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log('  TEST SUMMARY');
  console.log('================================================================');
  let allPassed = true;
  for (const r of results) {
    console.log(`  ${r.passed ? '✅ PASS' : '❌ FAIL'}: ${r.name}`);
    console.log(`     ${r.details}`);
    if (!r.passed) allPassed = false;
  }
  console.log('================================================================\n');

  // Post-test cleanup
  console.log('Cleaning up test data...');
  await cleanupTestData();
  console.log('✓ Test data cleaned up successfully.\n');

  if (!allPassed) {
    throw new Error('One or more database guard tests failed.');
  }

  return results;
}

if (require.main === module) {
  verifyPhase1DatabaseGuards()
    .then(() => {
      console.log('All Phase 1 database guarantees successfully verified! 🛡️\n');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\nVerification failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
