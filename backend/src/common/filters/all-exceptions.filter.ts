
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | object = 'Internal server error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            message = exception.getResponse();
        } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle Prisma errors
            switch (exception.code) {
                case 'P2002': {
                    status = HttpStatus.CONFLICT;
                    const target = (exception.meta?.target as string[]) || [];
                    message = {
                        statusCode: status,
                        message: `Unique constraint failed on the fields: (${target.join(', ')})`,
                        error: 'Conflict',
                    };
                    break;
                }
                case 'P2025': {
                    status = HttpStatus.NOT_FOUND;
                    message = {
                        statusCode: status,
                        message: exception.message || 'Record not found',
                        error: 'Not Found',
                    };
                    break;
                }
                default: {
                    status = HttpStatus.BAD_REQUEST;
                    message = {
                        statusCode: status,
                        message: `Database error: ${exception.code}`,
                        error: 'Database Error',
                    };
                    break;
                }
            }
        } else if (exception instanceof Error) {
            message = {
                statusCode: status,
                message: exception.message,
                error: 'System Error',
            };
        }

        const errorResponse = {
            ...(typeof message === 'string' ? { message } : (message as object)),
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
        };

        this.logger.error(
            `${request.method} ${request.url} - Status: ${status} - Error: ${JSON.stringify(
                errorResponse,
            )}`,
            exception instanceof Error ? exception.stack : '',
        );

        response.status(status).json(errorResponse);
    }
}
