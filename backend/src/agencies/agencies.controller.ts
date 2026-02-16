import { Controller, Get, Post, Delete, Body, Param, UseGuards, ForbiddenException, Request } from '@nestjs/common';
import { AgenciesService } from './agencies.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('agencies')
@UseGuards(AuthGuard('jwt'))
export class AgenciesController {
    constructor(private readonly agenciesService: AgenciesService) { }

    @Post()
    async create(@Request() req, @Body() data: any) {
        if (req.user.role !== 'Super Admin') {
            throw new ForbiddenException('Only Super Admins can create agencies');
        }
        return this.agenciesService.createAgency(data);
    }

    @Get()
    async findAll(@Request() req) {
        if (req.user.role !== 'Super Admin') {
            throw new ForbiddenException('Only Super Admins can list agencies');
        }
        return this.agenciesService.findAll();
    }

    @Delete(':id')
    async remove(@Request() req, @Param('id') id: string) {
        if (req.user.role !== 'Super Admin') {
            throw new ForbiddenException('Only Super Admins can delete agencies');
        }
        return this.agenciesService.remove(id);
    }
}
