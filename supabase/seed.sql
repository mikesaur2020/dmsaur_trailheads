-- DMSaur Trailheads — seed data (Phase 1 foundation)
--
-- Mirrors the Phase 0 mock data in src/data/ideas.ts and src/data/contributors.ts
-- so a local database (via `supabase db reset`) holds the same content the UI
-- currently renders from mock data. This does NOT change the frontend: the app
-- still reads its mock data and is not wired to these tables in this milestone.
--
-- Child rows are linked to ideas by slug (no hardcoded UUIDs). Runs as the
-- privileged role during reset, so RLS does not block these inserts.

-- Start clean so the seed is repeatable.
truncate table
  public.idea_status_events,
  public.idea_signals,
  public.ideas,
  public.contributors
  restart identity cascade;

-- ---------------------------------------------------------------------------
-- Contributors (mirrors src/data/contributors.ts)
-- ---------------------------------------------------------------------------
insert into public.contributors
  (display_name, recognition, blurb, xp, badges, ideas_contributed, joined_date)
values
  ('Dana R.', 'first-name',
   'Full-time van traveler who notices the small friction points of life off-grid.',
   640, array['First Trailhead', 'Problem Finder', 'Evidence Builder'], 4, '2026-02-19'),
  ('Priya Natarajan', 'full-name',
   'Frequent flyer who plans trips across wildly different climates.',
   380, array['First Trailhead', 'Storyteller'], 2, '2026-05-04'),
  ('The Ferns', 'nickname',
   'A family that camps most weekends and swaps notes with neighbors.',
   250, array['First Trailhead'], 1, '2026-06-11'),
  ('Anonymous Contributor', 'anonymous',
   'Chose to stay anonymous — recognition is always the contributor’s choice.',
   120, array['First Trailhead'], 1, '2026-06-21');

-- ---------------------------------------------------------------------------
-- Ideas (mirrors src/data/ideas.ts)
-- ---------------------------------------------------------------------------

-- The fully-detailed example idea (slug 'example').
insert into public.ideas
  (slug, title, summary, status, category, contributor_display, recognition,
   submitted_date, problem_statement, contributor_story, who_experiences_it,
   frequency, current_workaround, willingness_to_pay)
values
  ('example',
   'Knowing how much fresh water is really left in the tank',
   'RV and van water gauges jump between a few crude bars, so you either run out mid-trip or top off constantly out of fear.',
   'researching', 'camping-rv', 'Dana R.', 'first-name', '2026-05-12',
   'Most RV and camper van fresh-water gauges report only empty, one-third, two-thirds, and full. Those bars are notoriously inaccurate, so on longer boondocking trips you are constantly guessing. The result is either an unexpected empty tank in the middle of cooking dinner, or wasted water and wasted trips to refill "just in case."',
   'On a four-day trip off-grid, our gauge showed two-thirds full the entire second day and then jumped straight to empty while my daughter was rinsing dishes. We spent the next morning breaking camp early to find a fill station instead of hiking the ridge we had driven out to see.',
   'Van lifers, RV travelers, boondockers, and weekend campers — anyone relying on a finite onboard water supply without shore hookups.',
   'Every trip that lasts more than a day or two off-grid.',
   'People tap the tank and listen, track it with tally marks on paper, or simply refill far more often than needed.',
   'yes');

-- The remaining ideas (list cards; no extended detail).
insert into public.ideas
  (slug, title, summary, status, category, contributor_display, recognition, submitted_date)
