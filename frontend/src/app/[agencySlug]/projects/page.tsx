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
import { Plus, Briefcase, MapPin } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { ProjectForm } from "@/components/agency/ProjectForm"
import { Badge } from "@/components/ui/badge"

export default function ProjectsPage() {
    const [projects, setProjects] = useState<any[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)

    const fetchData = async () => {
        try {
            const [projectsRes, clientsRes] = await Promise.all([
                api.get("/projects"),
                api.get("/clients")
            ])
            setProjects(projectsRes.data)
            setClients(clientsRes.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
                    <p className="text-slate-500">Manage your security projects and site assignments</p>
                </div>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-[450px]">
                        <SheetHeader>
                            <SheetTitle>Launch New Project</SheetTitle>
                            <SheetDescription>
                                Assign a project to a client and manage employee assignments.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6">
                            <ProjectForm
                                clients={clients}
                                onSuccess={() => {
                                    setOpen(false)
                                    fetchData()
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
                            <TableHead>Project / Site Name</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Loading projects...</TableCell>
                            </TableRow>
                        ) : projects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
                                    <Briefcase className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                                    <div className="text-slate-900 font-medium">No projects active</div>
                                    <div className="text-slate-500 text-sm">Launch a project to start managing attendance.</div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            projects.map((project) => (
                                <TableRow key={project.id}>
                                    <TableCell>
                                        <div className="font-semibold text-slate-900">{project.name}</div>
                                        <div className="text-xs text-slate-400">ID: {project.id.slice(-6)}</div>
                                    </TableCell>
                                    <TableCell className="font-medium">{project.client?.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-slate-600 text-sm">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            {project.location || "On-site"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={project.isActive ? "default" : "secondary"}>
                                            {project.isActive ? "Active" : "Paused"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm">Manage Assignments</Button>
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
