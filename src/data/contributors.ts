/**
 * Demonstration contributor data for the skeleton.
 *
 * Static mock content only. XP and badges are *concept previews* of a future
 * recognition system, not a live score. Recognition preferences drive how each
 * display name is shown. No private contact information appears here or anywhere
 * in the static frontend.
 */
import type { Contributor } from '../types'

export const CONTRIBUTORS: Contributor[] = [
  {
    id: 'contrib-dana',
    displayName: 'Dana R.',
    recognition: 'first-name',
    blurb:
      'Full-time van traveler who notices the small friction points of life off-grid.',
    xp: 640,
    badges: ['First Trailhead', 'Problem Finder', 'Evidence Builder'],
    ideasContributed: 4,
    joinedDate: '2026-02-19',
  },
  {
    id: 'contrib-priya',
    displayName: 'Priya Natarajan',
    recognition: 'full-name',
    blurb: 'Frequent flyer who plans trips across wildly different climates.',
    xp: 380,
    badges: ['First Trailhead', 'Storyteller'],
    ideasContributed: 2,
    joinedDate: '2026-05-04',
  },
  {
    id: 'contrib-thanks',
    displayName: 'The Ferns',
    recognition: 'nickname',
    blurb: 'A family that camps most weekends and swaps notes with neighbors.',
    xp: 250,
    badges: ['First Trailhead'],
    ideasContributed: 1,
    joinedDate: '2026-06-11',
  },
  {
    id: 'contrib-anon',
    displayName: 'Anonymous Contributor',
    recognition: 'anonymous',
    blurb: 'Chose to stay anonymous — recognition is always the contributor’s choice.',
    xp: 120,
    badges: ['First Trailhead'],
    ideasContributed: 1,
    joinedDate: '2026-06-21',
  },
]
