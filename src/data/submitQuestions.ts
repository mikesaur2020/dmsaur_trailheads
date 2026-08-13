/**
 * Configuration for the Submit-an-Idea conversational wizard.
 *
 * As of Phase 3A.2 this wizard makes a REAL submission: on finish, the answers
 * are POSTed to the protected `submit-idea` Edge Function (see
 * src/services/submitIdea.ts) and land in the private moderation queue. Two
 * fields are collected inline alongside their related questions rather than as
 * separate steps: a display name (on the recognition step, required unless the
 * submitter chose anonymous) and an optional contact email (on the contact step,
 * shown only when contact consent is given).
 *
 * The wizard asks people to describe a problem. It never asks them to name or
 * design an app.
 */

export type QuestionKind = 'longtext' | 'single-choice'

export interface Choice {
  value: string
  label: string
  hint?: string
}

export interface WizardQuestion {
  id: string
  kind: QuestionKind
  /** The prompt shown to the contributor. */
  question: string
  /** Optional supporting guidance under the prompt. */
  help?: string
  /** Placeholder for long-text answers. */
  placeholder?: string
  required: boolean
  /** Minimum characters for a valid long-text answer. */
  minLength?: number
  /** Choices for single-choice questions. */
  choices?: Choice[]
  /** Extra note rendered below the field (e.g. the no-email explanation). */
  note?: string
}

export const WIZARD_QUESTIONS: WizardQuestion[] = [
  {
    id: 'problem',
    kind: 'longtext',
    question: 'What problem or frustration have you encountered?',
    help: 'Describe the problem itself — not a product or app to fix it.',
    placeholder:
      'e.g. It is hard to know how much fresh water is really left in our camper tank…',
    required: true,
    minLength: 12,
  },
  {
    id: 'story',
    kind: 'longtext',
    question: 'Tell us what happened.',
    help: 'A real moment or story helps others recognize the problem.',
    placeholder: 'Walk us through the last time this got in your way…',
    required: true,
    minLength: 12,
  },
  {
    id: 'who',
    kind: 'longtext',
    question: 'Who else might experience this?',
    help: 'Think about who shares this frustration and in what situations.',
    placeholder: 'e.g. Van lifers, weekend campers, anyone off-grid for a few days…',
    required: true,
    minLength: 6,
  },
  {
    id: 'frequency',
    kind: 'single-choice',
    question: 'How often does it happen?',
    required: true,
    choices: [
      { value: 'rarely', label: 'Rarely' },
      { value: 'occasionally', label: 'Occasionally' },
      { value: 'often', label: 'Often' },
      { value: 'constantly', label: 'Constantly' },
    ],
  },
  {
    id: 'workaround',
    kind: 'longtext',
    question: 'How do you handle it today?',
    help: 'Current workarounds tell us a lot about what a real solution needs.',
    placeholder: 'e.g. We tap the tank and guess, or refill far more often than needed…',
    required: true,
    minLength: 6,
  },
  {
    id: 'willingness',
    kind: 'single-choice',
    question: 'Would you consider paying for a useful solution?',
    help: 'Honest answers help the strongest ideas gather real evidence.',
    required: true,
    choices: [
      { value: 'no', label: 'No', hint: 'It would be nice, but not worth paying for.' },
      { value: 'maybe', label: 'Maybe', hint: 'Depends on how well it works.' },
      { value: 'yes', label: 'Yes', hint: 'I would happily pay for this.' },
    ],
  },
  {
    id: 'contact',
    kind: 'single-choice',
    question: 'May DMSaur contact you about the idea?',
    required: true,
    choices: [
      { value: 'yes', label: 'Yes, DMSaur may reach out' },
      { value: 'no', label: 'No, thank you' },
    ],
    note: 'If you say yes, you can add an email below. It is stored privately, used only to follow up about your idea, and never shown publicly.',
  },
  {
    id: 'recognition',
    kind: 'single-choice',
    question: 'How would you like to be recognized?',
    help: 'You are always in control of how your name appears.',
    required: true,
    choices: [
      { value: 'full-name', label: 'Full name' },
      { value: 'first-name', label: 'First name only' },
      { value: 'nickname', label: 'Nickname' },
      { value: 'anonymous', label: 'Anonymous' },
    ],
  },
]
