import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('audit-logs')
@UseGuards(AuthGuard('jwt'))
export class AuditLogsController {
    constructor(private readonly auditLogsService: AuditLogsService) { }

    @Get()
    async findAll(@Request() req) {
        return this.auditLogsService.findAll(req.user.agencyId);
    }
}
