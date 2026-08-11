/**
 * Fallback / development idea data — NOT the production source of truth.
 *
 * As of Phase 2B the Ideas browse page, status history, and community signal
 * counts all read live from the hosted database (via src/services/ideas.ts).
 * This array — including its signal counts and status history — is used only
 * when Supabase is not configured or a query fails (graceful fallback), and for
 * local development, demos, and tests. Production reflects the real hosted tables.
 *
 * Nothing here is persisted. The first entry (slug "example") carries the full
 * extended detail rendered on /ideas/example. Titles describe a problem,
 * frustration, need, or opportunity — never a proposed application.
 */
import type { Idea } from '../types'
import { makeSignals } from '../lib/meta'

export const IDEAS: Idea[] = [
  {
    id: 'idea-example',
    slug: 'example',
    title: 'Knowing how much fresh water is really left in the tank',
    summary:
      'RV and van water gauges jump between a few crude bars, so you either run out mid-trip or top off constantly out of fear.',
    status: 'researching',
    category: 'camping-rv',
    contributorDisplay: 'Dana R.',
    recognition: 'first-name',
    submittedDate: '2026-05-12',
    signals: makeSignals({
      'have-problem': 214,
      'would-use': 176,
      'would-test': 63,
      'would-pay': 88,
    }),
    problemStatement:
      'Most RV and camper van fresh-water gauges report only empty, one-third, two-thirds, and full. Those bars are notoriously inaccurate, so on longer boondocking trips you are constantly guessing. The result is either an unexpected empty tank in the middle of cooking dinner, or wasted water and wasted trips to refill "just in case."',
    contributorStory:
      'On a four-day trip off-grid, our gauge showed two-thirds full the entire second day and then jumped straight to empty while my daughter was rinsing dishes. We spent the next morning breaking camp early to find a fill station instead of hiking the ridge we had driven out to see.',
    whoExperiencesIt:
      'Van lifers, RV travelers, boondockers, and weekend campers — anyone relying on a finite onboard water supply without shore hookups.',
    frequency: 'Every trip that lasts more than a day or two off-grid.',
    currentWorkaround:
      'People tap the tank and listen, track it with tally marks on paper, or simply refill far more often than needed.',
    willingnessToPay: 'yes',
    // Fallback/dev status history — used only when hosted idea_status_events is
    // unavailable (see src/services/ideas.ts). Not production source-of-truth.
    statusHistory: [
      { status: 'submitted', date: '2026-05-12', note: 'Idea shared by a contributor.' },
      { status: 'reviewing', date: '2026-05-18', note: 'Initial read-through for clarity and scope.' },
      { status: 'researching', date: '2026-06-02', note: 'Gathering evidence on how widely this is felt.' },
    ],
  },
  {
    id: 'idea-breaker-map',
    slug: 'breaker-panel-mystery',
    title: 'No reliable way to know which breaker controls what',
    summary:
      'Electrical panels are labeled vaguely or not at all, so troubleshooting a dead outlet means flipping breakers one by one.',
    status: 'reviewing',
    category: 'home-utilities',
    contributorDisplay: 'Anonymous',
    recognition: 'anonymous',
    submittedDate: '2026-06-21',
    signals: makeSignals({
      'have-problem': 342,
      'would-use': 251,
      'would-test': 47,
      'would-pay': 61,
    }),
  },
  {
    id: 'idea-multi-climate-packing',
    slug: 'multi-climate-packing',
    title: 'Packing for multi-climate trips means overpacking every time',
    summary:
      'A trip that spans a cold flight, a warm city, and a rainy hike has no simple way to plan a bag that covers all of it.',
    status: 'submitted',
    category: 'travel',
    contributorDisplay: 'Priya Natarajan',
    recognition: 'full-name',
    submittedDate: '2026-07-03',
    signals: makeSignals({
      'have-problem': 129,
      'would-use': 143,
      'would-test': 38,
      'would-pay': 40,
    }),
  },
  {
    id: 'idea-trail-conditions',
    slug: 'stale-trail-conditions',
    title: 'Trail conditions are stale by the time you reach the trailhead',
    summary:
      'Posted reports are often weeks old, so washouts, closures, and mud are a surprise you only discover on foot.',
    status: 'prototyping',
    category: 'outdoor-recreation',
    contributorDisplay: 'M. Alvarez',
    recognition: 'nickname',
    submittedDate: '2026-04-27',
    signals: makeSignals({
      'have-problem': 187,
      'would-use': 201,
      'would-test': 72,
      'would-pay': 33,
    }),
  },
  {
    id: 'idea-warranty-scatter',
    slug: 'warranty-and-manuals-scatter',
    title: 'Warranties and manuals scatter across drawers and inboxes',
    summary:
      'When something breaks, the receipt, warranty terms, and manual are never in the same place — if they can be found at all.',
    status: 'building',
    category: 'everyday-organization',
    contributorDisplay: 'Sam',
    recognition: 'first-name',
    submittedDate: '2026-03-15',
    signals: makeSignals({
      'have-problem': 298,
      'would-use': 264,
      'would-test': 55,
      'would-pay': 97,
    }),
  },
  {
    id: 'idea-family-tech-support',
    slug: 'family-tech-support-history',
    title: 'Helping family with tech means starting from zero every time',
    summary:
      'Without a shared history of past fixes, the same problems get re-diagnosed again and again across phone calls.',
    status: 'submitted',
    category: 'technology',
    contributorDisplay: 'Jordan L.',
    recognition: 'first-name',
    submittedDate: '2026-07-10',
    signals: makeSignals({
      'have-problem': 156,
      'would-use': 134,
      'would-test': 41,
      'would-pay': 22,
    }),
  },
  {
    id: 'idea-quiet-hours',
    slug: 'campsite-quiet-hours',
    title: 'Campground quiet-hours expectations are unclear until they are broken',
    summary:
      'Every site has different norms for noise, generators, and lights, and nobody learns them until a neighbor is upset.',
    status: 'beta',
    category: 'camping-rv',
    contributorDisplay: 'The Ferns',
    recognition: 'nickname',
    submittedDate: '2026-02-08',
    signals: makeSignals({
      'have-problem': 91,
      'would-use': 77,
      'would-test': 29,
      'would-pay': 12,
    }),
  },
]

/** The single fully-detailed idea powering /ideas/example. */
export const EXAMPLE_IDEA: Idea =
  IDEAS.find((i) => i.slug === 'example') ?? IDEAS[0]
