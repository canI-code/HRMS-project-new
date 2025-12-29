"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <div className="mx-auto max-w-7xl animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
