import type { ReactNode } from 'react'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { Container } from '../components/Container'
import { SectionHeading } from '../components/SectionHeading'
import { ButtonLink } from '../components/Button'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const DMSAUR_URL = 'https://dmsaur.com'

function Prose({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <div className="mt-2 space-y-3 leading-relaxed text-muted">{children}</div>
    </section>
  )
}

export function About() {
  useDocumentTitle('About')

  return (
    <div className="py-14 sm:py-16">
      <Container size="narrow">
        <SectionHeading eyebrow="About" title="What DMSaur Trailheads is">
          A calm place to capture real problems — so the best ones can prove
          themselves before anyone writes a line of code.
        </SectionHeading>

        <Prose title="Problems first, not proposed apps">
          <p>
            Most idea sites ask people to design a solution. Trailheads does the
            opposite. We ask you to describe a problem, frustration, need, or
            opportunity — the raw material every good product is built from. What
            gets built later is our job to figure out; naming the real problem is
            where you come in.
          </p>
        </Prose>

        <Prose title="How community evidence guides what we build">
          <p>
            When a problem resonates, the community can signal that they share
            it, would use a solution, would help test one, or would pay for it.
            Those signals are richer than a single popularity vote, and over time
            they help the strongest ideas earn real evidence — which is what may
            guide future DMSaur products.
          </p>
        </Prose>

        <Prose title="Sharing an idea is not a promise">
          <p>
            Submitting an idea does not guarantee that DMSaur will build it. Many
            good problems won’t become products, and that’s okay — capturing them
            still matters. We’d rather remember a great problem and revisit it
            later than lose it entirely.
          </p>
        </Prose>

        <Prose title="You control how you’re recognized">
          <p>
            Contributors will always choose how they appear — full name, first
            name, a nickname, or anonymous. Your recognition preference is yours
            to set, and yours to change.
          </p>
        </Prose>

        <Prose title="Legal and privacy, before anything goes live">
          <p>
            This is an early skeleton. Before real submissions are enabled, clear
            terms and a privacy policy will be added so everyone knows exactly how
            ideas and contact preferences are handled. Until then, nothing you do
            here is stored.
          </p>
        </Prose>

        <div className="mt-10 rounded-2xl border border-line bg-surface p-6">
          <h2 className="text-lg font-semibold text-text">
            DMSaur Trailheads is part of DMSaur
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Trailheads is where DMSaur listens for the problems worth solving.
            Learn more about DMSaur and its apps at dmsaur.com.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={DMSAUR_URL}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-surface-2"
            >
              Visit dmsaur.com
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
            <ButtonLink to="/submit" variant="primary">
              Start an Idea
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>
      </Container>
    </div>
  )
}
