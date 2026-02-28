// NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA is automatically injected by Vercel on every deploy.
// In local dev it is undefined, so we fall back to 'dev'.
export const APP_VERSION: string =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? 'dev'
