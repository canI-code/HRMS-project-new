"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export function Header() {
    return (
        <header className="flex h-16 items-center justify-between border-b bg-background/50 backdrop-blur-md px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4 w-1/3">
                {/* Search Header Removed */}
            </div>

            <div className="flex items-center gap-4">
                <Link href="/notifications">
                    <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive border-2 border-background"></span>
                    </Button>
                </Link>
            </div>
        </header>
    )
}
