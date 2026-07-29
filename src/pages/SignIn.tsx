import {
  BadgeCheck,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  TestTube,
} from 'lucide-react'
import { Container } from '../components/Container'
import { Notice } from '../components/Notice'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const BENEFITS = [
  { icon: BadgeCheck, text: 'Claim the ideas you’ve shared' },
  { icon: Sparkles, text: 'Track each idea’s progress along the journey' },
  { icon: ShieldCheck, text: 'Earn recognition on your own terms' },
  { icon: TestTube, text: 'Volunteer to help test early prototypes' },
]

export function SignIn() {
  useDocumentTitle('Sign in')

  return (
    <div className="py-16 sm:py-20">
      <Container size="narrow">
        <div className="mx-auto max-w-xl">
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
              <KeyRound className="size-7" aria-hidden="true" />
            </span>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-text">
              A simpler way to sign in — coming soon
            </h1>
            <p className="mt-3 text-muted">
              No passwords. No GitHub account. When it’s ready, you’ll sign in
              with a secure link sent to your email.
            </p>
          </div>

          {/* Preview of the magic-link form — intentionally non-functional. */}
          <div className="mt-10 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold text-text">
              Passwordless sign-in
              <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-accent">
                Preview
              </span>
            </p>

            <div className="mt-4">
              <label
                htmlFor="preview-email"
                className="block text-sm font-medium text-muted"
              >
                Email address
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-surface-2/60 px-3 py-2.5 text-muted">
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                <span className="text-sm">Email sign-in isn’t enabled yet</span>
              </div>
            </div>

            {/* Disabled on purpose: nothing sends an email in the skeleton. */}
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Email delivery is not enabled in this skeleton"
              className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-base font-medium text-brand-contrast opacity-60"
            >
              Send magic link
            </button>

            <Notice className="mt-4">
              This is a visual preview. No email will be sent and no account is
              created. Authentication is not connected in this skeleton.
            </Notice>
          </div>

          {/* Why sign in */}
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-text">
              What signing in will unlock
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {BENEFITS.map((b) => {
                const Icon = b.icon
                return (
                  <li
                    key={b.text}
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 text-sm text-text"
                  >
                    <Icon className="size-5 shrink-0 text-brand" aria-hidden="true" />
                    {b.text}
                  </li>
                )
              })}
            </ul>
            <p className="mt-4 text-sm text-muted">
              You’ll never need a GitHub account or a password to take part.
            </p>
          </div>
        </div>
      </Container>
    </div>
  )
}
