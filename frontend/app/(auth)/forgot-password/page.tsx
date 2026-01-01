"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { env } from "@/lib/env"

type Step = "email" | "otp" | "password" | "success"

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [step, setStep] = useState<Step>("email")
    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [resetToken, setResetToken] = useState("")
    const [isNewEmployee, setIsNewEmployee] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [devOtp, setDevOtp] = useState<string | null>(null)

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setDevOtp(null)
        setLoading(true)

        try {
            const res = await fetch(`${env.apiBaseUrl}/auth/otp/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error?.message || data.message || "Failed to send OTP")
            }

            setIsNewEmployee(data.data?.isNewEmployee || false)
            // In development, the OTP is returned in the response
            if (data.data?.devOtp) {
                setDevOtp(data.data.devOtp)
            }
            setMessage("If an account exists with this email, an OTP has been sent.")
            setStep("otp")
        } catch (err: any) {
            setError(err.message || "Failed to send OTP")
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const res = await fetch(`${env.apiBaseUrl}/auth/otp/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error?.message || data.message || "Invalid OTP")
            }

            setResetToken(data.data?.resetToken)
            setIsNewEmployee(data.data?.isNewEmployee || false)
            setStep("password")
        } catch (err: any) {
            setError(err.message || "Invalid OTP")
        } finally {
            setLoading(false)
        }
    }

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password.length < 8) {
            setError("Password must be at least 8 characters")
            return
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        setLoading(true)

        try {
            const res = await fetch(`${env.apiBaseUrl}/auth/otp/set-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, resetToken, newPassword: password }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error?.message || data.message || "Failed to set password")
            }

            setStep("success")
        } catch (err: any) {
            setError(err.message || "Failed to set password")
        } finally {
            setLoading(false)
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
                        {isNewEmployee ? "Welcome to" : "Reset Your"} <br />
                        <span className="text-indigo-300">{isNewEmployee ? "NexusHR" : "Password"}</span>
                    </h1>
                    <p className="text-lg text-indigo-100">
                        {isNewEmployee
                            ? "Set up your account to access the employee portal. You'll need the OTP sent to your email."
                            : "Enter your email to receive a one-time password (OTP) for resetting your password."}
                    </p>
                </div>

                <div className="relative z-10 text-sm text-indigo-200">
                    © 2024 NexusHR Enterprises. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex w-full flex-col justify-center p-8 lg:w-1/2 lg:p-12 xl:p-24 bg-surface lg:bg-background">
                <div className="mx-auto w-full max-w-sm space-y-8 animate-fade-in">
                    {/* Back button */}
                    <button
                        type="button"
                        onClick={() => step === "email" ? router.push("/login") : setStep("email")}
                        className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {step === "email" ? "Back to Login" : "Start Over"}
                    </button>

                    {/* Step Indicators */}
                    <div className="flex items-center gap-2">
                        {["email", "otp", "password", "success"].map((s, i) => (
                            <div
                                key={s}
                                className={`h-2 flex-1 rounded-full transition-colors ${(step === "email" && i === 0) ||
                                    (step === "otp" && i <= 1) ||
                                    (step === "password" && i <= 2) ||
                                    (step === "success" && i <= 3)
                                    ? "bg-primary"
                                    : "bg-zinc-200"
                                    }`}
                            />
                        ))}
                    </div>

                    {/* STEP 1: Email */}
                    {step === "email" && (
                        <>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-display font-bold tracking-tight">
                                    Forgot Password?
                                </h2>
                                <p className="text-muted-foreground">
                                    Enter your email address and we'll send you an OTP to reset your password.
                                </p>
                            </div>

                            <form onSubmit={handleRequestOtp} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="pl-10"
                                        />
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        {error}
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sending OTP...
                                        </>
                                    ) : (
                                        "Send OTP"
                                    )}
                                </Button>
                            </form>
                        </>
                    )}

                    {/* STEP 2: OTP Verification */}
                    {step === "otp" && (
                        <>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-display font-bold tracking-tight">
                                    Enter OTP
                                </h2>
                                <p className="text-muted-foreground">
                                    We've sent a 6-digit code to <strong>{email}</strong>. Enter it below.
                                </p>
                            </div>

                            {message && (
                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {message}
                                </div>
                            )}

                            {devOtp && (
                                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                                    <p className="text-xs text-amber-700 font-medium mb-1">🔧 Development Mode</p>
                                    <p className="text-lg font-mono font-bold text-amber-900 tracking-wider">
                                        OTP: {devOtp}
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handleVerifyOtp} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="otp">One-Time Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="otp"
                                            type="text"
                                            placeholder="123456"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                            required
                                            maxLength={6}
                                            className="pl-10 text-center text-2xl tracking-[0.5em] font-mono"
                                        />
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        OTP expires in 10 minutes
                                    </p>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        {error}
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        "Verify OTP"
                                    )}
                                </Button>

                                <button
                                    type="button"
                                    onClick={handleRequestOtp}
                                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Didn't receive the code? Resend OTP
                                </button>
                            </form>
                        </>
                    )}

                    {/* STEP 3: Set Password */}
                    {step === "password" && (
                        <>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-display font-bold tracking-tight">
                                    {isNewEmployee ? "Create Your Password" : "Set New Password"}
                                </h2>
                                <p className="text-muted-foreground">
                                    {isNewEmployee
                                        ? "Choose a strong password for your new account."
                                        : "Enter your new password below."}
                                </p>
                            </div>

                            <form onSubmit={handleSetPassword} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={8}
                                            className="pl-10"
                                        />
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            minLength={8}
                                            className="pl-10"
                                        />
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p className={password.length >= 8 ? "text-green-600" : ""}>
                                        {password.length >= 8 ? "✓" : "•"} At least 8 characters
                                    </p>
                                    <p className={password === confirmPassword && password.length > 0 ? "text-green-600" : ""}>
                                        {password === confirmPassword && password.length > 0 ? "✓" : "•"} Passwords match
                                    </p>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        {error}
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Setting Password...
                                        </>
                                    ) : isNewEmployee ? (
                                        "Create Account"
                                    ) : (
                                        "Reset Password"
                                    )}
                                </Button>
                            </form>
                        </>
                    )}

                    {/* STEP 4: Success */}
                    {step === "success" && (
                        <div className="text-center space-y-6">
                            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-display font-bold tracking-tight">
                                    {isNewEmployee ? "Account Created!" : "Password Reset!"}
                                </h2>
                                <p className="text-muted-foreground">
                                    {isNewEmployee
                                        ? "Your account has been created successfully. You can now log in with your new credentials."
                                        : "Your password has been reset successfully. You can now log in with your new password."}
                                </p>
                            </div>
                            <Button onClick={() => router.push("/login")} className="w-full">
                                Go to Login
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
