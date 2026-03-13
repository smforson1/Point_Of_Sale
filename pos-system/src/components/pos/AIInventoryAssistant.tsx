'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Send, Sparkles, User, Loader2, RefreshCw, BarChart2, PackageSearch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface Message {
  role: 'user' | 'model'
  parts: [{ text: string }]
}

export function AIInventoryAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input
    if (!textToSend.trim() || isLoading) return

    const userMessage: Message = { 
      role: 'user', 
      parts: [{ text: textToSend }] 
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: textToSend,
          history: messages 
        }),
      })

      const data = await response.json()
      
      if (data.error) {
        toast.error(data.error)
      } else {
        const aiMessage: Message = {
          role: 'model',
          parts: [{ text: data.text }]
        }
        setMessages(prev => [...prev, aiMessage])
      }
    } catch (error) {
      toast.error('Failed to connect to AI')
    } finally {
      setIsLoading(false)
    }
  }

  const quickActions = [
    { label: 'Low Stock Report', icon: PackageSearch, prompt: 'Give me a summary of products with low stock and what I should order.' },
    { label: 'Sales Trends', icon: BarChart2, prompt: 'Based on recent sales, what are my best selling categories right now?' },
    { label: 'Restock Advice', icon: RefreshCw, prompt: 'How should I optimize my inventory for the next week?' },
  ]

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative group overflow-hidden border-primary/20 hover:border-primary/50 bg-primary/5 dark:bg-primary/10">
          <Bot className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
          <span className="sr-only">AI Assistant</span>
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] flex flex-col p-0 gap-0">
        <SheetHeader className="p-6 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <SheetTitle className="text-xl">Inventory Assistant</SheetTitle>
              <SheetDescription>Powered by Gemini 2.5 Flash</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
                <Bot className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-lg">Hello! I'm your AI consultant.</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  I have access to your inventory and recent sales. How can I help you today?
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Suggestions</p>
                <div className="grid gap-2">
                  {quickActions.map((action) => (
                    <Button 
                      key={action.label}
                      variant="outline" 
                      className="justify-start gap-3 h-auto py-3 text-left"
                      onClick={() => handleSend(action.prompt)}
                    >
                      <action.icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div 
              key={i} 
              className={cn(
                "flex gap-3",
                m.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                m.role === 'user' ? "bg-muted" : "bg-primary text-primary-foreground"
              )}>
                {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={cn(
                "p-3 rounded-2xl max-w-[85%] text-sm",
                m.role === 'user' 
                  ? "bg-muted rounded-tr-none" 
                  : "bg-primary/5 border border-primary/10 rounded-tl-none text-foreground"
              )}>
                <p className="whitespace-pre-wrap leading-relaxed">{m.parts[0].text}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-2xl rounded-tl-none p-4 flex gap-2 items-center">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-medium">Assistant is thinking...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-muted/20">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input 
              placeholder="Ask about your stock..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="bg-background border-primary/20 focus-visible:ring-primary"
            />
            <Button size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-[10px] text-center text-muted-foreground mt-3">
            AI can make mistakes. Please verify critical stock data.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
