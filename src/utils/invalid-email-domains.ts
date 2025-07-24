export const BLOCKED_EMAILS: string[] = [
  'test@test.com',
  'admin@admin.com',
  'email@email.com',
]

export const INVALID_EMAIL_DOMAINS: string[] = [
  // Domínios de teste comuns
  'test.com',
  'example.com',
  'mock.com',
  'temp.com',
  'fake.com',

  // Serviços de email descartáveis
  'mailinator.com',
  'guerrillamail.com',
  'dispostable.com',
  '10minutemail.com',
  'throwawaymail.com',
  'tempmail.com',
  'yopmail.com',
  'sharklasers.com',
  'spam4.me',
  'temp-mail.org',
  'moakt.com',
  'burnermail.io',
  'trashmail.com',
  'tempemail.net',

  // Domínios de teste específicos
  'exemplo.com.br',
  'teste.com.br',
  'email.teste',

  // Provedores de email temporário
  '1secmail.com',
  'getairmail.com',
  'anonymousemail.me',
  'spambox.us',
  'boximail.com',
  'dropmail.me',

  // Variações comuns
  'example.org',
  'example.net',
  'email.example',

  // Domínios genéricos de placeholder
  'placeholder.com',
  'invalid.com',
  'none.com',

  // Domínios de teste de desenvolvimento
  'dev.com',
  'localhost',
  'local',

  // Serviços de geração de email falso
  'fakeinbox.com',
  'temporarymail.com',
  'trashmail.net',
  'throwawayemails.com',
  'emailondeck.com',

  // Variações com subdomínios
  '*.test.com',
  '*.example.com',
  '*.mock.com',

  // Outros domínios comuns de teste
  'null.com',
  'void.com',
  'dummy.com',

  //erros de email
  '@gmal.com',
  '@mail.com.br',
];