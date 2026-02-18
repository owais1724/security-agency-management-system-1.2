"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
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
import { Shield, Plus, Key, Users, Trash2 } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { RoleForm } from "@/components/agency/RoleForm"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"

export default function RBACPage() {
    const { agencySlug } = useParams()
    const [roles, setRoles] = useState<any[]>([])
    const [permissions, setPermissions] = useState<any[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [selectedRole, setSelectedRole] = useState<any>(null)

    const fetchData = async () => {
        try {
            // First, sync roles to designations automatically
            try {
                await api.post("/employees/sync-roles", {})
            } catch (syncError) {
                console.error("Role sync error:", syncError)
            }

            // Then fetch all data
            console.log("Fetching roles...")
            const rolesRes = await api.get("/roles")
            console.log("Roles fetched successfully")

            console.log("Fetching permissions...")
            const permsRes = await api.get("/roles/permissions")
            console.log("Permissions fetched successfully")

            console.log("Fetching employees...")
            const empRes = await api.get("/employees")
            console.log("Employees fetched successfully")

            setRoles(rolesRes.data)
            setPermissions(permsRes.data)
            setEmployees(empRes.data)
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || "Unknown error"
            console.error("RBAC Fetch Error Detail:", msg)
            toast.error(`RBAC Fetch Failed: ${msg}`)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete the role "${name}"?`)) return
        try {
            await api.delete(`/roles/${id}`)
            toast.success("Role deleted successfully")
            fetchData()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete role")
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Roles & Permissions</h1>
                    <p className="text-slate-500">Define access levels and security privileges for your agency.</p>
                </div>

                <Sheet open={open} onOpenChange={(val) => {
                    setOpen(val)
                    if (!val) setSelectedRole(null)
                }}>
                    <SheetTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Role
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-[600px] overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>{selectedRole ? "Edit Role Permissions" : "Configure New Role"}</SheetTitle>
                            <SheetDescription>
                                Select the specific permissions for this role.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6">
                            <RoleForm
                                permissions={permissions}
                                initialData={selectedRole}
                                onSuccess={() => {
                                    setOpen(false)
                                    setSelectedRole(null)
                                    fetchData()
                                }}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-white border border-slate-100 rounded-xl flex items-center shadow-sm">
                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mr-4">
                        <Shield className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 font-medium">Defined Roles</div>
                        <div className="text-xl font-bold text-slate-900">{roles.length}</div>
                    </div>
                </div>
                <div className="p-4 bg-white border border-slate-100 rounded-xl flex items-center shadow-sm">
                    <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mr-4">
                        <Key className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 font-medium">System Permissions</div>
                        <div className="text-xl font-bold text-slate-900">{permissions.length}</div>
                    </div>
                </div>
                <div className="p-4 bg-white border border-slate-100 rounded-xl flex items-center shadow-sm">
                    <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mr-4">
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 font-medium">Total Personnel</div>
                        <div className="text-xl font-bold text-slate-900">{employees.length}</div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-6">
                <div className="bg-slate-50 p-4 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-blue-600" />
                        Personnel & Access Control
                    </h2>
                    <p className="text-xs text-slate-500">Each personnel's designation (Guard, HR, Supervisor, etc.) determines their system access. Click &quot;Permissions&quot; to configure what each designation can do.</p>
                </div>
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="w-[250px]">Personnel Name</TableHead>
                            <TableHead>Role / Designation</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8">Loading staff access data...</TableCell>
                            </TableRow>
                        ) : employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-12 text-slate-400 italic">No personnels onboarded yet.</TableCell>
                            </TableRow>
                        ) : (
                            employees.map((emp) => (
                                <TableRow key={emp.id} className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <div className="flex items-center">
                                            <Avatar className="h-8 w-8 mr-3">
                                                <AvatarFallback className="text-[10px] font-bold">
                                                    {emp.fullName?.split(' ').map((n: string) => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="font-semibold text-slate-900">{emp.fullName}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 px-3 py-1 font-bold">
                                            {emp.user?.role?.name || emp.designation?.name || "Staff"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-primary text-primary hover:bg-primary/5 font-bold"
                                            onClick={() => {
                                                const role = roles.find(r => r.id === emp.user?.role?.id);
                                                if (role) {
                                                    setSelectedRole(role);
                                                    setOpen(true);
                                                } else {
                                                    toast.error("Role details not found. System roles cannot be modified.");
                                                }
                                            }}
                                        >
                                            Permissions
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                    <Key className="h-5 w-5 mr-2" />
                    System Roles Matrix
                </h2>
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Role Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Permissions Count</TableHead>
                                <TableHead>Assigned Users</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500 italic">Syncing security matrix...</TableCell>
                                </TableRow>
                            ) : roles.map((role) => (
                                <TableRow key={role.id} className="hover:bg-slate-50/50">
                                    <TableCell className="font-bold text-slate-900">
                                        <div className="flex items-center">
                                            {role.isSystem && <Shield className="h-3 w-3 mr-2 text-blue-500" />}
                                            {role.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-500">{role.description || "No description provided"}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                            {role.permissions?.length || 0} Grants
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-sm font-medium text-slate-700">
                                            <Users className="h-4 w-4 mr-2 text-slate-400" />
                                            {role._count?.users || 0}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {!role.isSystem ? (
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary hover:bg-primary/5"
                                                    onClick={() => {
                                                        setSelectedRole(role)
                                                        setOpen(true)
                                                    }}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:bg-red-50"
                                                    onClick={() => handleDelete(role.id, role.name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400">Fixed System Role</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
