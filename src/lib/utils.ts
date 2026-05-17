import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function computeProgressScore(
  uomType: string,
  targetValue: number | null,
  targetDate: string | null,
  actualValue: number | null,
  actualDate: string | null
): number {
  if (actualValue === null && actualDate === null) return 0;

  switch (uomType) {
    case 'numeric_min':
    case 'percentage_min': {
      // Higher is better: Achievement ÷ Target
      if (!targetValue || targetValue === 0) return 0;
      const score = ((actualValue || 0) / targetValue) * 100;
      return Math.min(Math.round(score), 150); // Cap at 150%
    }

    case 'numeric_max':
    case 'percentage_max': {
      // Lower is better: Target ÷ Achievement
      if (!actualValue || actualValue === 0) return targetValue ? 100 : 0;
      const score = ((targetValue || 0) / actualValue) * 100;
      return Math.min(Math.round(score), 150);
    }

    case 'timeline': {
      // Date-based completion
      if (!targetDate) return 0;
      if (!actualDate) return 0;
      const target = new Date(targetDate).getTime();
      const actual = new Date(actualDate).getTime();
      if (actual <= target) return 100; // On time or early
      // Late - scale down based on how late
      const totalDuration = target - new Date('2026-05-01').getTime();
      const overrun = actual - target;
      const penaltyRatio = overrun / (totalDuration || 1);
      return Math.max(Math.round(100 - penaltyRatio * 100), 0);
    }

    case 'zero': {
      // Zero = Success
      return actualValue === 0 ? 100 : 0;
    }

    default:
      return 0;
  }
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 70) return 'text-amber-400';
  return 'text-red-400';
}

export function getScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500/20';
  if (score >= 70) return 'bg-amber-500/20';
  return 'bg-red-500/20';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'on_track': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'not_started': return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    case 'approved': case 'locked': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'submitted': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'draft': return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    case 'returned': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  }
}

export function formatUomType(uom: string): string {
  switch (uom) {
    case 'numeric_min': return 'Numeric (Min)';
    case 'numeric_max': return 'Numeric (Max)';
    case 'percentage_min': return '% (Min)';
    case 'percentage_max': return '% (Max)';
    case 'timeline': return 'Timeline';
    case 'zero': return 'Zero-based';
    default: return uom;
  }
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
