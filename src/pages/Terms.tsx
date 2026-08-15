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
 * Terms of Use for DMSaur Trailheads. Written to match how the service actually
 * works: submissions enter a private queue, DMSaur may publish, decline, merge,
 * or lightly edit them, and publishing is never guaranteed.
 */
export function Terms() {
  useDocumentTitle('Terms')

  return (
    <div className="py-14 sm:py-16">
      <Container size="narrow">
        <SectionHeading eyebrow="Terms" title="Terms of Use">
          The simple agreement for sharing problems on Trailheads — what you can
          expect from us, and what we ask of you.
        </SectionHeading>

        <p className="mt-6 text-sm text-muted">Last updated: {LAST_UPDATED}</p>

        <Prose title="Using Trailheads">
          <p>
            DMSaur Trailheads is a place to describe real problems that might
            inspire future DMSaur products. By using the site or submitting an
            idea, you agree to these terms. If you don’t agree, please don’t submit.
          </p>
        </Prose>

        <Prose title="Acceptable use">
          <p>
            Please share genuine problems and context in good faith. Don’t use
            Trailheads to disrupt the service, submit spam or automated content,
            attempt to access other people’s or the moderation system’s data, or
            work around the bot protection on the submit form.
          </p>
        </Prose>

        <Prose title="How submissions are moderated">
          <p>
            Every submission enters a private queue and is reviewed by DMSaur.
            Reviewing an idea is not a promise to publish it or to build anything.
            We may publish, decline, combine related submissions, or lightly edit
            wording for clarity, length, or readability before publishing. Titles
            and summaries are written by DMSaur from what you submit.
          </p>
        </Prose>

        <Prose title="Publishing, declining, merging, and editing">
          <p>
            Publication is at our discretion. Many good problems won’t be published,
            and that’s okay — capturing them still matters. If we publish your idea,
            the public version may show the problem and any optional context you
            provided, its category, and the display name you chose (or “Anonymous”).
            Your contact email is never published. You can ask us to remove or
            change a published idea at any time.
          </p>
        </Prose>

        <Prose title="Your idea, and permission to publish it">
          <p>
            You keep ownership of what you submit. By submitting, you give DMSaur a
            non-exclusive, worldwide, royalty-free permission to store, review,
            moderate, edit for clarity and length, publish, display, and revisit
            your submission and your chosen display name on Trailheads and in
            related DMSaur materials.
          </p>
          <p>
            You confirm that your submission is yours to share and doesn’t violate
            anyone else’s rights. Please treat submissions as public-facing: don’t
            send anything confidential, and don’t include other people’s private
            personal information. Sharing an idea does not create any confidentiality
            obligation or partnership between us.
          </p>
        </Prose>

        <Prose title="Content that isn’t allowed">
          <p>Don’t submit content that is:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>unlawful, or that infringes someone’s intellectual property or other rights;</li>
            <li>hateful, harassing, threatening, or defamatory;</li>
            <li>someone else’s private or personal information;</li>
            <li>spam, advertising, malware, or deliberately misleading.</li>
          </ul>
          <p>
            We may remove or decline any submission that breaks these terms, at our
            discretion.
          </p>
        </Prose>

        <Prose title="The service is provided “as is”">
          <p>
            Trailheads is offered on an “as is” and “as available” basis, without
            warranties of any kind. We don’t guarantee that the site will be
            uninterrupted, error-free, or that any idea will be reviewed, published,
            or acted on.
          </p>
        </Prose>

        <Prose title="Limitation of liability">
          <p>
            To the fullest extent permitted by law, DMSaur is not liable for any
            indirect, incidental, or consequential damages arising from your use of
            Trailheads or from submitting an idea. Trailheads is a free, informal
            community project.
          </p>
        </Prose>

        <Prose title="Changes to the service and these terms">
          <p>
            Trailheads is evolving, so the service and these terms may change. When
            we update the terms, we’ll revise the “last updated” date above.
            Continuing to use the site after a change means you accept the updated
            terms.
          </p>
        </Prose>

        <Prose title="Contact">
          <p>
            Questions about these terms? Email{' '}
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
