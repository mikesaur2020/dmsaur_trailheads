import { forwardRef, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheckBig,
  Pencil,
  Sparkles,
} from 'lucide-react'
import { Container } from '../components/Container'
import { Button, ButtonLink } from '../components/Button'
import { Notice } from '../components/Notice'
import { WIZARD_QUESTIONS } from '../data/submitQuestions'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { cn } from '../lib/cn'

type Answers = Record<string, string>

/** Total steps = one per question, then a review step. */
const REVIEW_STEP = WIZARD_QUESTIONS.length

function isAnswerValid(questionIndex: number, answers: Answers): boolean {
  const q = WIZARD_QUESTIONS[questionIndex]
  const value = (answers[q.id] ?? '').trim()
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
  const headingRef = useRef<HTMLHeadingElement>(null)

  const totalQuestions = WIZARD_QUESTIONS.length
  const onReview = step === REVIEW_STEP

  const currentValid = useMemo(() => {
    if (onReview) return true
    return isAnswerValid(step, answers)
  }, [step, answers, onReview])

  function focusHeading() {
    // Move focus to the step heading so screen readers announce the new step.
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

  function finish() {
    setDone(true)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  function restart() {
    setAnswers({})
    setStep(0)
    setShowError(false)
    setDone(false)
  }

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
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

        <Notice className="mt-6">
          This is a demonstration. Your answers stay in this browser tab only and
          are never sent or stored.
        </Notice>

        {/* Progress */}
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-sm text-muted">
            <span>
              {onReview
                ? 'Review'
                : `Question ${step + 1} of ${totalQuestions}`}
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
            <ReviewStep
              ref={headingRef}
              answers={answers}
              onEdit={editStep}
            />
          ) : (
            <QuestionStep
              key={WIZARD_QUESTIONS[step].id}
              ref={headingRef}
              index={step}
              value={answers[WIZARD_QUESTIONS[step].id] ?? ''}
              onChange={(v) => setAnswer(WIZARD_QUESTIONS[step].id, v)}
              showError={showError && !currentValid}
            />
          )}

          {/* Controls */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={goPrev}
              disabled={step === 0}
              type="button"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Previous
            </Button>

            {onReview ? (
              <Button variant="primary" onClick={finish} type="button">
                <Check className="size-4" aria-hidden="true" />
                Finish demonstration
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
    value: string
    onChange: (v: string) => void
    showError: boolean
  }
>(function QuestionStep({ index, value, onChange, showError }, ref) {
  const q = WIZARD_QUESTIONS[index]
  const errorId = `${q.id}-error`
  const helpId = `${q.id}-help`

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
              onChange={(e) => onChange(e.target.value)}
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
                      onChange={(e) => onChange(e.target.value)}
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

        {q.note && (
          <p className="mt-3 rounded-lg bg-surface-2/70 px-3 py-2 text-sm text-muted">
            {q.note}
          </p>
        )}

        {showError && (
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
        Take a last look. You can edit any answer before finishing.
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
            That’s the shape of it — thank you
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            You just walked through how sharing a problem will feel. When
            Trailheads goes live, this is where your idea would begin its
            journey.
          </p>

          <div className="mt-6 w-full">
            <Notice className="justify-center text-center">
              This skeleton does not submit or store your information yet.
            </Notice>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button variant="secondary" onClick={onRestart}>
              Walk through it again
            </Button>
            <ButtonLink to="/ideas" variant="primary">
              Explore ideas
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </div>

          <p className="mt-8 text-sm text-muted">
            Curious how this will work when it’s live?{' '}
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
