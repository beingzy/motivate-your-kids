/**
 * Structured auth event logger.
 * Logs to console with a consistent prefix so auth events are easy to grep
 * in Vercel / server logs.
 */

type AuthEvent =
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'signup_attempt'
  | 'signup_success'
  | 'signup_failure'
  | 'signup_existing_account'
  | 'verify_attempt'
  | 'verify_success'
  | 'verify_failure'
  | 'resend_attempt'
  | 'resend_success'
  | 'resend_failure'
  | 'callback_code_exchange'
  | 'callback_success'
  | 'callback_failure'
  | 'callback_no_code'
  | 'middleware_session_refresh'
  | 'middleware_session_error'
  | 'middleware_redirect_login'

interface AuthLogPayload {
  event: AuthEvent
  email?: string
  error?: string
  detail?: string
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const masked = local.length <= 2 ? '*' : local[0] + '***' + local[local.length - 1]
  return `${masked}@${domain}`
}

export function authLog({ event, email, error, detail }: AuthLogPayload) {
  const timestamp = new Date().toISOString()
  const payload: Record<string, string> = { event, timestamp }
  if (email) payload.email = maskEmail(email)
  if (error) payload.error = error
  if (detail) payload.detail = detail

  const isError = event.endsWith('_failure') || event.endsWith('_error')
  const prefix = '[auth]'

  if (isError) {
    console.error(prefix, JSON.stringify(payload))
  } else {
    console.log(prefix, JSON.stringify(payload))
  }
}
