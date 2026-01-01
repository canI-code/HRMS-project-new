import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
} from "@/components/ui/Dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { Mail, Phone, MapPin, Briefcase, Building, Calendar, X, Save, User as UserIcon, Globe, Home } from "lucide-react"
import { env } from "@/lib/env"
import { useAuth } from "@/lib/auth/context"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"


interface ProfileDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ isOpen, onOpenChange }: ProfileDialogProps) {
    const { state } = useAuth()
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form options
    const [formOptions, setFormOptions] = useState<{
        departments: { value: string; label: string }[];
        titles: { value: string; label: string }[];
        locations: { value: string; label: string }[];
    }>({ departments: [], titles: [], locations: [] });

    const [editData, setEditData] = useState({
        firstName: '',
        lastName: '',
        middleName: '',
        dateOfBirth: '',
        gender: '',
        maritalStatus: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        department: '',
        title: '',
        location: '',
        employmentType: 'full_time',
        startDate: '',
    })

    useEffect(() => {
        if (isOpen) {
            fetchProfile()
            fetchFormOptions()
            setIsEditing(false)
        }
    }, [isOpen])

    const fetchFormOptions = async () => {
        try {
            const res = await fetch(`${env.apiBaseUrl}/employees/form-options`, {
                headers: { 'Authorization': `Bearer ${state.tokens?.accessToken}` }
            })
            const data = await res.json()
            if (data.success) {
                setFormOptions(data.data)
            }
        } catch (error) {
            console.error("Failed to fetch form options:", error)
        }
    }

