import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

/** POST /api/invite — Create an invite and optionally send email */
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { familyId, email, relationship } = body as {
    familyId: string
    email?: string
    relationship: string
  }

  // Verify the user is a member of this family
  const { data: members } = await supabase
    .from('family_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('family_id', familyId)

  const member = members?.[0]
  if (!member) {
    return NextResponse.json({ error: 'Not a member of this family' }, { status: 403 })
  }

  // Generate a unique invite token
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  // Insert invite (RLS allows family members to insert)
  const { data: invite, error: insertError } = await supabase
    .from('invites')
    .insert({
      family_id: familyId,
      invited_by: member.id,
      email: email || null,
      token,
      relationship,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteLink = `${appUrl}/invite?token=${token}`

  // Send email if address provided
  if (email) {
    const { data: families } = await supabase
      .from('families')
      .select('name')
      .eq('id', familyId)

    const familyName = families?.[0]?.name || 'a family'

    try {
      await resend.emails.send({
        from: 'Motivate Your Kids <onboarding@resend.dev>',
        to: email,
        subject: `You're invited to join ${familyName} on Motivate Your Kids!`,
        html: `
          <div style="font-family: 'Nunito', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h1 style="color: #58CC02; font-size: 24px;">You're invited!</h1>
            <p style="color: #3C3C3C; font-size: 16px; line-height: 1.6;">
              You've been invited to join <strong>${familyName}</strong> on Motivate Your Kids —
              a fun app for families to track and reward kids' achievements.
            </p>
            <a href="${inviteLink}" style="
              display: inline-block;
              background: #58CC02;
              color: white;
              padding: 14px 28px;
              border-radius: 16px;
              text-decoration: none;
              font-weight: 700;
              font-size: 16px;
              margin: 16px 0;
              box-shadow: 0 4px 0 #46A302;
            ">Join Family</a>
            <p style="color: #9CA3AF; font-size: 13px; margin-top: 24px;">
              This invite expires in 24 hours.
            </p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError)
    }
  }

  return NextResponse.json({ invite, inviteLink })
}

/** GET /api/invite?token=xxx — Validate an invite token */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.rpc('validate_invite', { p_token: token })

  if (error) {
    const msg = error.message || 'Invalid invite'
    const status = msg.includes('expired') ? 410 : 404
    return NextResponse.json({ error: msg }, { status })
  }

  return NextResponse.json({ invite: data })
}
