"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/Dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { Mail, Phone, MapPin, Briefcase, Building, Calendar, X } from "lucide-react"
import { env } from "@/lib/env"
import { useAuth } from "@/lib/auth/context"
import { Button } from "@/components/ui/Button"

interface ProfileDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ isOpen, onOpenChange }: ProfileDialogProps) {
    const { state } = useAuth()
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchProfile()
        }
    }, [isOpen])

    const fetchProfile = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${env.apiBaseUrl}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${state.tokens?.accessToken}`
                }
            })
            const data = await res.json()
            if (data.success) {
                setProfile(data.data.employee)
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl bg-white">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center space-y-4">
                        <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-muted-foreground font-medium">Fetching profile...</p>
                    </div>
                ) : profile ? (
                    <>
                        {/* Banner Space */}
                        <div className="h-32 bg-gradient-to-r from-primary via-indigo-600 to-violet-700 w-full relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onOpenChange(false)}
                                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                            <div className="absolute -bottom-12 left-8">
                                <Avatar className="h-24 w-24 border-[6px] border-white shadow-xl">
                                    <AvatarImage src={`https://ui-avatars.com/api/?name=${profile?.personal?.firstName}+${profile?.personal?.lastName}&size=128&background=6366f1&color=fff`} />
                                    <AvatarFallback className="text-2xl font-bold bg-indigo-500 text-white">
                                        {profile?.personal?.firstName?.[0]}
                                        {profile?.personal?.lastName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </div>

                        <div className="pt-16 pb-8 px-8 space-y-8">
                            {/* Header Info */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
                                        {profile?.personal?.firstName} {profile?.personal?.lastName}
                                    </h2>
                                    <Badge className="bg-primary/10 text-primary border-none font-semibold px-3 overflow-hidden">
                                        {state.roles?.[0]?.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                </div>
                                <p className="text-zinc-500 font-medium flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-zinc-400" />
                                    {profile?.professional?.title || "Employee"} <span className="text-zinc-300">|</span> {profile?.professional?.department}
                                </p>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 gap-6">
                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.1em]">Contact Information</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100 transition-all hover:border-primary/20 hover:bg-white hover:shadow-sm">
                                            <div className="mt-1 p-2 rounded-lg bg-white shadow-sm text-primary">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Email</span>
                                                <span className="text-sm font-semibold truncate text-zinc-700">{profile?.personal?.contact?.email}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100 transition-all hover:border-primary/20 hover:bg-white hover:shadow-sm">
                                            <div className="mt-1 p-2 rounded-lg bg-white shadow-sm text-primary">
                                                <Phone className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Phone</span>
                                                <span className="text-sm font-semibold text-zinc-700">{profile?.personal?.contact?.phone || "Not Provided"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.1em]">Professional Details</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100 transition-all hover:border-primary/20 hover:bg-white hover:shadow-sm">
                                            <div className="mt-1 p-2 rounded-lg bg-white shadow-sm text-primary">
                                                <Building className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Employment</span>
                                                <span className="text-sm font-semibold text-zinc-700 lowercase first-letter:uppercase">{(profile?.professional?.employmentType || "Full Time").replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100 transition-all hover:border-primary/20 hover:bg-white hover:shadow-sm">
                                            <div className="mt-1 p-2 rounded-lg bg-white shadow-sm text-primary">
                                                <Calendar className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Joining Date</span>
                                                <span className="text-sm font-semibold text-zinc-700">
                                                    {profile?.professional?.startDate ? new Date(profile.professional.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {profile?.personal?.addresses?.current && (
                                    <section className="space-y-4">
                                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.1em]">Current Location</h3>
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100 transition-all hover:border-primary/20 hover:bg-white hover:shadow-sm w-full">
                                            <div className="mt-1 p-2 rounded-lg bg-white shadow-sm text-primary">
                                                <MapPin className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Residential Address</span>
                                                <span className="text-sm font-semibold text-zinc-700">
                                                    {[
                                                        profile.personal.addresses.current.line1,
                                                        profile.personal.addresses.current.city,
                                                        profile.personal.addresses.current.country
                                                    ].filter(Boolean).join(", ")}
                                                </span>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="p-12 text-center text-muted-foreground font-medium">
                        Could not load profile information.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
