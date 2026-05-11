export function generateSessionId(): string {
  return "sess_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
