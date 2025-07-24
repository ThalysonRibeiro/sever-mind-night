import { INVALID_EMAIL_DOMAINS } from "./invalid-email-domains.ts";
import { minimatch } from 'minimatch'

export function isValidEmail(email: string): boolean {
  const normalized = email.toLowerCase().trim()

  if (!normalized.includes('@')) return false

  const [_, domain] = normalized.split('@')

  // Verifica contra todos os padrões, inclusive wildcards
  return !INVALID_EMAIL_DOMAINS.some((pattern) =>
    minimatch(normalized, pattern) || minimatch(domain, pattern)
  )
}