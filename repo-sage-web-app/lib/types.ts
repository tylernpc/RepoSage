export const Status = {
  Idle: "idle",
  Loading: "loading",
  Success: "success",
  Error: "error",
} as const;

export type Status = (typeof Status)[keyof typeof Status];

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type Document = {
  id: number;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
  status: string;
  checksum: string | null;
};
