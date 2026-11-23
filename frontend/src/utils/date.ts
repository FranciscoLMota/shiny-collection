export function formatDateDDMMYYYY(value: string | null | undefined): string {
  if (!value) return "";

  const datePart = value.slice(0, 10);
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);

  if (!isoMatch) return datePart;

  const [, year, month, day] = isoMatch;
  return `${day}/${month}/${year}`;
}

export function parseDateDDMMYYYY(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const [, day, month, year] = match;
  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);
  const date = new Date(yearNumber, monthNumber - 1, dayNumber);

  if (
    date.getFullYear() !== yearNumber ||
    date.getMonth() !== monthNumber - 1 ||
    date.getDate() !== dayNumber
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
}
