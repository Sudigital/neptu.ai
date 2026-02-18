export function formatCurrency(value: number | undefined): string {
  if (!value) return "-";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1000)
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${value.toFixed(value < 1 ? 6 : 2)}`;
}

export function isBirthdayToday(birthday: string): boolean {
  const now = new Date();
  const birthDate = new Date(birthday);
  return (
    now.getMonth() === birthDate.getMonth() &&
    now.getDate() === birthDate.getDate()
  );
}

export function getAge(birthday: string): number {
  const now = new Date();
  const birthDate = new Date(birthday);
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate()))
    age--;
  return age;
}
