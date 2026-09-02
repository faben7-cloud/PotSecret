export type PotEventType = "birthday" | "farewell" | "birth" | "wedding" | "other";
export type PotPrivacyMode = "total_only" | "standard" | "blind_to_owner";
export type PotStatus = "draft" | "open" | "closed" | "completed";
export type ContributionStatus = "pending" | "confirmed" | "failed" | "refunded";
export type PayoutStatus = "paid";

export type PotFormState = {
  error?: string;
  success?: string;
  redirectTo?: string;
  fieldErrors?: Partial<Record<"title" | "description" | "event_date" | "goal_amount", string>>;
};

export type CreatePotFormState = PotFormState;

export type ContributionFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"amount" | "display_name" | "message" | "consent", string>>;
};

export type ContributionCaptureFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<
    Record<"amount" | "message" | "hint_level_1" | "hint_level_2" | "hint_level_3", string>
  >;
};

export type PotSummary = {
  id: string;
  title: string;
  event_type: PotEventType;
  privacy_mode: PotPrivacyMode;
  mystery_mode?: boolean;
  status: PotStatus;
  revealed?: boolean;
  revealed_at?: string | null;
  currency: string;
  share_token: string;
  confirmed_total_amount: number;
  confirmed_contribution_count: number;
  created_at: string;
};

export type PublicPot = {
  title: string;
  description: string | null;
  event_type: PotEventType;
  event_date: string | null;
  currency: string;
  goal_amount: number | null;
  mystery_mode?: boolean;
  is_open: boolean;
  revealed?: boolean;
  messages_visible_to_beneficiary?: boolean;
  confirmed_total_amount: number;
  confirmed_contribution_count: number;
};
export type PotDetail = {
  id: string;
  title: string;
  description: string | null;
  event_type: PotEventType;
  event_date: string | null;
  currency: string;
  goal_amount: number | null;
  privacy_mode: PotPrivacyMode;
  mystery_mode?: boolean;
  status: PotStatus;
  share_token: string;
  revealed?: boolean;
  revealed_at?: string | null;
  messages_visible_to_beneficiary: boolean;
  confirmed_total_amount: number;
  confirmed_contribution_count: number;
  created_at: string;
};

export type PotContribution = {
  id: string;
  amount: number | null;
  currency?: string | null;
  contributor_display_name: string | null;
  is_anonymous: boolean;
  status: ContributionStatus;
  message_body?: string | null;
  hint_level_1?: string | null;
  hint_level_2?: string | null;
  hint_level_3?: string | null;
  mystery_mode?: boolean;
  revealed?: boolean;
  created_at: string;
};

export type PotRevealContribution = {
  message_body: string | null;
  created_at: string;
  pot_progress_percentage: number;
  visible_identity: string | null;
  visible_hint_level_1: string | null;
  visible_hint_level_2: string | null;
  visible_hint_level_3: string | null;
  visible_mystery_hint: string | null;
};
export type PotMessage = {
  id: string;
  contribution_id: string | null;
  body: string;
  mystery_hint?: string | null;
  author_display_name: string | null;
  is_anonymous: boolean;
  created_at: string;
};

export type PotPayout = {
  id: string;
  pot_id: string;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  status: PayoutStatus;
  paid_at: string;
  created_at: string;
};

export type PotFormValues = {
  title: string;
  description: string | null;
  event_type: PotEventType;
  event_date: string | null;
  currency: "EUR" | "USD" | "GBP";
  goal_amount: number | null;
  privacy_mode: PotPrivacyMode;
  mystery_mode?: boolean;
  messages_visible_to_beneficiary?: boolean;
};
