import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Compass,
  MessageSquareText,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Container } from '../components/Container'
import { ButtonLink } from '../components/Button'
import { SectionHeading } from '../components/SectionHeading'
import { JourneyTimeline } from '../components/JourneyTimeline'
import { Notice } from '../components/Notice'
import { SIGNAL_META, SIGNAL_ORDER } from '../lib/meta'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const STEPS = [
  {
    icon: MessageSquareText,
    title: 'Share the problem.',
    body: 'Describe a real frustration, need, or opportunity in your own words. No app design required.',
  },
  {
    icon: Compass,
    title: 'Add context and real-world experience.',
    body: 'Tell the story behind it — who it affects, how often, and how you cope today.',
  },
  {
    icon: TrendingUp,
    title: 'Help the strongest ideas gain evidence.',
    body: 'Community responses show which problems are worth solving, beyond simple popularity.',
  },
]

export function Home() {
  useDocumentTitle()

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="topo-lines absolute inset-0 opacity-70" aria-hidden="true" />
        <Container className="relative py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm font-semibold uppercase tracking-[0.14em] text-brand">
              <Sparkles className="size-4" aria-hidden="true" />
              DMSaur Trailheads
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-text sm:text-5xl lg:text-6xl">
              Every great product begins with a real problem.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted">
              Trailheads is where friends, users, and fellow problem-solvers can
              share the everyday frustrations and unmet needs that might inspire
              future DMSaur apps.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink to="/submit" variant="primary" size="lg">
                <Sparkles className="size-4" aria-hidden="true" />
                Start an Idea
              </ButtonLink>
              <ButtonLink to="/ideas" variant="secondary" size="lg">
                Explore Ideas
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            </div>
            <p className="mt-8 text-base font-medium text-brand">
              Ideas are easy. Learning is the adventure.
            </p>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="How it works" title="From a problem to a product journey">
            We don’t ask you to design an app. We ask you to describe a problem
            worth solving — and help the best ones prove themselves.
          </SectionHeading>

          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <li
                  key={step.title}
                  className="relative rounded-2xl border border-line bg-surface p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold text-muted">
                      Step {i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-text">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {step.body}
                  </p>
                </li>
              )
            })}
          </ol>
        </Container>
      </section>

      {/* Community signals preview */}
      <section className="border-y border-line bg-surface-2/40 py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Community signals"
            title="Richer than a popularity vote"
          >
            When Trailheads goes live, community responses will be more
            meaningful than a simple thumbs-up. Each signal answers a different
            real-world question about whether a problem is worth solving.
          </SectionHeading>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SIGNAL_ORDER.map((key) => {
              const meta = SIGNAL_META[key]
              const Icon = meta.icon
              return (
                <div
                  key={key}
                  className="rounded-2xl border border-line bg-surface p-5"
                >
                  <span
                    className="grid size-10 place-items-center rounded-xl"
                    style={{
                      color: meta.colorVar,
                      backgroundColor: `color-mix(in srgb, ${meta.colorVar} 12%, transparent)`,
                    }}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-semibold text-text">{meta.label}</h3>
                  <p className="mt-1 text-sm text-muted">{meta.description}</p>
                </div>
              )
            })}
          </div>

          <Notice className="mt-6">
            Preview only — community signals are not live yet. Voting and counts
            shown across this skeleton are demonstration data.
          </Notice>
        </Container>
      </section>

      {/* Product journey */}
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="The journey" title="Where an idea can go">
            Every idea starts at the trailhead. From there, the strongest ones
            travel a clear path — described in plain language first, with a
            little trail flavor along the way.
          </SectionHeading>
          <div className="mt-10">
            <JourneyTimeline />
          </div>
        </Container>
      </section>

      {/* Founder message */}
      <section className="border-t border-line bg-brand text-brand-contrast">
        <Container className="py-16 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-contrast/80">
              A note on why this exists
            </p>
            <p className="mt-4 text-pretty text-2xl font-medium leading-relaxed">
              Good ideas disappear all the time — mentioned once around a
              campfire or in a group chat, then forgotten. DMSaur Trailheads
              exists to catch those problems before they slip away, and to make
              sure the people whose insight sparks a real product get the
              recognition they choose.
            </p>
            <div className="mt-8">
              <Link
                to="/about"
                className="inline-flex items-center gap-1 font-medium text-brand-contrast underline-offset-4 hover:underline"
              >
                Read more about the vision
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
