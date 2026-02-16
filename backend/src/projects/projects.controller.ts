import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('projects')
@UseGuards(AuthGuard('jwt'))
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post()
    async create(@Request() req, @Body() data: any) {
        return this.projectsService.create(req.user.agencyId, data);
    }

    @Get()
    async findAll(@Request() req) {
        return this.projectsService.findAll(req.user.agencyId);
    }
}
