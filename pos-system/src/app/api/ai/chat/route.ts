import { createAdminClient } from '@/lib/supabase/admin'
import { getGeminiModel, AI_SYSTEM_PROMPT } from '@/lib/gemini'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    console.log('AI Chat: Fetching context...')
    
    // 1. Fetch relevant context for the AI
    const { data: lowStockProducts, error: contextError } = await supabase
      .from('products')
      .select('name, quantity, low_stock_threshold, category')
      .lt('quantity', 10)
      .limit(10)

    if (contextError) {
      console.error('AI Chat Context Error:', contextError)
    }

    const { data: recentSales } = await supabase
      .from('sales')
      .select('total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    const context = `
[Context]
Low Stock Products: ${JSON.stringify(lowStockProducts || [])}
Recent Sales: ${JSON.stringify(recentSales || [])}
Current Time: ${new Date().toLocaleString()}
`

    console.log('AI Chat: Context fetched. Initializing Gemini...')
    
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is missing in environment')
    }

    // 2. Initialize Gemini
    const model = getGeminiModel()
    const chat = model.startChat({
      history: history || [],
      generationConfig: {
        maxOutputTokens: 500,
      },
    })

    console.log('AI Chat: Sending message...')

    // 3. Send message with system prompt and context
    const fullPrompt = history && history.length > 0 
      ? `${context}\nUser: ${message}`
      : `${AI_SYSTEM_PROMPT}\n${context}\nUser: ${message}`

    const result = await chat.sendMessage(fullPrompt)
    const response = await result.response
    const text = response.text()

    console.log('AI Chat: Response received')

    return NextResponse.json({ text })
  } catch (error: any) {
    console.error('AI Chat Route Fatal Error:', error)
    return NextResponse.json({ 
      error: error.message || 'AI failed to respond',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 })
  }
}