values
  ('breaker-panel-mystery',
   'No reliable way to know which breaker controls what',
   'Electrical panels are labeled vaguely or not at all, so troubleshooting a dead outlet means flipping breakers one by one.',
   'reviewing', 'home-utilities', 'Anonymous', 'anonymous', '2026-06-21'),
  ('multi-climate-packing',
   'Packing for multi-climate trips means overpacking every time',
   'A trip that spans a cold flight, a warm city, and a rainy hike has no simple way to plan a bag that covers all of it.',
   'submitted', 'travel', 'Priya Natarajan', 'full-name', '2026-07-03'),
  ('stale-trail-conditions',
   'Trail conditions are stale by the time you reach the trailhead',
   'Posted reports are often weeks old, so washouts, closures, and mud are a surprise you only discover on foot.',
   'prototyping', 'outdoor-recreation', 'M. Alvarez', 'nickname', '2026-04-27'),
  ('warranty-and-manuals-scatter',
   'Warranties and manuals scatter across drawers and inboxes',
   'When something breaks, the receipt, warranty terms, and manual are never in the same place — if they can be found at all.',
   'building', 'everyday-organization', 'Sam', 'first-name', '2026-03-15'),
  ('family-tech-support-history',
   'Helping family with tech means starting from zero every time',
   'Without a shared history of past fixes, the same problems get re-diagnosed again and again across phone calls.',
   'submitted', 'technology', 'Jordan L.', 'first-name', '2026-07-10'),
  ('campsite-quiet-hours',
   'Campground quiet-hours expectations are unclear until they are broken',
   'Every site has different norms for noise, generators, and lights, and nobody learns them until a neighbor is upset.',
   'beta', 'camping-rv', 'The Ferns', 'nickname', '2026-02-08');

-- ---------------------------------------------------------------------------
-- Community signals (count-based preview — see migration header note).
-- Order per idea: have-problem, would-use, would-test, would-pay.
-- ---------------------------------------------------------------------------
insert into public.idea_signals (idea_id, key, count)
select i.id, s.key::community_signal_key, s.count
from public.ideas i
join (
  values
    ('example', 'have-problem', 214), ('example', 'would-use', 176),
    ('example', 'would-test', 63),    ('example', 'would-pay', 88),
    ('breaker-panel-mystery', 'have-problem', 342), ('breaker-panel-mystery', 'would-use', 251),
    ('breaker-panel-mystery', 'would-test', 47),    ('breaker-panel-mystery', 'would-pay', 61),
    ('multi-climate-packing', 'have-problem', 129), ('multi-climate-packing', 'would-use', 143),
    ('multi-climate-packing', 'would-test', 38),    ('multi-climate-packing', 'would-pay', 40),
    ('stale-trail-conditions', 'have-problem', 187), ('stale-trail-conditions', 'would-use', 201),
    ('stale-trail-conditions', 'would-test', 72),    ('stale-trail-conditions', 'would-pay', 33),
    ('warranty-and-manuals-scatter', 'have-problem', 298), ('warranty-and-manuals-scatter', 'would-use', 264),
    ('warranty-and-manuals-scatter', 'would-test', 55),    ('warranty-and-manuals-scatter', 'would-pay', 97),
    ('family-tech-support-history', 'have-problem', 156), ('family-tech-support-history', 'would-use', 134),
    ('family-tech-support-history', 'would-test', 41),    ('family-tech-support-history', 'would-pay', 22),
    ('campsite-quiet-hours', 'have-problem', 91), ('campsite-quiet-hours', 'would-use', 77),
    ('campsite-quiet-hours', 'would-test', 29),   ('campsite-quiet-hours', 'would-pay', 12)
) as s(slug, key, count) on s.slug = i.slug;

-- ---------------------------------------------------------------------------
-- Status history for the example idea (mirrors its statusHistory).
-- ---------------------------------------------------------------------------
insert into public.idea_status_events (idea_id, status, event_date, note)
select i.id, e.status::idea_status, e.event_date::date, e.note
from public.ideas i
join (
  values
    ('example', 'submitted',   '2026-05-12', 'Idea shared by a contributor.'),
    ('example', 'reviewing',   '2026-05-18', 'Initial read-through for clarity and scope.'),
    ('example', 'researching', '2026-06-02', 'Gathering evidence on how widely this is felt.')
) as e(slug, status, event_date, note) on e.slug = i.slug;
