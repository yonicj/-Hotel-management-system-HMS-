export interface EthiopianDate {
  year: number;
  month: number;
  day: number;
}

export const ETHIOPIAN_MONTHS_AM = [
  'መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
];

export const ETHIOPIAN_MONTHS_EN = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];

/**
 * Gregorian to Ethiopian calendar conversion
 */
export function gregorianToEthiopian(date: Date): EthiopianDate {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth() + 1;
  const gDay = date.getDate();

  let eYear = gYear - 8;
  if (gMonth < 9 || (gMonth === 9 && gDay < 11)) {
    eYear = gYear - 8;
  } else {
    eYear = gYear - 7;
  }

  // Baseline approximation algorithm for hotel displays
  const isLeap = (gYear % 4 === 0 && gYear % 100 !== 0) || gYear % 400 === 0;
  const newYearDay = isLeap ? 12 : 11;

  let eMonth = 1;
  let eDay = 1;

  if (gMonth === 9 && gDay >= newYearDay) {
    eMonth = 1;
    eDay = gDay - newYearDay + 1;
  } else {
    // Standard mapping
    eMonth = ((gMonth + 3) % 12) + 1;
    eDay = gDay;
  }

  return { year: eYear, month: eMonth, day: eDay };
}

export function formatEthiopianDate(ethDate: EthiopianDate, locale: 'am' | 'en' = 'am'): string {
  const monthName = locale === 'am' 
    ? ETHIOPIAN_MONTHS_AM[ethDate.month - 1] 
    : ETHIOPIAN_MONTHS_EN[ethDate.month - 1];
  return `${monthName} ${ethDate.day}, ${ethDate.year}`;
}
