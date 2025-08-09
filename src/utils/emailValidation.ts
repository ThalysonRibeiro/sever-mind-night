import { INVALID_EMAIL_DOMAINS } from "./invalid-email-domains.ts";

export function isValidEmail(email: string): boolean {
  // Verificar se o email tem formato válido
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // Extrair o domínio do email
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return false;
  }

  return !INVALID_EMAIL_DOMAINS.some(invalidDomain => {
    if (invalidDomain.startsWith('*.')) {
      return domain.endsWith(invalidDomain.replace('*.', ''));
    }
    return domain === invalidDomain;
  });
}