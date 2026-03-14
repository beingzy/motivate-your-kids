import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/** POST /api/invite/accept — Accept an invite and join the family */
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized — please sign up or log in first' }, { status: 401 })
  }

  const { token, displayName, relationship } = await request.json() as {
    token: string
    displayName: string
    relationship: string
  }

  // Use the SECURITY DEFINER RPC to accept the invite
  const { data: familyId, error } = await supabase.rpc('accept_invite', {
    p_token: token,
    p_user_id: user.id,
    p_email: user.email!,
    p_display_name: displayName,
    p_relationship: relationship,
  })

  if (error) {
    const msg = error.message || 'Failed to accept invite'
    const status = msg.includes('expired') ? 410
      : msg.includes('Already') ? 409
      : msg.includes('Invalid') ? 404
      : 500
    return NextResponse.json({ error: msg }, { status })
  }

  return NextResponse.json({ familyId })
}
