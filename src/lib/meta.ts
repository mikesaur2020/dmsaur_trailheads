/**
 * Display metadata maps for statuses, categories, and community signals.
 *
 * Centralizing these keeps labels, colors, icons, and ordering consistent across
 * every page and away from the components that render them. Trail-flavored
 * phrasing is stored as *secondary* copy only — the primary label is always
 * plain language.
 */
import {
  Tent,
  House,
  Plane,
  Mountain,
  ListChecks,
  Cpu,
  CircleAlert,
  ThumbsUp,
  FlaskConical,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type {
  Category,
  CommunitySignalKey,
  IdeaStatus,
} from '../types'

/** The full product journey, in order. Plain words first. */
export const JOURNEY: IdeaStatus[] = [
  'submitted',
  'reviewing',
  'researching',
  'prototyping',
  'building',
  'beta',
  'released',
]

export const STATUS_META: Record<
  IdeaStatus,
  { label: string; trailPhrase: string; colorVar: string }
> = {
  submitted: {
    label: 'Submitted',
    trailPhrase: 'At the trailhead',
    colorVar: 'var(--status-submitted)',
  },
  reviewing: {
    label: 'Reviewing',
    trailPhrase: 'Checking the map',
    colorVar: 'var(--status-reviewing)',
  },
  researching: {
    label: 'Researching',
    trailPhrase: 'Scouting the route',
    colorVar: 'var(--status-researching)',
  },
  prototyping: {
    label: 'Prototyping',
    trailPhrase: 'Breaking trail',
    colorVar: 'var(--status-prototyping)',
  },
  building: {
    label: 'Building',
    trailPhrase: 'Climbing',
    colorVar: 'var(--status-building)',
  },
  beta: {
    label: 'Beta',
    trailPhrase: 'Nearing the summit',
    colorVar: 'var(--status-beta)',
  },
  released: {
    label: 'Released',
    trailPhrase: 'Summit reached',
    colorVar: 'var(--status-released)',
  },
}

export const CATEGORY_META: Record<
  Category,
  { label: string; icon: LucideIcon }
> = {
  'camping-rv': { label: 'Camping & RV', icon: Tent },
  'home-utilities': { label: 'Home Utilities', icon: House },
  travel: { label: 'Travel', icon: Plane },
  'outdoor-recreation': { label: 'Outdoor Recreation', icon: Mountain },
  'everyday-organization': { label: 'Everyday Organization', icon: ListChecks },
  technology: { label: 'Technology', icon: Cpu },
}

export const CATEGORY_ORDER: Category[] = [
  'camping-rv',
  'home-utilities',
  'travel',
  'outdoor-recreation',
  'everyday-organization',
  'technology',
]

export const SIGNAL_META: Record<
  CommunitySignalKey,
  { label: string; description: string; icon: LucideIcon; colorVar: string }
> = {
  'have-problem': {
    label: 'I have this problem.',
    description: 'Confirms the problem is real and shared.',
    icon: CircleAlert,
    colorVar: 'var(--signal-have)',
  },
  'would-use': {
    label: 'I would use this.',
    description: 'Signals genuine demand for a solution.',
    icon: ThumbsUp,
    colorVar: 'var(--signal-use)',
  },
  'would-test': {
    label: 'I would help test it.',
    description: 'Volunteers to shape an early prototype.',
    icon: FlaskConical,
    colorVar: 'var(--signal-test)',
  },
  'would-pay': {
    label: 'I would pay for a solution.',
    description: 'The strongest evidence a problem is worth solving.',
    icon: Wallet,
    colorVar: 'var(--signal-pay)',
  },
}

export const SIGNAL_ORDER: CommunitySignalKey[] = [
  'have-problem',
  'would-use',
  'would-test',
  'would-pay',
]

/** Build a signals array from counts, filling label/description from metadata. */
export function makeSignals(
  counts: Record<CommunitySignalKey, number>,
) {
  return SIGNAL_ORDER.map((key) => ({
    key,
    label: SIGNAL_META[key].label,
    description: SIGNAL_META[key].description,
    count: counts[key],
  }))
}
