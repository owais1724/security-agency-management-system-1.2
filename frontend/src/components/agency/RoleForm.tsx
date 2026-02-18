"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
    name: z.string().min(2, "Role name is required"),
    description: z.string().optional(),
    permissionIds: z.array(z.string()).min(1, "Select at least one permission"),
})

export function RoleForm({ permissions, initialData, onSuccess }: {
    permissions: any[],
    initialData?: any,
    onSuccess: () => void
}) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            permissionIds: initialData?.permissions?.map((p: any) => p.id) || [],
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name || "",
                description: initialData.description || "",
                permissionIds: initialData.permissions?.map((p: any) => p.id) || [],
            })
        } else {
            form.reset({
                name: "",
                description: "",
                permissionIds: [],
            })
        }
    }, [initialData, form])

    // Group permissions by category (optional enhancement)
    const categories = [
        { label: "Agency & Operations", keywords: ["agency", "client", "project", "visitor"] },
        { label: "Personnel & HR", keywords: ["personnel", "employee", "leave", "attendance", "staff"] },
        { label: "Finance & Security", keywords: ["payroll", "role", "permissions", "backup"] }
    ]

    const getCategory = (action: string) => {
        for (const cat of categories) {
            if (cat.keywords.some(k => action.toLowerCase().includes(k))) return cat.label
        }
        return "Other"
    }

    const groupedPermissions = permissions.reduce((acc: any, p: any) => {
        const cat = getCategory(p.action)
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(p)
        return acc
    }, {})

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            if (initialData) {
                await api.put(`/roles/${initialData.id}`, values)
                toast.success("Role updated successfully")
            } else {
                await api.post("/roles", values)
                toast.success("Role created successfully")
            }
            onSuccess()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save role")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role Title</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g. Site Supervisor"
                                    {...field}
                                    disabled={initialData?.isSystem}
                                />
                            </FormControl>
                            {initialData?.isSystem && (
                                <FormDescription className="text-xs text-amber-600">
                                    System role names cannot be changed. You can only modify permissions.
                                </FormDescription>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Briefly explain what this role manages"
                                    {...field}
                                    disabled={initialData?.isSystem}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <FormLabel className="text-base font-bold text-slate-900 underline underline-offset-4 decoration-blue-500">Role Permissions</FormLabel>
                    <FormDescription>Assign specific access rights to this role. Staff assigned this role will only be able to perform these actions.</FormDescription>

                    {Object.entries(groupedPermissions).map(([category, items]: [string, any]) => (
                        <div key={category} className="space-y-4 rounded-xl border border-slate-200 p-6 bg-slate-50/50">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{category}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {items.map((perm: any) => (
                                    <FormField
                                        key={perm.id}
                                        control={form.control}
                                        name="permissionIds"
                                        render={({ field }) => {
                                            return (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(perm.id)}
                                                            onCheckedChange={(checked: boolean) => {
                                                                return checked
                                                                    ? field.onChange([...field.value, perm.id])
                                                                    : field.onChange(
                                                                        field.value?.filter(
                                                                            (value: string) => value !== perm.id
                                                                        )
                                                                    )
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="text-sm font-medium leading-none cursor-pointer">
                                                        {perm.action.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                    </FormLabel>
                                                </FormItem>
                                            )
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                    <FormMessage />
                </div>

                <Button type="submit" className="w-full py-6 text-lg font-bold" disabled={loading}>
                    {loading ? "SAVING..." : initialData ? "SAVE PERMISSIONS" : "CREATE ROLE"}
                </Button>

            </form>
        </Form>
    )
}
