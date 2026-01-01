import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Req, 
  Res, 
  UseGuards, 
  HttpCode, 
  HttpStatus,
  BadRequestException
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CookieJwtGuard } from './guards/cookie-jwt.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { UserRole } from '../common/interfaces/user.interface';
import { ApiSuccessResponse } from '../common/interfaces/api-response.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 30, ttl: 900000 } }) // 30 requests per 15 minutes (increased from 5)
  @ApiOperation({ summary: 'Register new user with full profile' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Phone or email already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Throttle({ default: { limit: 30, ttl: 900000 } }) // 30 requests per 15 minutes (increased from 5)
  @ApiOperation({ summary: 'Login with phone and PIN' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token, user } = await this.authService.login(loginDto);
    
    // Set secure httpOnly cookies
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      message: 'Login successful',
      user,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      throw new BadRequestException('No refresh token found');
    }

    const { access_token, refresh_token } = await this.authService.refresh(refreshToken);
    
    // Update cookies with new tokens
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'Tokens refreshed successfully',
    };
  }

  @Post('logout')
  @UseGuards(CookieJwtGuard)
  @ApiOperation({ summary: 'Logout user (clears cookies)' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Extract tokens from cookies
    const refreshToken = req.cookies?.['refresh_token'];
    const accessToken = req.cookies?.['access_token'];
    
    // Invalidate tokens
    await this.authService.logout(refreshToken || '', accessToken);
    
    // Clear cookies
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return {
      message: 'Logged out successfully',
    };
  }

  @Get('profile')
  @UseGuards(CookieJwtGuard)
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  profile(@Req() req: Request) {
    return {
      user: req.user,
      message: 'Profile retrieved successfully',
    };
  }

  @Post('admin/create')
  @UseGuards(CookieJwtGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin: Create admin user (internal)' })
  @ApiResponse({ status: 201, description: 'Admin user created' })
  async createAdmin(
    @Body() registerDto: RegisterDto,
  ) {
    registerDto.role = 'admin';
    return this.authService.register(registerDto);
  }
}
