import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { amount, email, phone, provider, metadata } = await req.json()
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!secretKey || secretKey === 'sk_test_xxxxxx') {
      return NextResponse.json({ 
        status: false, 
        message: 'Paystack Secret Key not configured. Please add your real key to .env.local' 
      }, { status: 500 })
    }

    // Multiply by 100 because Paystack expects amount in the smallest subunit (e.g. pesewas for GHS)
    const paystackAmount = Math.round(amount * 100)

    const response = await fetch('https://api.paystack.co/charge', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: paystackAmount,
        email,
        currency: 'GHS',
        metadata,
        mobile_money: {
          phone,
          provider: provider.toLowerCase() === 'telecel' ? 'vod' : (provider.toLowerCase() === 'tigo' ? 'atl' : provider.toLowerCase()), 
        }
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Paystack Charge Error:', error)
    return NextResponse.json({ status: false, message: error.message }, { status: 500 })
  }
}