    const fetchProfile = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${env.apiBaseUrl}/employees/me`, {
                headers: {
                    'Authorization': `Bearer ${state.tokens?.accessToken}`
                }
            })
            const data = await res.json()
            if (data.success) {
                const p = data.data
                setProfile(p)
                setEditData({
                    firstName: p.personal?.firstName || '',
                    lastName: p.personal?.lastName || '',
                    middleName: p.personal?.middleName || '',
                    dateOfBirth: p.personal?.dateOfBirth ? p.personal.dateOfBirth.split('T')[0] : '',
                    gender: p.personal?.gender || '',
                    maritalStatus: p.personal?.maritalStatus || '',
                    phone: p.personal?.contact?.phone || '',
                    addressLine1: p.personal?.addresses?.current?.line1 || '',
                    addressLine2: p.personal?.addresses?.current?.line2 || '',
                    city: p.personal?.addresses?.current?.city || '',
                    state: p.personal?.addresses?.current?.state || '',
                    country: p.personal?.addresses?.current?.country || '',
                    postalCode: p.personal?.addresses?.current?.postalCode || '',
                    department: p.professional?.department || '',
                    title: p.professional?.title || '',
                    location: p.professional?.location || '',
                    employmentType: p.professional?.employmentType || 'full_time',
                    startDate: p.professional?.startDate ? p.professional.startDate.split('T')[0] : '',
                })
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error)
        } finally {
            setLoading(false)
        }
    }

    const handlePostalCodeChange = async (zip: string) => {
        setEditData(prev => ({ ...prev, postalCode: zip }));

        if (zip.length === 6 && /^\d+$/.test(zip)) {
            // India PIN code lookup
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${zip}`);
                const data = await res.json();
                if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
                    const postOffice = data[0].PostOffice[0];
                    setEditData(prev => ({
                        ...prev,
                        city: postOffice.District,
                        state: postOffice.State,
                        country: 'India',
                        postalCode: zip
                    }));
                }
            } catch (err) {
                console.warn("India PIN code fetch failed:", err);
            }
        } else if (zip.length === 5 && /^\d+$/.test(zip)) {
            // US ZIP code lookup
            try {
                const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.places && data.places.length > 0) {
                        const place = data.places[0];
                        setEditData(prev => ({
                            ...prev,
                            city: place['place name'],
                            state: place['state'],
                            country: 'United States',
                            postalCode: zip
                        }));
                    }
                }
            } catch (err) {
                console.warn("US ZIP code fetch failed:", err);
            }
        }
    };

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`${env.apiBaseUrl}/employees/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.tokens?.accessToken}`
                },
                body: JSON.stringify({
                    personal: {
                        ...profile.personal,
                        firstName: editData.firstName,
                        lastName: editData.lastName,
                        middleName: editData.middleName,
                        dateOfBirth: editData.dateOfBirth || undefined,
                        gender: editData.gender || undefined,
                        maritalStatus: editData.maritalStatus || undefined,
                        contact: {
                            ...profile.personal.contact,
                            phone: editData.phone
                        },
                        addresses: {
                            ...profile.personal.addresses,
                            current: {
                                line1: editData.addressLine1,
                                line2: editData.addressLine2,
                                city: editData.city,
                                state: editData.state,
                                country: editData.country,
                                postalCode: editData.postalCode
                            }
                        }
                    },
                    professional: {
                        ...profile.professional,
                        department: editData.department,
                        title: editData.title,
                        location: editData.location,
                        employmentType: editData.employmentType,
                        startDate: editData.startDate || undefined
                    }
                })
            })
            const data = await res.json()
            if (data.success) {
                setProfile(data.data)
                setIsEditing(false)
            }
        } catch (error) {
            console.error("Failed to update profile:", error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl bg-white h-[90vh] max-h-[90vh] flex flex-col">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center space-y-4">
                        <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-muted-foreground font-medium">Fetching profile...</p>
                    </div>
                ) : profile ? (
                    <div className="flex flex-col h-full w-full overflow-hidden">
                        {/* Banner Space */}
                        <div className="h-32 bg-gradient-to-r from-primary via-indigo-600 to-violet-700 w-full relative flex-shrink-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onOpenChange(false)}
                                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full z-10"
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
                            {!isEditing && (
                                <Button
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                    className="absolute -bottom-10 right-8 bg-white text-primary hover:bg-zinc-50 shadow-md border"
                                >
                                    Edit Profile
                                </Button>
                            )}
                        </div>

                        <div className="flex-1 mt-12 pb-8 px-8 overflow-y-auto">
                            <div className="space-y-8 pt-4">
                                {/* Header Info */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        {!isEditing && (
                                            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
                                                {profile?.personal?.firstName} {profile?.personal?.lastName}
                                            </h2>
                                        )}
                                        <Badge className="bg-primary/10 text-primary border-none font-semibold px-3 overflow-hidden h-fit">
                                            {state.roles?.[0]?.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                    </div>
                                    {!isEditing && (
                                        <p className="text-zinc-500 font-medium flex items-center gap-2 mt-1">
                                            <Briefcase className="h-4 w-4 text-zinc-400" />
                                            {profile?.professional?.title || "Employee"} <span className="text-zinc-300">|</span> {profile?.professional?.department}
                                        </p>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="space-y-8">
                                        {/* Personal Section */}
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2 text-primary">
                                                <UserIcon className="h-5 w-5" />
                                                <h3 className="text-sm font-bold uppercase tracking-wider">Personal Information</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>First Name</Label>
                                                    <Input value={editData.firstName} onChange={e => setEditData({ ...editData, firstName: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Last Name</Label>
                                                    <Input value={editData.lastName} onChange={e => setEditData({ ...editData, lastName: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Middle Name</Label>
                                                    <Input value={editData.middleName} onChange={e => setEditData({ ...editData, middleName: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Phone Number</Label>
                                                    <Input value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Date of Birth</Label>
                                                    <Input type="date" value={editData.dateOfBirth} onChange={e => setEditData({ ...editData, dateOfBirth: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Gender</Label>
                                                    <select
                                                        className="w-full p-2 border rounded-md text-sm bg-white"
                                                        value={editData.gender}
                                                        onChange={e => setEditData({ ...editData, gender: e.target.value })}
                                                    >
                                                        <option value="">Select...</option>
                                                        <option value="male">Male</option>
                                                        <option value="female">Female</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Marital Status</Label>
                                                    <select
                                                        className="w-full p-2 border rounded-md text-sm bg-white"
                                                        value={editData.maritalStatus}
                                                        onChange={e => setEditData({ ...editData, maritalStatus: e.target.value })}
                                                    >
                                                        <option value="">Select...</option>
                                                        <option value="single">Single</option>
                                                        <option value="married">Married</option>
                                                        <option value="divorced">Divorced</option>
                                                        <option value="widowed">Widowed</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Address Section */}
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2 text-primary">
                                                <Home className="h-5 w-5" />
                                                <h3 className="text-sm font-bold uppercase tracking-wider">Address Details</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2 space-y-2">
                                                    <Label>Address Line 1</Label>
                                                    <Input value={editData.addressLine1} onChange={e => setEditData({ ...editData, addressLine1: e.target.value })} />
                                                </div>
                                                <div className="col-span-2 space-y-2">
                                                    <Label>Address Line 2</Label>
                                                    <Input value={editData.addressLine2} onChange={e => setEditData({ ...editData, addressLine2: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>City</Label>
                                                    <Input value={editData.city} onChange={e => setEditData({ ...editData, city: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>State / Province</Label>
                                                    <Input value={editData.state} onChange={e => setEditData({ ...editData, state: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Country</Label>
                                                    <Input value={editData.country} onChange={e => setEditData({ ...editData, country: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Postal Code</Label>
                                                    <Input
                                                        value={editData.postalCode}
                                                        onChange={e => handlePostalCodeChange(e.target.value)}
                                                        placeholder="Enter ZIP/PIN code"
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        {/* Professional Section */}
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2 text-primary">
                                                <Building className="h-5 w-5" />
                                                <h3 className="text-sm font-bold uppercase tracking-wider">Professional Details</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Department</Label>
                                                    <select
                                                        className="w-full p-2 border rounded-md text-sm bg-white"
                                                        value={editData.department}
                                                        onChange={e => setEditData({ ...editData, department: e.target.value })}
                                                    >
                                                        <option value="">Select...</option>
                                                        {formOptions.departments.map(d => <option key={d.value} value={d.label}>{d.label}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Title</Label>
                                                    <select
                                                        className="w-full p-2 border rounded-md text-sm bg-white"
                                                        value={editData.title}
                                                        onChange={e => setEditData({ ...editData, title: e.target.value })}
                                                    >
                                                        <option value="">Select...</option>
                                                        {formOptions.titles.map(t => <option key={t.value} value={t.label}>{t.label}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Location</Label>
                                                    <select
                                                        className="w-full p-2 border rounded-md text-sm bg-white"
                                                        value={editData.location}
                                                        onChange={e => setEditData({ ...editData, location: e.target.value })}
                                                    >
                                                        <option value="">Select...</option>
                                                        {formOptions.locations.map(l => <option key={l.value} value={l.label}>{l.label}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Employment Type</Label>
                                                    <select
                                                        className="w-full p-2 border rounded-md text-sm bg-white"
                                                        value={editData.employmentType}
                                                        onChange={e => setEditData({ ...editData, employmentType: e.target.value })}
                                                    >
                                                        <option value="full_time">Full Time</option>
                                                        <option value="part_time">Part Time</option>
                                                        <option value="contract">Contract</option>
                                                        <option value="intern">Intern</option>
                                                        <option value="temporary">Temporary</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Start Date</Label>
                                                    <Input type="date" value={editData.startDate} onChange={e => setEditData({ ...editData, startDate: e.target.value })} />
                                                </div>
                                            </div>
                                        </section>

                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-8">
                                        <section className="space-y-4">
                                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Contact Information</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-md hover:border-primary/20 group">
                                                    <div className="mt-1 p-2.5 rounded-xl bg-white shadow-sm text-primary group-hover:scale-110 transition-transform">
                                                        <Mail className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Work Email</span>
                                                        <span className="text-sm font-semibold truncate text-zinc-700">{profile?.personal?.contact?.email}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-md hover:border-primary/20 group">
                                                    <div className="mt-1 p-2.5 rounded-xl bg-white shadow-sm text-primary group-hover:scale-110 transition-transform">
                                                        <Phone className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Phone Number</span>
                                                        <span className="text-sm font-semibold text-zinc-700">{profile?.personal?.contact?.phone || "Not Provided"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Professional Details</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-md hover:border-primary/20 group">
                                                    <div className="mt-1 p-2.5 rounded-xl bg-white shadow-sm text-primary group-hover:scale-110 transition-transform">
                                                        <Building className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Employment</span>
                                                        <span className="text-sm font-semibold text-zinc-700 normal-case first-letter:uppercase">{(profile?.professional?.employmentType || "Full Time").replace('_', ' ')}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-md hover:border-primary/20 group">
                                                    <div className="mt-1 p-2.5 rounded-xl bg-white shadow-sm text-primary group-hover:scale-110 transition-transform">
                                                        <Calendar className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Joining Date</span>
                                                        <span className="text-sm font-semibold text-zinc-700">
                                                            {profile?.professional?.startDate ? new Date(profile.professional.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : "N/A"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Location & Personal</h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-md hover:border-primary/20 group w-full">
                                                    <div className="mt-1 p-2.5 rounded-xl bg-white shadow-sm text-primary group-hover:scale-110 transition-transform">
                                                        <MapPin className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Residential Address</span>
                                                        <span className="text-sm font-semibold text-zinc-700 leading-relaxed">
                                                            {[
                                                                profile.personal?.addresses?.current?.line1,
                                                                profile.personal?.addresses?.current?.line2,
                                                                profile.personal?.addresses?.current?.city,
                                                                profile.personal?.addresses?.current?.state,
                                                                profile.personal?.addresses?.current?.postalCode,
                                                                profile.personal?.addresses?.current?.country
                                                            ].filter(Boolean).join(", ") || "No address provided"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-md hover:border-primary/20 group">
                                                        <div className="mt-1 p-2.5 rounded-xl bg-white shadow-sm text-primary group-hover:scale-110 transition-transform">
                                                            <UserIcon className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Gender</span>
                                                            <span className="text-sm font-semibold text-zinc-700 capitalize">{profile?.personal?.gender || "Not specified"}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-md hover:border-primary/20 group">
                                                        <div className="mt-1 p-2.5 rounded-xl bg-white shadow-sm text-primary group-hover:scale-110 transition-transform">
                                                            <Globe className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Marital Status</span>
                                                            <span className="text-sm font-semibold text-zinc-700 capitalize">{profile?.personal?.maritalStatus || "Not specified"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex gap-3 justify-end px-8 py-4 border-t bg-zinc-50/50 backdrop-blur-sm mt-auto">
                                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving} className="bg-white">
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
                                    {saving ? "Saving..." : (
                                        <span className="flex items-center gap-2">
                                            <Save className="h-4 w-4" /> Save Changes
                                        </span>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-12 text-center text-muted-foreground font-medium">
                        Could not load profile information.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
