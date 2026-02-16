"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState } from "react"
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

const formSchema = z.object({
    name: z.string().min(2, "Agency name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
    adminName: z.string().min(2, "Admin name is required"),
    adminEmail: z.string().email("Invalid email address"),
    adminPassword: z.string().min(6, "Password must be at least 6 characters"),
})

export function AgencyForm({ onSuccess }: { onSuccess: () => void }) {
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            slug: "",
            adminName: "",
            adminEmail: "",
            adminPassword: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            await api.post("/agencies", values, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            })
            toast.success("Agency and Admin created successfully")
            onSuccess()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                    <h3 className="font-medium text-sm">Agency Information</h3>
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Agency Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Stark Security" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Agency Slug</FormLabel>
                                <FormControl>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-muted-foreground">/</span>
                                        <Input placeholder="stark-security" {...field} />
                                    </div>
                                </FormControl>
                                <FormDescription>Used for the agency login URL</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                    <h3 className="font-medium text-sm">Admin Account (Super Agent)</h3>
                    <FormField
                        control={form.control}
                        name="adminName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Tony Stark" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="adminEmail"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="tony@stark.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="adminPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="******" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating..." : "Create Agency"}
                </Button>
            </form>
        </Form>
    )
}
