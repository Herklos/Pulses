// ---------------------------------------------------------------------------
// User Profile — stored in profile/{identity}, plaintext
// ---------------------------------------------------------------------------

export interface UserProfile {
  userId: string;
  displayName: string;
  updatedAt: string; // ISO-8601
}

// ---------------------------------------------------------------------------
// User Index — stored in user-index/{identity}, encrypted with user's own key
// ---------------------------------------------------------------------------

export interface ConversationIndexEntry {
  conversationId: string; // UUID
  conversationKey: string; // hex-encoded 256-bit AES key for this conversation
  name: string; // display name (group name or other user's display name)
  isGroup: boolean;
  lastMessageAt: string; // ISO-8601, used for sorting
  lastMessagePreview: string; // first ~60 chars of last message text
  createdAt: string; // ISO-8601
}

export interface UserIndex {
  version: number;
  conversations: ConversationIndexEntry[];
  updatedAt: string; // ISO-8601
}

// ---------------------------------------------------------------------------
// Conversation Meta — stored in conv/{conversationId}/meta, encrypted with conversationKey
// ---------------------------------------------------------------------------

export interface ConversationMember {
  userId: string;
  displayName: string;
  role: "admin" | "member";
  joinedAt: string; // ISO-8601
}

export interface ConversationMeta {
  conversationId: string;
  name: string;
  isGroup: boolean;
  members: ConversationMember[];
  createdBy: string; // userId
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
  // List of YYYY-MM-DD date keys that have messages.
  // Client uses this to know which day-documents to fetch for history.
  activeDateKeys: string[];
}

// ---------------------------------------------------------------------------
// Messages — stored in conv/{conversationId}/msg/{dateKey}, encrypted with conversationKey
// ---------------------------------------------------------------------------

export interface Message {
  id: string; // UUID — used for deduplication during conflict resolution
  conversationId: string;
  senderId: string; // userId
  senderName: string; // display name at time of send (denormalized)
  text: string;
  timestamp: string; // ISO-8601 — used for ordering and union merge
  editedAt?: string; // ISO-8601, set if the message was edited
  deleted?: boolean; // soft-delete tombstone
}

export interface DayMessages {
  conversationId: string;
  dateKey: string; // YYYY-MM-DD
  messages: Message[];
  updatedAt: string; // ISO-8601
}
