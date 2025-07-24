export const PLANS_INTERPRETATION_QUOTA = {
  FREE: { dailyCredits: 1, weeklyCredits: 1 },
  TRIAL: { dailyCredits: 1, weeklyCredits: 1 },
  NORMAL: { dailyCredits: 1, weeklyCredits: 1 },
  PREMIUM: { dailyCredits: 9999, weeklyCredits: 9999 }, // ilimitado
} as const;