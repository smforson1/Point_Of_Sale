import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const reference = searchParams.get('reference')
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!reference) {
      return NextResponse.json({ status: false, message: 'Reference is required' }, { status: 400 })
    }

    if (!secretKey || secretKey === 'sk_test_xxxxxx') {
      return NextResponse.json({ 
        status: false, 
        message: 'Paystack Secret Key not configured' 
      }, { status: 500 })
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Paystack Verification Error:', error)
    return NextResponse.json({ status: false, message: error.message }, { status: 500 })
  }
}
