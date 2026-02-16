"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Building } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function DesignationManager({ designations, onUpdate }: { designations: any[], onUpdate: () => void }) {
    const [loading, setLoading] = useState(false)
    const [newName, setNewName] = useState("")
    const [newDesc, setNewDesc] = useState("")

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName) return
        setLoading(true)
        try {
            await api.post("/designations", { name: newName, description: newDesc }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            })
            toast.success("Designation created")
            setNewName("")
            setNewDesc("")
            onUpdate()
        } catch (error: any) {
            toast.error(error.extractedMessage || "Failed to create designation")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/designations/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            })
            toast.success("Designation removed")
            onUpdate()
        } catch (error: any) {
            toast.error(error.extractedMessage || "Could not delete designation")
        }
    }

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1 shadow-sm border-slate-100">
                <CardHeader>
                    <CardTitle className="text-lg">Create New Title</CardTitle>
                    <CardDescription>Add a job designation unique to your agency.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Designation Name</label>
                            <Input
                                placeholder="e.g. Bodyguard"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Description (Optional)</label>
                            <Input
                                placeholder="Responsibilities..."
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Adding..." : "Add Designation"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-sm border-slate-100 overflow-hidden">
                <CardHeader className="bg-slate-50/50">
                    <CardTitle className="text-lg">Agency Structure</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-transparent">
                                <TableHead>Title</TableHead>
                                <TableHead>Staff Count</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {designations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-10">
                                        <Building className="mx-auto h-12 w-12 text-slate-200 mb-2" />
                                        <p className="text-slate-400 text-sm italic font-mono">NO DESIGNATIONS DEFINED</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                designations.map((des) => (
                                    <TableRow key={des.id} className="hover:bg-slate-50/20 transition-colors">
                                        <TableCell>
                                            <div className="font-bold text-slate-800 uppercase tracking-tight">{des.name}</div>
                                            <div className="text-xs text-slate-400 font-medium">{des.description || "No description"}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                                                {des._count?.employees || 0} Members
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDelete(des.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
