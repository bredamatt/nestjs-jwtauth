import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { Tokens } from './types';
import { Request } from 'express';
import { AtGuard, RtGuard } from './guards';
import { GetCurrentUser } from './decorators';
import { GetCurrentUserId } from './decorators/get-current-user-id.decorator';

@Controller('auth')
export class AuthController {
    constructor( private authService: AuthService) {}

    @Post('local/signup')
    @HttpCode(HttpStatus.CREATED)
    signupLocal(@Body() dto: AuthDto): Promise<Tokens> {
        return this.authService.signupLocal(dto);
    }

    @Post('local/signin')
    @HttpCode(HttpStatus.OK)
    signinLocal(@Body() dto: AuthDto): Promise<Tokens> {
        return this.authService.signinLocal(dto);
    }

    /*
        Passport lib takes token and decodes it then creates a payload.
        We use JwtPayload type as a strongly typed payload in the auth.service file
    */

    @UseGuards(AtGuard) // Passport jwt strategy guard, see ./guards/atguard.guard.ts
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    logout(@GetCurrentUser('sub') userId: number) {
        return this.authService.logout(userId);
    }

    @UseGuards(RtGuard) // Passport jwt-refresh strategy guard see ./guards/rtguard.guard.ts
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    refreshTokens(
        @GetCurrentUserId() userId: number,
        @GetCurrentUser('refreshToken') refreshToken: string) {
        return this.authService.refreshTokens(userId, refreshToken);
    }
}
