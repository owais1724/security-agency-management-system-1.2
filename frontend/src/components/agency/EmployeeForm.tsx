"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
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
    fullName: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    employeeCode: z.string().min(3, "Staff ID is required"),
    designationId: z.string().min(1, "Picking a designation is required"),
    phoneNumber: z.string().optional(),
    basicSalary: z.string().min(1, "Basic salary is required"),
})

export function EmployeeForm({ designations, refetchDesignations, onSuccess }: {
    designations: any[],
    refetchDesignations: () => void,
    onSuccess: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [showQuickAdd, setShowQuickAdd] = useState(false)
    const [newDesignationName, setNewDesignationName] = useState("")
    const [designationLoading, setDesignationLoading] = useState(false)


    const handleQuickAddDesignation = async () => {
        if (!newDesignationName) return
        setDesignationLoading(true)
        try {
            const response = await api.post("/designations", { name: newDesignationName })
            toast.success("Designation created")
            const newId = response.data.id;
            setNewDesignationName("")
            setShowQuickAdd(false)

            // Refresh parent list
            refetchDesignations();

            // Auto-select the newly created designation
            form.setValue("designationId", newId);
        } catch (error) {
            toast.error("Failed to create designation")
        } finally {
            setDesignationLoading(false)
        }
    }

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            employeeCode: "SAMS-",
            designationId: "",
            phoneNumber: "",
            basicSalary: "0"
        },
    })


    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            await api.post("/employees", values)
            toast.success("Personnel onboarded successfully")
            onSuccess()
        } catch (error: any) {
            console.error("Employee Creation Error:", error)
            const message = error.response?.data?.message || error.message || "Unknown error occurred"
            toast.error(`Failed: ${message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name / Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Officer Name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="employeeCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Staff ID / Code</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="designationId"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center justify-between">
                                    <FormLabel>Professional Designation</FormLabel>
                                    {!showQuickAdd && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowQuickAdd(true)}
                                            className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Create New
                                        </Button>
                                    )}
                                </div>

                                {!showQuickAdd ? (
                                    <FormControl>
                                        <select
                                            {...field}
                                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="">Choose a designation...</option>
                                            {designations.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </FormControl>
                                ) : (
                                    <div className="flex space-x-2">
                                        <Input
                                            placeholder="e.g. Supervisor"
                                            value={newDesignationName}
                                            onChange={(e) => setNewDesignationName(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            onClick={handleQuickAddDesignation}
                                            disabled={designationLoading || !newDesignationName}
                                            size="sm"
                                        >
                                            {designationLoading ? "..." : "Save"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setShowQuickAdd(false)}
                                            size="sm"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                                <FormMessage />
                                {designations.length === 0 && !showQuickAdd && (
                                    <FormDescription className="text-red-500 font-medium italic text-[10px]">
                                        No designations created. Create one above.
                                    </FormDescription>
                                )}
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="+1..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="basicSalary"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Basic Salary</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4 rounded-xl border p-6 bg-slate-50 border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase">Access Credentials</h3>
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-semibold text-xs">System Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="staff@agency.com" {...field} className="bg-white" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-semibold text-xs">Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="******" {...field} className="bg-white" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full py-6 text-lg font-bold tracking-tight shadow-md" disabled={loading || designations.length === 0}>
                    {loading ? "Processing..." : "Register Personnel"}
                </Button>
            </form>
        </Form>
    )
}
