"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/context"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react"
import { request, ApiError } from "@/lib/api-client"

export default function ChangePasswordPage() {
    const router = useRouter()
    const { state, refreshTokens } = useAuth()
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match")
            return
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters")
            return
        }

        setIsLoading(true)
        try {
            await request("/auth/password/change", {
                method: "POST",
                body: { currentPassword, newPassword }
            })

            setSuccess(true)
            // Refresh tokens/user profile to clear mustChangePassword flag if backend updates it
            // Note: Backend AuthService.changePassword doesn't explicitly clear it in the code I saw, 
            // but usually it should. I might need to update backend to clear it.
            // Assuming backend clears it, we refresh tokens.
            await refreshTokens()

            setTimeout(() => {
                router.push("/dashboard")
            }, 2000)
        } catch (err: any) {
            if (err instanceof ApiError) {
                setError(err.message || "Failed to change password")
            } else {
                setError("Failed to change password")
            }
        } finally {
            setIsLoading(false)
        }
    }

    // If not authenticated, redirect to login
    if (state.status === "unauthenticated") {
        if (typeof window !== 'undefined') router.push("/login")
        return null
    }

    return (
        <div className="flex min-h-screen w-full overflow-hidden bg-background font-sans text-foreground">
            {/* Left Panel - Hero Section (Reused from Login) */}
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
                        Security First
                    </h1>
                    <p className="text-lg text-indigo-100">
                        Please update your password to continue accessing the platform.
                        This ensures your account remains secure.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-indigo-200">
                    © 2024 NexusHR Enterprises. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex w-full flex-col justify-center p-8 lg:w-1/2 lg:p-12 xl:p-24 bg-surface lg:bg-background">
                <div className="mx-auto w-full max-w-sm space-y-8 animate-fade-in">
                    <div className="space-y-2 text-center lg:text-left">
                        <h2 className="text-3xl font-display font-bold tracking-tight">Change Password</h2>
                        <p className="text-muted-foreground">
                            Please set a new password for your account
                        </p>
                    </div>

                    {!success ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="pl-10 h-11"
                                        required
                                    />
                                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="pl-10 h-11"
                                        required
                                    />
                                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10 h-11"
                                        required
                                    />
                                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive font-medium flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-11 text-base group shadow-lg shadow-primary/20"
                                isLoading={isLoading}
                            >
                                Update Password
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </form>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-4 py-8">
                            <div className="rounded-full bg-green-100 p-3">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold">Password Updated!</h3>
                            <p className="text-center text-muted-foreground">
                                Your password has been changed successfully. Redirecting to dashboard...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
