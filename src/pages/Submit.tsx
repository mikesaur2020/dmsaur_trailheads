import { forwardRef, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheckBig,
  Loader2,
  Pencil,
  Sparkles,
} from 'lucide-react'
import { Container } from '../components/Container'
import { Button, ButtonLink } from '../components/Button'
import { Notice } from '../components/Notice'
import { Turnstile } from '../components/Turnstile'
import { WIZARD_QUESTIONS } from '../data/submitQuestions'
import { buildSubmitPayload, submitIdea } from '../services/submitIdea'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { cn } from '../lib/cn'

type Answers = Record<string, string>

/** Total steps = one per question, then a review step. */
const REVIEW_STEP = WIZARD_QUESTIONS.length

/** Validity of a single wizard step, including the inline display-name field. */
function isAnswerValid(questionIndex: number, answers: Answers): boolean {
  const q = WIZARD_QUESTIONS[questionIndex]
  const value = (answers[q.id] ?? '').trim()

  // Recognition also carries an inline display-name field: required unless the
  // submitter chose to stay anonymous. (Email on the contact step is optional.)
  if (q.id === 'recognition') {
    if (!value) return false
    if (value !== 'anonymous' && !(answers.displayName ?? '').trim()) return false
    return true
  }

  if (!q.required) return true
  if (q.kind === 'longtext') return value.length >= (q.minLength ?? 1)
  return value.length > 0
}

