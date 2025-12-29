"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Users,
    LayoutDashboard,
    Settings,
    FileText,
    Calendar,
    Briefcase,
    Bell,
    LogOut,
    Menu,
    X
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { useAuth } from "@/lib/auth/context"

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Employees", href: "/employees", icon: Users },
    { name: "Attendance", href: "/attendance", icon: Calendar },
    { name: "Leaves", href: "/leaves", icon: Briefcase },
    { name: "Payroll", href: "/payroll", icon: FileText },
    { name: "Performance", href: "/performance", icon: Settings }, // Using Settings temporary
    { name: "Documents", href: "/documents", icon: FileText },
]

export function Sidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const { state, logout } = useAuth()
    const user = state.user

    return (
        <div className={cn(
            "flex flex-col border-r bg-card h-screen transition-all duration-300 relative",
            collapsed ? "w-20" : "w-72"
        )}>
            <div className="flex h-16 items-center border-b px-4 justify-between">
                {!collapsed && (
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
                        NexusHR
                    </span>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="ml-auto"
                >
                    {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    {navigation.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    collapsed && "justify-center"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                                {!collapsed && <span>{item.name}</span>}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="border-t p-4">
                <div className={cn("flex items-center", collapsed ? "justify-center" : "space-x-3")}>
                    <Avatar>
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name || user?.email}`} />
                        <AvatarFallback>{(user?.name || user?.email)?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="truncate text-sm font-medium text-foreground">
                                {user?.name || user?.email}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                                {state.roles?.[0] || 'User'}
                            </span>
                        </div>
                    )}
                </div>
                <div className="mt-4">
                    <Button
                        variant="ghost"
                        className={cn("w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive", collapsed && "justify-center px-0")}
                        onClick={logout}
                    >
                        <LogOut className={cn("h-5 w-5", !collapsed && "mr-2")} />
                        {!collapsed && "Logout"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
