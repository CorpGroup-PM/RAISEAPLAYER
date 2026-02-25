const pad = (n: number) => String(n).padStart(2, "0");

export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const getTodayISO = () => toISODate(new Date());

export const getLast7DaysISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return toISODate(d);
};

export const getStartOfWeekISO = () => {
  const d = new Date();
  const day = d.getDay(); // 0 Sun
  const diff = day === 0 ? 6 : day - 1; // Monday start
  d.setDate(d.getDate() - diff);
  return toISODate(d);
};

export const getStartOfMonthISO = () => {
  const d = new Date();
  d.setDate(1);
  return toISODate(d);
};

export const getStartOfYearISO = () => {
  const d = new Date();
  d.setMonth(0, 1);
  return toISODate(d);
};
