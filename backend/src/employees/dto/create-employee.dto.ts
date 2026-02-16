
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsNumber, MinLength } from 'class-validator';

export class CreateEmployeeDto {
    @IsNotEmpty()
    @IsString()
    fullName: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password: string;

    @IsNotEmpty()
    @IsString()
    employeeCode: string;

    @IsNotEmpty()
    @IsString()
    phoneNumber: string;

    @IsNotEmpty()
    @IsString()
    designationId: string;

    @IsOptional()
    @IsNumber()
    basicSalary?: number;
}
