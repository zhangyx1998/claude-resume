export type ClaudeAgent = {
  kind?: string;
  status?: string;
  sessionId?: string;
  name?: string;
  startedAt?: number | string;
  cwd?: string;
};

export type Args = {
  targetTime?: string;
  session?: string;
  prompt?: string;
  compact: boolean;
};
