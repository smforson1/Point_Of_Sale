
import { createAdminClient } from '@/lib/supabase/admin'
import { userSchema } from '@/lib/validations'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = userSchema.parse(body)

    if (!validatedData.password) {
      return NextResponse.json({ error: 'Password is required for new users' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true,
      user_metadata: {
        full_name: validatedData.full_name,
        role: validatedData.role,
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    return NextResponse.json({ user: userData.user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 })
  }
}
