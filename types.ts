export type LogEntry = {
  id: string;
  timestamp: number;
  text: string;
  ans1?: string;
  ans2?: string;
};
export const LOG_KEY      = '@somni_log';
export const DIAG_LOG_KEY = '@somni_diag';