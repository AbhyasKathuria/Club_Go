export const DEFAULT_SCHOOL_COLORS: Record<string, { name: string; hex: string; bgClass: string; textClass: string; borderClass: string }> = {
  SOC: {
    name: 'School of Commerce',
    hex: '#F59E0B',
    bgClass: 'bg-amber-500',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-500',
  },
  SOIS: {
    name: 'School of Information Science',
    hex: '#38BDF8',
    bgClass: 'bg-sky-400',
    textClass: 'text-sky-700',
    borderClass: 'border-sky-400',
  },
  SOD: {
    name: 'School of Design',
    hex: '#EF4444',
    bgClass: 'bg-red-500',
    textClass: 'text-red-700',
    borderClass: 'border-red-500',
  },
  SOCSE: {
    name: 'School of Computer Science & Engineering',
    hex: '#2563EB',
    bgClass: 'bg-blue-600',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-600',
  },
};

export function getSchoolTheme(schoolCode?: string, fallbackHex?: string) {
  const code = schoolCode?.toUpperCase() || 'SOCSE';
  if (DEFAULT_SCHOOL_COLORS[code]) {
    return DEFAULT_SCHOOL_COLORS[code];
  }

  // Fallback if custom school
  const hex = fallbackHex || '#6366F1';
  return {
    name: schoolCode || 'University School',
    hex,
    bgClass: 'bg-indigo-600',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-600',
  };
}
