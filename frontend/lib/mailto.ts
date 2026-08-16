// Builds a mailto: link so contact/quote/request-part forms open the
// visitor's own email client instead of relaying through a backend SMTP
// server -- the business receives the message straight from the visitor's
// real address (their client sets the From header), with zero email
// infrastructure to configure or maintain.
export function buildMailtoUrl(to: string, subject: string, bodyLines: Array<[string, string | undefined | null]>): string {
  const body = bodyLines
    .filter(([, value]) => value && String(value).trim())
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
