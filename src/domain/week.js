// The menu is a Monday-first week template (day 0 = Monday ... 6 = Sunday).
export function todayIndex(date = new Date()) {
  return (date.getDay() + 6) % 7;
}

export const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
