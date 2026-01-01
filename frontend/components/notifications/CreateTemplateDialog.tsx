"use client";

import { useState } from "react";
import { CreateTemplatePayload } from "@/lib/notifications/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";

interface CreateTemplateDialogProps {
    onClose: () => void;
    onSuccess: (payload: CreateTemplatePayload) => void;
}

export function CreateTemplateDialog({ onClose, onSuccess }: CreateTemplateDialogProps) {
    const [formData, setFormData] = useState<CreateTemplatePayload>({
        name: "",
        channel: "in_app",
        category: "",
        subject: "",
        body: "",
        placeholders: [],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSuccess(formData);
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Notification Template</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="name">Name (e.g., LEAVE_REQUESTED)</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="channel">Channel</Label>
                        <select
                            id="channel"
                            name="channel"
                            value={formData.channel}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="in_app">In App</option>
                            <option value="email">Email</option>
                            <option value="sms">SMS</option>
                            <option value="push">Push</option>
                        </select>
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="category">Category (e.g., leave, payroll)</Label>
                        <Input id="category" name="category" value={formData.category} onChange={handleChange} required />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" name="subject" value={formData.subject} onChange={handleChange} />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="body">Body (Use {'{{placeholder}}'} for dynamic values)</Label>
                        <Textarea id="body" name="body" value={formData.body} onChange={handleChange} required />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="placeholders">Placeholders (comma separated)</Label>
                        <Input
                            id="placeholders"
                            name="placeholders"
                            placeholder="e.g. leaveId, employeeId"
                            value={formData.placeholders?.join(", ")}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    placeholders: e.target.value.split(",").map((s) => s.trim()),
                                }))
                            }
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">Create Template</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
