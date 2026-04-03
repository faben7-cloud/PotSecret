export type PotEventType = "birthday" | "farewell" | "birth" | "wedding" | "other";
export type PotPrivacyMode = "total_only" | "standard" | "blind_to_owner";
export type PotStatus = "draft" | "open" | "closed" | "completed";
export type ContributionStatus = "pending" | "confirmed" | "failed" | "refunded";

export type PotFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"title" | "description" | "event_date" | "goal_amount", string>>;
};

export type CreatePotFormState = PotFormState;

export type ContributionFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"amount" | "display_name" | "message" | "consent", string>>;
};

export type PotSummary = {
  id: string;
  title: string;
  event_type: PotEventType;
  privacy_mode: PotPrivacyMode;
  status: PotStatus;
  currency: string;
  share_token: string;
  confirmed_total_amount: number;
  confirmed_contribution_count: number;
  created_at: string;
};

export type PublicPot = {
  id: string;
  share_token: string;
  title: string;
  description: string | null;
  event_type: PotEventType;
  event_date: string | null;
  currency: string;
  goal_amount: number | null;
  privacy_mode: PotPrivacyMode;
  status: PotStatus;
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
  status: PotStatus;
  share_token: string;
  messages_visible_to_beneficiary: boolean;
  confirmed_total_amount: number;
  confirmed_contribution_count: number;
  created_at: string;
};

export type PotContribution = {
  id: string;
  amount: number | null;
  contributor_display_name: string | null;
  is_anonymous: boolean;
  status: ContributionStatus;
  created_at: string;
};

export type PotMessage = {
  id: string;
  contribution_id: string | null;
  body: string;
  author_display_name: string | null;
  is_anonymous: boolean;
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
  messages_visible_to_beneficiary?: boolean;
};
