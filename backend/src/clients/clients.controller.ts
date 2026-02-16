import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('clients')
@UseGuards(AuthGuard('jwt'))
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @Post()
    async create(@Request() req, @Body() data: any) {
        return this.clientsService.create(req.user.agencyId, data);
    }

    @Get()
    async findAll(@Request() req) {
        return this.clientsService.findAll(req.user.agencyId);
    }
}
