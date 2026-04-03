import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { reference, otp } = await req.json()
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!secretKey || secretKey === 'sk_test_xxxxxx') {
      return NextResponse.json({ 
        status: false, 
        message: 'Paystack Secret Key not configured' 
      }, { status: 500 })
    }

    const response = await fetch('https://api.paystack.co/charge/submit_otp', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference,
        otp, // This is where the Vodafone/Telecel Voucher goes
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Paystack Submit OTP Error:', error)
    return NextResponse.json({ status: false, message: error.message }, { status: 500 })
  }
}
