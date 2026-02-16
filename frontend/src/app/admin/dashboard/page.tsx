"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Building2, Shield, Users } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { AgencyForm } from "@/components/admin/AgencyForm"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminDashboard() {
    const [agencies, setAgencies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)

    const fetchAgencies = async () => {
        try {
            const token = localStorage.getItem("token")
            const response = await api.get("/agencies", {
                headers: { Authorization: `Bearer ${token}` }
            })
            setAgencies(response.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This will remove all agency data permanently.`)) return

        try {
            const token = localStorage.getItem("token")
            await api.delete(`/agencies/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success("Agency deleted successfully")
            fetchAgencies()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete agency")
        }
    }

    useEffect(() => {
        fetchAgencies()
    }, [])

    const stats = [
        { title: "Total Agencies", value: agencies.length.toString(), icon: Building2, color: "text-blue-600" },
        { title: "Active Deployments", value: agencies.filter(a => a.isActive).length.toString(), icon: Shield, color: "text-emerald-600" },
        { title: "Platform Health", value: "Optimal", icon: Users, color: "text-purple-600" },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Control</h1>
                    <p className="text-slate-500">Global overview and agency management.</p>
                </div>

                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                            <Plus className="mr-2 h-4 w-4" />
                            Register New Agency
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-[540px]">
                        <SheetHeader>
                            <SheetTitle>Register New Agency</SheetTitle>
                            <SheetDescription>
                                Create a new agency and its primary administrator account.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6">
                            <AgencyForm
                                onSuccess={() => {
                                    setOpen(false)
                                    fetchAgencies()
                                }}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.title} className="border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">{stat.title}</CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900">Registered Agencies</h3>
                </div>
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-200">
                            <TableHead className="font-semibold text-slate-700">Agency Name</TableHead>
                            <TableHead className="font-semibold text-slate-700">Login Slug</TableHead>
                            <TableHead className="font-semibold text-slate-700">Status</TableHead>
                            <TableHead className="font-semibold text-slate-700">Joined</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
                                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                                    <p className="mt-2 text-sm text-slate-500">Retrieving agency data...</p>
                                </TableCell>
                            </TableRow>
                        ) : agencies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20">
                                    <Building2 className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                                    <h3 className="text-lg font-medium text-slate-900">No agencies found</h3>
                                    <p className="text-slate-500 text-sm max-w-xs mx-auto">Get started by registering your first security agency using the button above.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            agencies.map((agency) => (
                                <TableRow key={agency.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                    <TableCell className="font-bold text-slate-900">{agency.name}</TableCell>
                                    <TableCell>
                                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">/{agency.slug}</code>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={agency.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-none" : "bg-slate-100 text-slate-600 border-slate-200 shadow-none"}>
                                            {agency.isActive ? "Operational" : "Suspended"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-500 font-medium">{new Date(agency.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold"
                                            onClick={() => handleDelete(agency.id, agency.name)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Terminate
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