export function Submit() {
  useDocumentTitle('Start an Idea')

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [showError, setShowError] = useState(false)
  const [done, setDone] = useState(false)

  // One idempotency key per submission attempt: stable across retries (so a lost
  // response can't create a duplicate), regenerated only on a fresh start.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  // Bumping this remounts the Turnstile widget to force a fresh challenge after a
  // failed submit (the token is single-use).
  const [turnstileNonce, setTurnstileNonce] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const headingRef = useRef<HTMLHeadingElement>(null)

  const totalQuestions = WIZARD_QUESTIONS.length
  const onReview = step === REVIEW_STEP

  const currentValid = useMemo(() => {
    if (onReview) return true
    return isAnswerValid(step, answers)
  }, [step, answers, onReview])

  function focusHeading() {
    window.requestAnimationFrame(() => headingRef.current?.focus())
  }

  function goNext() {
    if (!onReview && !currentValid) {
      setShowError(true)
      return
    }
    setShowError(false)
    setStep((s) => Math.min(s + 1, REVIEW_STEP))
    focusHeading()
  }

  function goPrev() {
    setShowError(false)
    setStep((s) => Math.max(s - 1, 0))
    focusHeading()
  }

  function editStep(index: number) {
    setShowError(false)
    setStep(index)
    focusHeading()
  }

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  function resetTurnstile() {
    setTurnstileToken(null)
    setTurnstileNonce((n) => n + 1)
  }

  async function handleSubmit() {
    if (!turnstileToken || submitting) return
    setSubmitError(null)
    setSubmitting(true)

    const payload = buildSubmitPayload(
      {
        problem: answers.problem ?? '',
        story: answers.story,
        who: answers.who,
        frequency: answers.frequency,
        workaround: answers.workaround,
        willingness: answers.willingness,
        recognition: answers.recognition ?? '',
        displayName: answers.displayName,
        contact: answers.contact,
        contactEmail: answers.contactEmail,
        website: answers.website,
      },
      turnstileToken,
      idempotencyKey,
    )

    const result = await submitIdea(payload)
    setSubmitting(false)

    if (result.ok) {
      setDone(true)
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
      return
    }

    // Any failed attempt consumed (or may have consumed) the single-use token —
    // force a fresh challenge before the next try.
    resetTurnstile()

    switch (result.kind) {
      case 'verification':
        setSubmitError(
          'We couldn’t verify that you’re human. Please complete the check again and resubmit.',
        )
        break
      case 'validation':
        setSubmitError(
          'Some answers look incomplete. Please review your responses and try again.',
        )
        break
      case 'too_large':
        setSubmitError('Your submission is too long. Please shorten it and try again.')
        break
      case 'not_configured':
        setSubmitError('Submissions aren’t available right now. Please try again later.')
        break
      default:
        setSubmitError('Something went wrong sending your idea. Please try again.')
    }
  }

  function restart() {
    setAnswers({})
    setStep(0)
    setShowError(false)
    setDone(false)
    setIdempotencyKey(crypto.randomUUID())
    setSubmitError(null)
    resetTurnstile()
  }

  if (done) {
    return <CompletionScreen onRestart={restart} />
  }

  const progressPct = Math.round(
    ((onReview ? totalQuestions : step) / totalQuestions) * 100,
  )

  return (
    <div className="py-14 sm:py-16">
      <Container size="narrow">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-brand">
          <Sparkles className="size-4" aria-hidden="true" />
          Start an Idea
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          Describe a problem worth solving
        </h1>
        <p className="mt-2 text-muted">
          A few short questions — in your own words. Tell us about a problem, not
          an app to build.
        </p>

        {/* Progress */}
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-sm text-muted">
            <span>
              {onReview ? 'Review' : `Question ${step + 1} of ${totalQuestions}`}
            </span>
            <span className="tabular-nums">{progressPct}%</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Submission progress"
          >
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300"
              style={{ width: `${Math.max(progressPct, 4)}%` }}
            />
          </div>
        </div>

        {/* Step body */}
        <div className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          {onReview ? (
            <ReviewStep ref={headingRef} answers={answers} onEdit={editStep} />
          ) : (
            <QuestionStep
              key={WIZARD_QUESTIONS[step].id}
              ref={headingRef}
              index={step}
              answers={answers}
              onAnswer={setAnswer}
              showError={showError && !currentValid}
            />
          )}

          {/* Review-only: honeypot, expectations, and the human check. */}
          {onReview && (
            <div className="mt-8 border-t border-line pt-6">
              {/* Honeypot — visually hidden; real users never fill it. */}
              <div aria-hidden="true" className="h-0 w-0 overflow-hidden">
                <label htmlFor="website">Leave this field empty</label>
                <input
                  id="website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={answers.website ?? ''}
                  onChange={(e) => setAnswer('website', e.target.value)}
                />
              </div>

              <p className="text-sm text-muted">
                Before you send this in, a few things to know:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                <li>Sharing an idea doesn’t guarantee it will be built.</li>
                <li>
                  Ideas may be lightly edited for clarity, categorized, or merged
                  with duplicates before they’re published.
                </li>
                <li>Published ideas are visible to others; your contact info is never shown.</li>
                <li>You’re always in control of how you’re recognized.</li>
              </ul>

              <div className="mt-5">
                <Turnstile
                  key={turnstileNonce}
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                />
              </div>

              {submitError && (
                <p
                  className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                  role="alert"
                >
                  {submitError}
                </p>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={goPrev}
              disabled={step === 0 || submitting}
              type="button"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Previous
            </Button>

            {onReview ? (
              <Button
                variant="primary"
                onClick={handleSubmit}
                type="button"
                disabled={!turnstileToken || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Check className="size-4" aria-hidden="true" />
                    Submit idea
                  </>
                )}
              </Button>
            ) : (
              <Button variant="primary" onClick={goNext} type="button">
                {step === totalQuestions - 1 ? 'Review' : 'Next'}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}

/* ------------------------------------------------------------------ */

const QuestionStep = forwardRef<
  HTMLHeadingElement,
  {
    index: number
    answers: Answers
    onAnswer: (id: string, value: string) => void
    showError: boolean
  }
>(function QuestionStep({ index, answers, onAnswer, showError }, ref) {
  const q = WIZARD_QUESTIONS[index]
  const value = answers[q.id] ?? ''
  const errorId = `${q.id}-error`
  const helpId = `${q.id}-help`

  // Inline sub-fields keyed off specific questions (keeps the step count stable).
  const showDisplayName = q.id === 'recognition' && value !== '' && value !== 'anonymous'
  const showEmail = q.id === 'contact' && value === 'yes'
  const displayNameMissing =
    showError && showDisplayName && !(answers.displayName ?? '').trim()

  return (
    <div>
      <h2
        ref={ref}
        tabIndex={-1}
        className="text-xl font-semibold tracking-tight text-text focus:outline-none"
      >
        {q.question}
      </h2>
      {q.help && (
        <p id={helpId} className="mt-2 text-sm text-muted">
          {q.help}
        </p>
      )}

      <div className="mt-5">
        {q.kind === 'longtext' ? (
          <>
            <label htmlFor={q.id} className="sr-only">
              {q.question}
            </label>
            <textarea
              id={q.id}
              value={value}
              onChange={(e) => onAnswer(q.id, e.target.value)}
              placeholder={q.placeholder}
              rows={5}
              aria-describedby={cn(q.help && helpId, showError && errorId) || undefined}
              aria-invalid={showError}
              className={cn(
                'w-full resize-y rounded-xl border bg-surface px-4 py-3 text-text',
                'placeholder:text-muted/70',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                showError ? 'border-red-500' : 'border-line',
              )}
            />
          </>
        ) : (
          <fieldset aria-describedby={cn(q.help && helpId, showError && errorId) || undefined}>
            <legend className="sr-only">{q.question}</legend>
            <div className="grid gap-2.5">
              {q.choices?.map((choice) => {
                const selected = value === choice.value
                return (
                  <label
                    key={choice.value}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                      selected
                        ? 'border-brand bg-brand-soft'
                        : 'border-line hover:bg-surface-2',
                    )}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={choice.value}
                      checked={selected}
                      onChange={(e) => onAnswer(q.id, e.target.value)}
                      className="mt-0.5 size-4 accent-[var(--brand)]"
                    />
                    <span>
                      <span className="block font-medium text-text">
                        {choice.label}
                      </span>
                      {choice.hint && (
                        <span className="mt-0.5 block text-sm text-muted">
                          {choice.hint}
                        </span>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        )}

        {/* Inline display-name field (recognition step, non-anonymous). */}
        {showDisplayName && (
          <div className="mt-4">
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-text"
            >
              What name should we show?
            </label>
            <input
              id="displayName"
              type="text"
              value={answers.displayName ?? ''}
              onChange={(e) => onAnswer('displayName', e.target.value)}
              maxLength={80}
              placeholder="e.g. Dana R."
              aria-invalid={displayNameMissing}
              className={cn(
                'mt-1.5 w-full rounded-xl border bg-surface px-4 py-2.5 text-text',
                'placeholder:text-muted/70',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                displayNameMissing ? 'border-red-500' : 'border-line',
              )}
            />
            {displayNameMissing && (
              <p className="mt-2 text-sm font-medium text-red-600" role="alert">
                Please add a name to display, or choose “Anonymous”.
              </p>
            )}
          </div>
        )}

        {/* Inline optional email field (contact step, consent = yes). */}
        {showEmail && (
          <div className="mt-4">
            <label
              htmlFor="contactEmail"
              className="block text-sm font-medium text-text"
            >
              Your email <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="contactEmail"
              type="email"
              value={answers.contactEmail ?? ''}
              onChange={(e) => onAnswer('contactEmail', e.target.value)}
              maxLength={254}
              placeholder="you@example.com"
              autoComplete="email"
              className={cn(
                'mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-text',
                'placeholder:text-muted/70',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              )}
            />
          </div>
        )}

        {q.note && (
          <p className="mt-3 rounded-lg bg-surface-2/70 px-3 py-2 text-sm text-muted">
            {q.note}
          </p>
        )}

        {showError && !displayNameMissing && (
          <p id={errorId} className="mt-3 text-sm font-medium text-red-600" role="alert">
            {q.kind === 'longtext'
              ? `Please add a little more detail (at least ${q.minLength ?? 1} characters).`
              : 'Please choose an option to continue.'}
          </p>
        )}
      </div>
    </div>
  )
})

/* ------------------------------------------------------------------ */

function answerLabel(id: string, value: string): string {
  const q = WIZARD_QUESTIONS.find((x) => x.id === id)
  if (!q) return value
  if (q.kind === 'single-choice') {
    return q.choices?.find((c) => c.value === value)?.label ?? value
  }
  return value
}

const ReviewStep = forwardRef<
  HTMLHeadingElement,
  { answers: Answers; onEdit: (index: number) => void }
>(function ReviewStep({ answers, onEdit }, ref) {
  const recognition = answers.recognition
  const displayName = (answers.displayName ?? '').trim()
  const contactEmail = (answers.contactEmail ?? '').trim()

  return (
    <div>
      <h2
        ref={ref}
        tabIndex={-1}
        className="text-xl font-semibold tracking-tight text-text focus:outline-none"
      >
        Review your answers
      </h2>
      <p className="mt-2 text-sm text-muted">
        Take a last look. You can edit any answer before sending.
      </p>

      <dl className="mt-6 space-y-4">
        {WIZARD_QUESTIONS.map((q, i) => {
          const raw = (answers[q.id] ?? '').trim()
          return (
            <div
              key={q.id}
              className="rounded-xl border border-line bg-surface-2/40 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <dt className="text-sm font-medium text-text">{q.question}</dt>
                <button
                  type="button"
                  onClick={() => onEdit(i)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand hover:bg-brand-soft"
                >
                  <Pencil className="size-3" aria-hidden="true" />
                  Edit
                </button>
              </div>
              <dd className="mt-1 text-sm text-muted">
                {raw ? (
                  answerLabel(q.id, raw)
                ) : (
                  <span className="italic text-muted/70">No answer</span>
                )}
              </dd>

              {/* Show the inline sub-answers alongside their parent question. */}
              {q.id === 'recognition' && recognition && recognition !== 'anonymous' && (
                <dd className="mt-1 text-sm text-muted">
                  Shown as:{' '}
                  {displayName ? (
                    <span className="font-medium text-text">{displayName}</span>
                  ) : (
                    <span className="italic text-muted/70">No name yet</span>
                  )}
                </dd>
              )}
              {q.id === 'contact' && answers.contact === 'yes' && (
                <dd className="mt-1 text-sm text-muted">
                  Email:{' '}
                  {contactEmail ? (
                    <span className="text-text">{contactEmail}</span>
                  ) : (
                    <span className="italic text-muted/70">Not provided</span>
                  )}
                </dd>
              )}
            </div>
          )
        })}
      </dl>
    </div>
  )
})

/* ------------------------------------------------------------------ */

function CompletionScreen({ onRestart }: { onRestart: () => void }) {
  useDocumentTitle('Thanks')
  return (
    <div className="py-20 sm:py-28">
      <Container size="narrow">
        <div className="flex flex-col items-center text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand">
            <CircleCheckBig className="size-8" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-text">
            Thank you — your idea is in
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            We’ve received your submission and added it to the queue for review.
            We read every one. If it moves forward, you’ll see it appear among the
            ideas at the trailhead.
          </p>

          <div className="mt-6 w-full">
            <Notice className="justify-center text-center">
              Ideas may be edited for clarity or merged with similar ones before
              they’re published. Your contact details, if you shared any, stay
              private.
            </Notice>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button variant="secondary" onClick={onRestart}>
              Share another idea
            </Button>
            <ButtonLink to="/ideas" variant="primary">
              Explore ideas
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </div>

          <p className="mt-8 text-sm text-muted">
            Curious how this works?{' '}
            <Link to="/about" className="font-medium text-brand hover:underline">
              Read about the vision
            </Link>
            .
          </p>
        </div>
      </Container>
    </div>
  )
}
