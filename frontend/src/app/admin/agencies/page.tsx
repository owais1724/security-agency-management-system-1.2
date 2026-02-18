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
import { Plus, Trash2 } from "lucide-react"
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

export default function AgenciesPage() {
    const [agencies, setAgencies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)

    const fetchAgencies = async () => {
        try {
            const response = await api.get("/agencies")
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
            await api.delete(`/agencies/${id}`)
            toast.success("Agency deleted successfully")
            fetchAgencies()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete agency")
        }
    }

    useEffect(() => {
        fetchAgencies()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Platform Agencies</h1>
                    <p className="text-slate-500">Add or manage security agencies in the system.</p>
                </div>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Register Agency
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

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-semibold text-slate-700">Agency Name</TableHead>
                            <TableHead className="font-semibold text-slate-700">Endpoint</TableHead>
                            <TableHead className="font-semibold text-slate-700">Status</TableHead>
                            <TableHead className="font-semibold text-slate-700">Registered</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Loading agencies...</TableCell>
                            </TableRow>
                        ) : agencies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-slate-400">No agencies registered yet.</TableCell>
                            </TableRow>
                        ) : (
                            agencies.map((agency) => (
                                <TableRow key={agency.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-bold text-slate-900">{agency.name}</TableCell>
                                    <TableCell>
                                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">/{agency.slug}</code>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={agency.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-600"}>
                                            {agency.isActive ? "Operational" : "Suspended"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-500">{new Date(agency.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(agency.id, agency.name)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Agency
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
