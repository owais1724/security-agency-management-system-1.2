import { Controller, Get, Post, Body, UseGuards, Request, Delete, Param } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { MigrationService } from './migration.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Controller('employees')
@UseGuards(AuthGuard('jwt'))
export class EmployeesController {
    constructor(
        private readonly employeesService: EmployeesService,
        private readonly migrationService: MigrationService
    ) { }

    @Get()
    findAll(@Request() req) {
        return this.employeesService.findAll(req.user.agencyId);
    }

    @Post()
    create(@Request() req, @Body() data: CreateEmployeeDto) {
        return this.employeesService.create(req.user.agencyId, data);
    }


    @Post('sync-roles')
    syncRoles(@Request() req) {
        return this.migrationService.syncEmployeeRolesToDesignations(req.user.agencyId);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.employeesService.remove(req.user.agencyId, id, req.user.sub);
    }
}
