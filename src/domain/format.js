// Display helpers shared by screens.

// 45 -> "45 min", 60 -> "1 hr", 75 -> "1 hr 15 min". "" for nothing.
export function formatMinutes(minutes) {
  const m = Math.round(Number(minutes) || 0);
  if (m <= 0) return "";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} hr ${rest} min` : `${h} hr`;
}

export function totalMinutes(recipe) {
  return (Number(recipe?.time?.prep) || 0) + (Number(recipe?.time?.active) || 0);
}

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
