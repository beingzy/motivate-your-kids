// Motivational micro-copy for earn and deduct toasts.

const EARN: Record<string, string[]> = {
  en: [
    'Amazing work! 🌟',
    'Keep it up! 🚀',
    "You're on fire! 🔥",
    'So proud of you! 💛',
    'Nailed it! ⭐',
    'Incredible effort! 💪',
    "You're a superstar! ✨",
    'Way to go! 🎉',
    "You're crushing it! 🏆",
    'Brilliant! 🌈',
  ],
}

const DEDUCT: Record<string, string[]> = {
  en: [
    "Let's do better next time.",
    'Every day is a fresh start. 💛',
    'We believe in you!',
    "Keep going — you've got this.",
    'Tomorrow is a new day!',
  ],
}

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randomEarnPhrase(locale = 'en'): string {
  return pick(EARN[locale] ?? EARN.en)
}

export function randomDeductPhrase(locale = 'en'): string {
  return pick(DEDUCT[locale] ?? DEDUCT.en)
}
