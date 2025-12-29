"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/context"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { User, Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { login, state } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const isLoading = state.status === 'authenticating'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login({ email, password })
      window.location.href = '/dashboard'; // Force hard navigation to ensure state is fresh
    } catch (err: any) {
      setError(err.message || "Failed to login")
    }
  }

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-background font-sans text-foreground">
      {/* Left Panel - Hero Section */}
      <div className="hidden w-1/2 flex-col justify-between bg-zinc-900 p-12 text-white lg:flex relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-primary to-purple-900 opacity-90" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay opacity-20" />

        <div className="relative z-10">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <span className="font-bold">N</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">NexusHR</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Enterprise-Grade <br />
            <span className="text-indigo-300">Human Resources</span>
          </h1>
          <p className="text-lg text-indigo-100">
            Streamline your workforce management with our AI-powered platform.
            Automate payroll, track attendance, and manage performance in one unified system.
          </p>
          <div className="space-y-4 pt-4">
            {[
              "Automated Payroll Processing",
              "Smart Attendance Tracking",
              "Performance Analytics"
            ].map((item) => (
              <div key={item} className="flex items-center space-x-3 text-indigo-100">
                <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-indigo-200">
          © 2024 NexusHR Enterprises. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full flex-col justify-center p-8 lg:w-1/2 lg:p-12 xl:p-24 bg-surface lg:bg-background">
        <div className="mx-auto w-full max-w-sm space-y-8 animate-fade-in">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-display font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">
              Enter your credentials to access your workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
                <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm font-medium text-primary hover:text-primary/80">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive font-medium animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base group shadow-lg shadow-primary/20"
              isLoading={isLoading}
            >
              Sign In
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
