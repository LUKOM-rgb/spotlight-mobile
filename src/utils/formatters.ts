import { Spot } from '../types/models';

export function formatDatePt(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatTimeHm(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function timeToMinutes(timeStr: string): number {
  const [h = 0, m = 0] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function timeToHours(timeStr: string): number {
  const [h = 0, m = 0] = timeStr.split(':').map(Number);
  return h + m / 60;
}

export function hoursToLabel(value: number): string {
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getSpotStatus(spot: Spot): 'open' | 'closed' {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openingMinutes = timeToMinutes(spot.abertura);
  const closingMinutes = timeToMinutes(spot.fecho);

  return currentMinutes >= openingMinutes && currentMinutes <= closingMinutes ? 'open' : 'closed';
}

export function isPastReservation(dataEvento: string, horaFim: string): boolean {
  const target = new Date(`${dataEvento}T${horaFim}`);
  if (Number.isNaN(target.getTime())) return false;
  return target < new Date();
}
