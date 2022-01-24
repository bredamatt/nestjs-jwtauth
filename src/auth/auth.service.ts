import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as bcrypt from 'bcrypt';
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService,
        private jwtService: JwtService) {}

    // Passwords and tokens need to be encrypted before stored
    hashData(data: string) {
        return bcrypt.hash(data, 10);
    };

    // Helper to getTokens
    async getTokens(userId: number, email: string): Promise<Tokens> {
        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(
                {
                    sub: userId,
                    email,
                }, 
                {
                    secret:'at-secret', // Should be random string
                    expiresIn: 60*15, // 15 minutes
                },
            ),
            this.jwtService.signAsync(
                {
                    sub: userId,
                    email,
                },
                {
                    secret: 'rt-secret', // Should be random string
                    expiresIn: 60*60*24*7, // 1 week
                }
            )
        ]);

        return {
            access_token: at,
            refresh_token: rt
        }
    }

    async signupLocal(dto: AuthDto): Promise<Tokens> {
        const hash = await this.hashData(dto.password);

        // Need to generate tokens for new User
        const newUser = await this.prisma.user.create({
            data: {
                email: dto.email,
                hash: hash,
            },
        });

        const tokens = await this.getTokens(newUser.id, newUser.email);

        return tokens; 
    }

    async signinLocal(dto: AuthDto): Promise<Tokens> {
        // Check if user exists
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        })
        if (!user) throw new ForbiddenException("Access Denied");

        // Check if password is correct
        const passwordMatches = await bcrypt.compare(dto.password, user.hash);
        if (!passwordMatches) throw new ForbiddenException("Access Denied");
        
        // Refresh tokens when credentials are correct
        const tokens = await this.getTokens(user.id, user.email);
        await this.updateRtHash(user.id, tokens.refresh_token);
        return tokens;
    }

    async logout(userId: number) {
        await this.prisma.user.updateMany({
            where: { 
                id: userId,
                hashedRt: {
                    not: null,
                },
            },
            data: {
                hashedRt: null
            },
        });
    }

    refreshTokens() {}

    // Helper to update the refresh token
    async updateRtHash(userId: number, rt: string) {
        const hash = await this.hashData(rt)
        await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                hashedRt: hash,
            },
        })
    }
}

