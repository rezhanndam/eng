export const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const parseDeadline = (deadline) => {
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

export const daysUntil = (deadline) => {
  const date = parseDeadline(deadline);
  if (!date) return null;
  return Math.round((date - startOfToday()) / 86_400_000);
};

export const isValidDisplayDate = (value) => {
  const match = String(value || '').trim().match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/);
  if (!match) return false;
  const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const day = Number(match[1]);
  const month = months[match[2].toLowerCase()];
  const year = Number(match[3]);
  if (month === undefined) return false;
  const date = new Date(Date.UTC(year, month, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day;
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "05 Aug 2026" -> "2026-08-05" (value for <input type="date">)
export const displayDateToInput = (value) => {
  const match = String(value || '').trim().match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/);
  if (!match) return '';
  const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const month = months[match[2].toLowerCase()];
  if (month === undefined) return '';
  return `${match[3]}-${String(month + 1).padStart(2, '0')}-${String(Number(match[1])).padStart(2, '0')}`;
};

// "2026-08-05" -> "05 Aug 2026" (display format stored/rendered app-wide)
export const inputToDisplay = (value) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const month = MONTH_NAMES[Number(match[2]) - 1];
  if (!month) return '';
  return `${Number(match[3])} ${month} ${match[1]}`;
};