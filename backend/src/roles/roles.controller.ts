import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RolesService } from './roles.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('roles')
@UseGuards(AuthGuard('jwt'))
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Get('permissions')
    async getPermissions() {
        return this.rolesService.findAllPermissions();
    }

    @Get()
    async getRoles(@Request() req) {
        return this.rolesService.findAllRoles(req.user.agencyId);
    }

    @Post()
    async createRole(@Request() req, @Body() data: any) {
        return this.rolesService.createRole(req.user.agencyId, data);
    }

    @Put(':id')
    async updateRole(@Request() req, @Param('id') id: string, @Body() data: any) {
        return this.rolesService.updateRole(req.user.agencyId, id, data);
    }

    @Delete(':id')
    async removeRole(@Request() req, @Param('id') id: string) {
        return this.rolesService.removeRole(req.user.agencyId, id);
    }
}
