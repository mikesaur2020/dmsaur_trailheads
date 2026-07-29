import {
  Award,
  HeartHandshake,
  Shield,
  Sparkles,
  Trophy,
  UserRound,
} from 'lucide-react'
import { Container } from '../components/Container'
import { SectionHeading } from '../components/SectionHeading'
import { Notice } from '../components/Notice'
import { ComingLaterBadge } from '../components/ComingLater'
import { CONTRIBUTORS } from '../data/contributors'
import { formatDate } from '../lib/format'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const RECOGNITION_COPY: { icon: typeof UserRound; title: string; body: string }[] =
  [
    {
      icon: UserRound,
      title: 'You choose your name',
      body: 'Full name, first name, a nickname, or fully anonymous — set per idea, always your call.',
    },
    {
      icon: Shield,
      title: 'Privacy by default',
      body: 'Contact details are never shown publicly. Anonymous truly means anonymous.',
    },
    {
      icon: HeartHandshake,
      title: 'Credit where it’s due',
      body: 'When your insight helps inspire a real product, you’ll be recognized the way you asked to be.',
    },
  ]

export function Contributors() {
  useDocumentTitle('Contributors')

  return (
    <div className="py-14 sm:py-16">
      <Container>
        <SectionHeading eyebrow="Contributors" title="The people behind the problems">
          Trailheads is powered by people willing to share what frustrates them.
          This is a preview of how contributors will be recognized — on their own
          terms.
        </SectionHeading>

        <Notice className="mt-6">
          Preview of a future experience. Profiles, points, and badges shown here
          are demonstration concepts, not a live scoreboard.
        </Notice>

        {/* Why contributors matter */}
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {RECOGNITION_COPY.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-line bg-surface p-6 shadow-sm"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold text-text">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </div>
            )
          })}
        </div>

        {/* Example contributor cards */}
        <div className="mt-14">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-text">
              Example contributors
            </h2>
            <ComingLaterBadge />
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {CONTRIBUTORS.map((c) => (
              <article
                key={c.id}
                className="rounded-2xl border border-line bg-surface p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-full bg-brand-soft text-brand">
                      <UserRound className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-text">
                        {c.displayName}
                      </h3>
                      <p className="text-xs text-muted">
                        Joined {formatDate(c.joinedDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      {c.xp} XP
                    </p>
                    <p className="text-xs text-muted">concept</p>
                  </div>
                </div>

                {c.blurb && (
                  <p className="mt-4 text-sm leading-relaxed text-muted">
                    {c.blurb}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {c.badges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-text"
                    >
                      <Award className="size-3.5 text-brand" aria-hidden="true" />
                      {badge}
                    </span>
                  ))}
                </div>

                <p className="mt-4 text-xs text-muted">
                  {c.ideasContributed}{' '}
                  {c.ideasContributed === 1 ? 'idea' : 'ideas'} contributed
                </p>
              </article>
            ))}
          </div>
        </div>

        {/* Hall of fame */}
        <div className="mt-14 overflow-hidden rounded-2xl border border-dashed border-line bg-surface-2/50 p-8 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent mx-auto">
            <Trophy className="size-6" aria-hidden="true" />
          </span>
          <div className="mt-4 flex items-center justify-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-text">
              Hall of Fame
            </h2>
            <ComingLaterBadge />
          </div>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
            A future space to celebrate the contributors whose problems became
            real products — recognition meant to be warm and appreciative, never
            a competition.
          </p>
        </div>
      </Container>
    </div>
  )
}
