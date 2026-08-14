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