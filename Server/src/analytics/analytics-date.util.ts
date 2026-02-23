import { BadRequestException } from '@nestjs/common';

const IST_OFFSET = 5.5 * 60 * 60 * 1000;

/**
 * CORE date parser (used by services / Prisma)
 */
export function parseAnalyticsDateRange(input: {
  from?: string;
  to?: string;
}): { fromDate: Date; toDate: Date } {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET);

  const todayISTString = istNow.toISOString().slice(0, 10);

  const todayIST = new Date(
    Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      istNow.getUTCDate(),
    ),
  );

  const parseDate = (value: string) => {
    const date = new Date(`${value}T00:00:00`);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    return date;
  };

  // FROM date (default: last 7 days)
  let from = input.from
    ? parseDate(input.from)
    : new Date(todayIST.getTime() - 6 * 24 * 60 * 60 * 1000);

  // TO date logic (🔥 FIX)
  let to: Date;

  if (!input.to || input.to === todayISTString) {
    // ✅ today → current time
    to = istNow;
  } else {
    // ✅ past date → end of that day
    const endOfDay = parseDate(input.to);
    to = new Date(endOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
  }

  // Convert IST → UTC for DB
  from = new Date(from.getTime() - IST_OFFSET);
  to = new Date(to.getTime() - IST_OFFSET);

  if (from > to) {
    throw new BadRequestException('Invalid date range');
  }

  return {
    fromDate: from,
    toDate: to,
  };
}

/**
 * WRAPPER for controller responses (adds YYYY-MM-DD strings)
 */
export function parseAnalyticsDateRangeWithStrings(input: {
  from?: string;
  to?: string;
}) {
  const today = new Date();
  const istToday = new Date(today.getTime() + IST_OFFSET);

  const resolvedTo =
    input.to ??
    `${istToday.getUTCFullYear()}-${String(
      istToday.getUTCMonth() + 1,
    ).padStart(2, '0')}-${String(istToday.getUTCDate()).padStart(2, '0')}`;

  const resolvedFrom =
    input.from ??
    new Date(
      new Date(`${resolvedTo}T00:00:00`).getTime() -
        6 * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .slice(0, 10);

  const { fromDate, toDate } = parseAnalyticsDateRange({
    from: resolvedFrom,
    to: resolvedTo,
  });

  return {
    from: resolvedFrom,
    to: resolvedTo,
    fromDate,
    toDate,
  };
}
