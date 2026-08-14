/**
 * Database types for the Supabase Postgres schema (Phase 1 foundation).
 *
 * Hand-authored to match supabase/migrations. It intentionally reuses the enum
 * string unions from ./index so the domain types remain the single source of
 * truth for those values. Regenerate from a live/local database at any time with
 * `npm run gen:types` (which overwrites this file from the actual schema).
 *
 * NOTE: this describes the database shape only. It is not yet used by the UI —
 * the app still renders mock data in this milestone.
 */
import type {
  Category,
  CommunitySignalKey,
  IdeaStatus,
  RecognitionPreference,
  SubmissionStatus,
  WillingnessToPay,
} from './index'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contributors: {
        Row: {
          id: string
          display_name: string
          recognition: RecognitionPreference
          blurb: string | null
          xp: number
          badges: string[]
          ideas_contributed: number
          joined_date: string
          created_at: string
        }
        Insert: {
          id?: string
          display_name: string
          recognition: RecognitionPreference
          blurb?: string | null
          xp?: number
          badges?: string[]
          ideas_contributed?: number
          joined_date: string
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          recognition?: RecognitionPreference
          blurb?: string | null
          xp?: number
          badges?: string[]
          ideas_contributed?: number
          joined_date?: string
          created_at?: string
        }
        Relationships: []
      }
      ideas: {
        Row: {
          id: string
          slug: string
          title: string
          summary: string
          status: IdeaStatus
          category: Category
          contributor_display: string
          recognition: RecognitionPreference
          submitted_date: string
          problem_statement: string | null
          contributor_story: string | null
          who_experiences_it: string | null
          frequency: string | null
          current_workaround: string | null
          willingness_to_pay: WillingnessToPay | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          summary: string
          status: IdeaStatus
          category: Category
          contributor_display: string
          recognition: RecognitionPreference
          submitted_date: string
          problem_statement?: string | null
          contributor_story?: string | null
          who_experiences_it?: string | null
          frequency?: string | null
          current_workaround?: string | null
          willingness_to_pay?: WillingnessToPay | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          summary?: string
          status?: IdeaStatus
          category?: Category
          contributor_display?: string
          recognition?: RecognitionPreference
          submitted_date?: string
          problem_statement?: string | null
          contributor_story?: string | null
          who_experiences_it?: string | null
          frequency?: string | null
          current_workaround?: string | null
          willingness_to_pay?: WillingnessToPay | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      idea_signals: {
        Row: {
          idea_id: string
          key: CommunitySignalKey
          count: number
        }
        Insert: {
          idea_id: string
          key: CommunitySignalKey
          count?: number
        }
        Update: {
          idea_id?: string
          key?: CommunitySignalKey
          count?: number
        }
        Relationships: [
          {
            foreignKeyName: 'idea_signals_idea_id_fkey'
            columns: ['idea_id']
            isOneToOne: false
            referencedRelation: 'ideas'
            referencedColumns: ['id']
          },
        ]
      }
      idea_status_events: {
        Row: {
          id: string
          idea_id: string
          status: IdeaStatus
          event_date: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          status: IdeaStatus
          event_date: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          status?: IdeaStatus
          event_date?: string
          note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'idea_status_events_idea_id_fkey'
            columns: ['idea_id']
            isOneToOne: false
            referencedRelation: 'ideas'
            referencedColumns: ['id']
          },
        ]
      }
      idea_submissions: {
        Row: {
          id: string
          status: SubmissionStatus
          problem_statement: string
          contributor_story: string | null
          who_experiences_it: string | null
          frequency: string | null
          current_workaround: string | null
          willingness_to_pay: WillingnessToPay | null
          recognition: RecognitionPreference
          contributor_display: string | null
          contact_consent: boolean
          contact_email: string | null
          moderator_notes: string | null
          rejection_reason: string | null
          published_idea_id: string | null
          idempotency_key: string
          created_at: string
          updated_at: string
          reviewed_at: string | null
          approved_at: string | null
          published_at: string | null
        }
        Insert: {
          id?: string
          status?: SubmissionStatus
          problem_statement: string
          contributor_story?: string | null
          who_experiences_it?: string | null
          frequency?: string | null
          current_workaround?: string | null
          willingness_to_pay?: WillingnessToPay | null
          recognition: RecognitionPreference
          contributor_display?: string | null
          contact_consent?: boolean
          contact_email?: string | null
          moderator_notes?: string | null
          rejection_reason?: string | null
          published_idea_id?: string | null
          idempotency_key: string
          created_at?: string
          updated_at?: string
          reviewed_at?: string | null
          approved_at?: string | null
          published_at?: string | null
        }
        Update: {
          id?: string
          status?: SubmissionStatus
          problem_statement?: string
          contributor_story?: string | null
          who_experiences_it?: string | null
          frequency?: string | null
          current_workaround?: string | null
          willingness_to_pay?: WillingnessToPay | null
          recognition?: RecognitionPreference
          contributor_display?: string | null
          contact_consent?: boolean
          contact_email?: string | null
          moderator_notes?: string | null
          rejection_reason?: string | null
          published_idea_id?: string | null
          idempotency_key?: string
          created_at?: string
          updated_at?: string
          reviewed_at?: string | null
          approved_at?: string | null
          published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'idea_submissions_published_idea_id_fkey'
            columns: ['published_idea_id']
            isOneToOne: false
            referencedRelation: 'ideas'
            referencedColumns: ['id']
          },
        ]
      }
      moderators: {
        Row: { id: string; created_at: string }
        Insert: { id: string; created_at?: string }
        Update: { id?: string; created_at?: string }
        Relationships: []
      }
      moderation_events: {
        Row: {
          id: string
          submission_id: string | null
          action: string
          note: string | null
          actor: string | null
          created_at: string
        }
        Insert: {
          id?: string
          submission_id?: string | null
          action: string
          note?: string | null
          actor?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string | null
          action?: string
          note?: string | null
          actor?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'moderation_events_submission_id_fkey'
            columns: ['submission_id']
            isOneToOne: false
            referencedRelation: 'idea_submissions'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      is_moderator: {
        Args: Record<string, never>
        Returns: boolean
      }
      reject_submission: {
        Args: { p_submission_id: string; p_note?: string | null }
        Returns: undefined
      }
      approve_submission: {
        Args: {
          p_submission_id: string
          p_title: string
          p_summary: string
          p_category: Category
        }
        Returns: string
      }
    }
    Enums: {
      idea_status: IdeaStatus
      submission_status: SubmissionStatus
      category: Category
      recognition_preference: RecognitionPreference
      willingness_to_pay: WillingnessToPay
      community_signal_key: CommunitySignalKey
    }
    CompositeTypes: Record<string, never>
  }
}
