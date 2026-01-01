"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { configApi, ConfigItem, ConfigItemType } from "@/lib/admin/configApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Trash2, Plus, Building2, Briefcase, MapPin, RefreshCw } from "lucide-react";

const TYPES: { type: ConfigItemType; label: string; icon: React.ReactNode }[] = [
    { type: "department", label: "Departments", icon: <Building2 className="h-4 w-4" /> },
    { type: "title", label: "Job Titles", icon: <Briefcase className="h-4 w-4" /> },
    { type: "location", label: "Locations", icon: <MapPin className="h-4 w-4" /> },
];

export function ConfigItemsManager() {
    const { state } = useAuth();
    const tokens = state.tokens;

    const [activeType, setActiveType] = useState<ConfigItemType>("department");
    const [items, setItems] = useState<ConfigItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [newLabel, setNewLabel] = useState("");
    const [adding, setAdding] = useState(false);

    const loadItems = async () => {
        if (!tokens) return;
        setLoading(true);
        try {
            const data = await configApi.list(activeType, tokens, true);
            setItems(data);
        } catch (error) {
            console.error("Failed to load config items:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, [tokens, activeType]);

    const handleAdd = async () => {
        if (!tokens || !newLabel.trim()) return;
        setAdding(true);
        try {
            await configApi.create(activeType, { label: newLabel.trim() }, tokens);
            setNewLabel("");
            await loadItems();
        } catch (error: any) {
            alert(error.message || "Failed to add item");
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!tokens) return;
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            await configApi.delete(activeType, id, tokens, true);
            await loadItems();
        } catch (error: any) {
            alert(error.message || "Failed to delete item");
        }
    };

    const handleToggleActive = async (item: ConfigItem) => {
        if (!tokens) return;
        try {
            await configApi.update(activeType, item._id, { isActive: !item.isActive }, tokens);
            await loadItems();
        } catch (error: any) {
            alert(error.message || "Failed to update item");
        }
    };

    const handleSeedDefaults = async () => {
        if (!tokens) return;
        if (!confirm("This will add default departments, titles, and locations. Continue?")) return;
        try {
            await configApi.seed(tokens);
            await loadItems();
        } catch (error: any) {
            alert(error.message || "Failed to seed defaults");
        }
    };

    const currentTypeInfo = TYPES.find((t) => t.type === activeType);

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Manage Form Options</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleSeedDefaults}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Seed Defaults
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    Add or remove departments, job titles, and locations that appear in employee forms.
                </p>
            </CardHeader>
            <CardContent>
                {/* Type Tabs */}
                <div className="flex gap-2 mb-6 border-b pb-4">
                    {TYPES.map((t) => (
                        <button
                            key={t.type}
                            onClick={() => setActiveType(t.type)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeType === t.type
                                    ? "bg-zinc-900 text-white"
                                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                                }`}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Add New Item */}
                <div className="flex gap-2 mb-6">
                    <Input
                        placeholder={`Add new ${currentTypeInfo?.label.slice(0, -1).toLowerCase() || "item"}...`}
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    />
                    <Button onClick={handleAdd} disabled={adding || !newLabel.trim()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                    </Button>
                </div>

                {/* Items List */}
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No {currentTypeInfo?.label.toLowerCase()} found. Add one or seed defaults.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {items.map((item) => (
                            <div
                                key={item._id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${item.isActive ? "bg-white" : "bg-zinc-50 opacity-60"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`font-medium ${!item.isActive && "line-through"}`}>
                                        {item.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-mono">{item.value}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleActive(item)}
                                        className="text-xs"
                                    >
                                        {item.isActive ? "Disable" : "Enable"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(item._id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
