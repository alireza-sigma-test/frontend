export type Role = 'speaker' | 'reviewer' | 'admin'
export type Status = 'pending' | 'approved' | 'rejected'

export interface User { id: number; name: string; email: string; role: Role; initials: string; created_at: string; email_verified_at: string | null; is_verified: boolean }
export interface Tag { id: number; name: string; slug: string; proposals_count?: number }
export interface Attachment { filename: string; size_bytes: number; mime: string; url: string }

/** Reviewers and admins get every field. The owning speaker gets only the
 *  first three — the server omits rating and reviewer entirely. */
export interface Review {
  id: number
  comment: string | null
  created_at: string
  rating?: number
  reviewer?: Pick<User, 'id' | 'name' | 'initials'>
}

export interface ProposalCan { edit: boolean; review: boolean; change_status: boolean }

export interface Proposal {
  id: number; ref: string; title: string; description: string; status: Status
  tags: Tag[]
  author: Pick<User, 'id' | 'name' | 'initials'>
  attachment: Attachment | null
  average_rating: number | null
  reviews_count: number
  my_review: Review | null
  can: ProposalCan
  created_at: string; updated_at: string
}

/** GET /proposals/{id} returns a flat Proposal plus these two. */
export interface ProposalDetail extends Proposal { reviews: Review[]; max_rating: number }

export interface Counts { all: number; pending: number; approved: number; rejected: number }

/** The four API.md §06 event types, shared by notifications, the activity feed
 *  and the broadcast payload — one vocabulary, one type. */
export type ActivityType = 'proposal.created' | 'proposal.updated' | 'proposal.status_changed' | 'review.created'

/** GET /notifications — addressed to you. `AppNotification` rather than
 *  `Notification`, which is a DOM global. */
export interface AppNotification {
  id: string
  type: ActivityType
  title: string
  body: string
  proposal_id: number | null
  read_at: string | null
  created_at: string
}

/** GET /activity — everything you may see. Deliberately the same shape the
 *  socket pushes, so one component renders either. */
export interface ActivityRow {
  id: string
  type: ActivityType
  proposal: { id: number; ref: string; title: string; status: Status }
  actor: { id: number; name: string; initials: string }
  occurred_at: string
}

export interface Paginated<T> {
  data: T[]
  meta: {
    current_page: number; last_page: number; per_page: number; total: number
    /** Only /notifications sends this — the badge count, which is not the
     *  page total and not `total` either once `unread_only` is off. */
    unread_count?: number
  }
}

/** GET /proposals adds `counts` alongside the paginator — deliberately
 *  unaffected by search/tags/status, so the sidebar tallies stay stable while
 *  filtering (API.md §02). No other list endpoint carries it. */
export interface PaginatedProposals extends Paginated<Proposal> { counts: Counts }
export type ValidationErrors = Record<string, string[]>
