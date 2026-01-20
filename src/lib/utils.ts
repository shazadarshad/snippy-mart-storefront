import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getCountry(): Promise<string> {
  // Silent Geolocation check - keeping console clean for "Ultra Pro Max" experience
  const providers = [
    'https://ipapi.co/json/',
    'https://ip-api.com/json/'
  ];

  for (const url of providers) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        const data = await response.json();
        const country = data.country_name || data.country;
        if (country) return country;
      }
    } catch {
      // Silently continue to next provider or fallback
    }
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
