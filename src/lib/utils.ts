import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getCountry(): Promise<string> {
  try {
    // Try a free geolocation API first
    const response = await fetch('https://ip-api.com/json/');
    if (!response.ok) throw new Error('IP API failed');
    const data = await response.json();
    if (data && data.country) return data.country;
  } catch (err) {
    console.warn('Geolocation failed, falling back to browser locale:', err);
  }

  // Fallback to browser locale if API fails
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    const countryCode = locale.split('-')[1] || locale.toUpperCase();
    return regionNames.of(countryCode) || 'Unknown';
  } catch (err) {
    return 'Unknown';
  }
}

export function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
