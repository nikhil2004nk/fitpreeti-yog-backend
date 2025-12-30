import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        success: boolean;
        message: string;
        data?: Partial<import("../common/interfaces/user.interface").User>;
    }>;
    login(loginDto: LoginDto, res: Response): Promise<{
        message: string;
        user: import("../common/interfaces/user.interface").UserLite;
    }>;
    refresh(req: Request, res: Response): Promise<{
        message: string;
    }>;
    logout(req: Request, res: Response): Promise<{
        message: string;
    }>;
    profile(req: Request): {
        user: Express.User | undefined;
        message: string;
    };
    createAdmin(registerDto: RegisterDto): Promise<{
        success: boolean;
        message: string;
        data?: Partial<import("../common/interfaces/user.interface").User>;
    }>;
}
