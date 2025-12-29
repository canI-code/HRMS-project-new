"use client"

import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedPage } from "@/components/auth/ProtectedPage"

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedPage>
            <AppLayout>{children}</AppLayout>
        </ProtectedPage>
    )
}
