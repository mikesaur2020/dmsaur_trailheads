import type { ReactNode } from 'react'
import { Container } from '../components/Container'
import { SectionHeading } from '../components/SectionHeading'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const LAST_UPDATED = 'August 14, 2026'
const CONTACT_EMAIL = 'support@dmsaur.com'

function Prose({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <div className="mt-2 space-y-3 leading-relaxed text-muted">{children}</div>
    </section>
  )
}

/**
 * Privacy Policy for DMSaur Trailheads. Every statement here reflects what the
 * app actually does: a private submission queue in Supabase, a Cloudflare
 * Turnstile bot check on the submit form, and no analytics, ads, tracking, or
 * cookies. Keep it accurate — update it when the data practices change.
 */
export function Privacy() {
  useDocumentTitle('Privacy')

  return (
    <div className="py-14 sm:py-16">
      <Container size="narrow">
        <SectionHeading eyebrow="Privacy" title="Privacy Policy">
          Trailheads is built to collect as little as possible. This explains
          exactly what you share, what stays private, and what can become public.
        </SectionHeading>

        <p className="mt-6 text-sm text-muted">Last updated: {LAST_UPDATED}</p>

        <Prose title="The short version">
          <p>
            Trailheads is a place to describe a problem worth solving. We ask for
            the problem and a few optional details — nothing more. There are{' '}
            <strong className="font-medium text-text">no ads, no analytics, no
            tracking pixels, and no tracking cookies</strong>. We don’t log your
            IP address or fingerprint your device, and we never sell your
            information.
          </p>
        </Prose>

        <Prose title="What you share when you submit an idea">
          <p>When you start an idea, you can provide:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="font-medium text-text">The problem</strong> — a
              description of the frustration, need, or opportunity (required).
            </li>
            <li>
              <strong className="font-medium text-text">Optional context</strong>{' '}
              — who experiences it, how often, any current workaround, whether
              you’d pay for a solution, and a short story about why it matters.
              Every one of these is optional.
            </li>
            <li>
              <strong className="font-medium text-text">How you’re recognized</strong>{' '}
              — you choose whether to appear by a display name of your choosing or
              to stay anonymous.
            </li>
            <li>
              <strong className="font-medium text-text">An optional contact email</strong>{' '}
              — only stored if you check the box asking us to. You can submit an
              idea without giving an email at all.
            </li>
          </ul>
          <p>
            We do not ask for your legal name, address, phone number, or any
            payment information.
          </p>
        </Prose>

        <Prose title="What we do not collect">
          <p>
            Trailheads does not run analytics or advertising, sets no tracking
            cookies, and does not store your IP address, browser user-agent, or a
            device fingerprint alongside your submission. The public site does not
            set cookies. (Signing in to the private moderation area — used only by
            DMSaur — keeps that session in the browser’s local storage; it does
            not apply to visitors.)
          </p>
        </Prose>

        <Prose title="What stays private and what can become public">
          <p>
            Every submission first lands in a{' '}
            <strong className="font-medium text-text">private moderation queue</strong>{' '}
            that only DMSaur can see. Nothing you submit is public automatically.
          </p>
          <p>
            If a moderator reviews and publishes an idea, the{' '}
            <strong className="font-medium text-text">public</strong> version shows
            its title, summary, category, your chosen display name (or “Anonymous”),
            and the idea content you provided — the problem and any optional context
            such as who experiences it, frequency, current workaround, and
            willingness to pay.
          </p>
          <p>
            Your{' '}
            <strong className="font-medium text-text">contact email is never
            published</strong>{' '}
            and is never shown publicly. It is used only so we can reach you about
            your submission, and only if you asked us to keep it.
          </p>
        </Prose>

        <Prose title="Services that help run Trailheads">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="font-medium text-text">Supabase</strong> stores
              submissions and published ideas in a hosted database. Your submission
              is held there so it can be reviewed and, if published, displayed.
            </li>
            <li>
              <strong className="font-medium text-text">Cloudflare Turnstile</strong>{' '}
              protects the submit form from bots. When you submit, Turnstile runs a
              privacy-preserving check; it is designed to work without tracking
              cookies. Cloudflare processes limited technical data only to confirm
              the submission is from a person.
            </li>
            <li>
              <strong className="font-medium text-text">GitHub Pages</strong> hosts
              the website. As with any web host, the hosting infrastructure may
              process routine technical request data (such as IP addresses) as a
              normal part of delivering the site. That processing is handled by the
              host, not by DMSaur.
            </li>
          </ul>
        </Prose>

        <Prose title="Keeping, changing, or deleting your information">
          <p>
            We keep submissions so we can review them, publish the strongest ones,
            and revisit good problems later — including ideas we decide not to
            publish.
          </p>
          <p>
            You can ask us at any time to delete your submission, remove a published
            idea, change or remove your display name, or delete your contact email.
            Email{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-brand hover:text-brand-strong"
            >
              {CONTACT_EMAIL}
            </a>{' '}
            and we’ll take care of it.
          </p>
        </Prose>

        <Prose title="Changes to this policy">
          <p>
            If our data practices change, we’ll update this page and revise the
            “last updated” date above. Material changes will be reflected here
            before they take effect.
          </p>
        </Prose>

        <Prose title="Contact">
          <p>
            Questions about privacy? Email{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-brand hover:text-brand-strong"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Prose>
      </Container>
    </div>
  )
}
