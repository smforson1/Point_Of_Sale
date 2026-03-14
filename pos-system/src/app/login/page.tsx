'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormValues } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, UserCog, ShoppingCart } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

const DEMO_ROLES = [
  {
    role: 'Admin',
    icon: ShieldCheck,
    color: 'bg-violet-500/10 border-violet-500/30 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400',
    badgeColor: 'bg-violet-500 text-white',
    description: 'Full access to all features, settings, and user management.',
    access: ['Dashboard', 'POS', 'Products', 'Reports', 'Users', 'Settings'],
  },
  {
    role: 'Manager',
    icon: UserCog,
    color: 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400',
    badgeColor: 'bg-blue-500 text-white',
    description: 'Access to sales, inventory, customers, and reports.',
    access: ['Dashboard', 'POS', 'Products', 'Inventory', 'Customers', 'Reports'],
  },
  {
    role: 'Cashier',
    icon: ShoppingCart,
    color: 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    badgeColor: 'bg-emerald-500 text-white',
    description: 'Access to POS only for processing sales.',
    access: ['POS Screen only'],
  },
]

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [highlightedRole, setHighlightedRole] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const setProfile = useAuthStore((state) => state.setProfile)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        toast.error(authError.message)
        setIsLoading(false)
        return
      }

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (profileError) {
          toast.error('Failed to fetch user profile')
          setIsLoading(false)
          return
        }

        setProfile(profile)
        toast.success(`Logged in as ${profile.role}`)

        if (profile.role === 'CASHIER') {
          router.push('/pos')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (values: LoginFormValues) => {
    await handleLogin(values.email, values.password)
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel — Role Info */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-card border-r border-border p-10">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-primary rounded-lg">
              <ShoppingCart className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">POS Master Pro</span>
          </div>

          <h2 className="text-2xl font-bold mb-2">User Roles</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Each role has different access levels. Select a role below to see what each user can access.
          </p>

          <div className="space-y-4">
            {DEMO_ROLES.map((item) => (
              <div
                key={item.role}
                className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 ${item.color} ${highlightedRole === item.role ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setHighlightedRole(highlightedRole === item.role ? null : item.role)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-5 w-5" />
                    <span className="font-semibold">{item.role}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.role.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{item.description}</p>
                <div className="flex flex-wrap gap-1">
                  {item.access.map((a) => (
                    <span key={a} className="text-[10px] bg-background/60 border border-border rounded px-2 py-0.5 font-medium">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} POS Master Pro. All rights reserved.
        </p>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-4">
            <div className="p-2 bg-primary rounded-lg">
              <ShoppingCart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">POS Master Pro</span>
          </div>

          <Card className="shadow-lg border-t-4 border-t-primary">
            <CardHeader className="space-y-1 text-center pb-4">
              <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      className="pl-10"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                </div>

                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs text-muted-foreground">
                  <span className="bg-card px-3">Quick Demo Access</span>
                </div>
              </div>

              {/* Demo Role Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ROLES.map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      setHighlightedRole(item.role)
                      toast(`👆 Enter your ${item.role} credentials above`, { duration: 2500 })
                    }}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-200 ${item.color} disabled:opacity-50`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-xs font-semibold">{item.role}</span>
                  </button>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Click a role to highlight its permissions on the left panel.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
