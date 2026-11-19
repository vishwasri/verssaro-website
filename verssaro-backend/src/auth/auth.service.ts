import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, UpdateProfileDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private sanitizeUser(user: any) {
    const { passwordHash: _omit, ...rest } = user;
    return rest;
  }

  async resolveUserFromTokenOrDefault(authHeader?: string) {
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7).trim();
        const payload = this.jwtService.verify<{ sub: string }>(token);
        const found = await this.prisma.user.findUnique({
          where: { id: payload.sub },
        });
        if (found) return found;
      } catch {
        // fallback to demo patron
      }
    }

    const demoUser =
      (await this.prisma.user.findUnique({
        where: { email: 'alexander.wright@verssaro.vip' },
      })) ?? (await this.prisma.user.findFirst());

    if (!demoUser) {
      throw new NotFoundException('No client record found');
    }
    return demoUser;
  }

  async getDossierSummary(authHeader?: string) {
    const user = await this.resolveUserFromTokenOrDefault(authHeader);
    const [orderCount, wishlistCount, enquiryCount, addressCount] =
      await Promise.all([
        this.prisma.order.count({ where: { userId: user.id } }),
        this.prisma.wishlistItem.count({ where: { userId: user.id } }),
        this.prisma.enquiry.count({ where: { userId: user.id } }),
        this.prisma.address.count({ where: { userId: user.id } }),
      ]);

    return {
      user: this.sanitizeUser(user),
      counts: {
        orders: orderCount,
        wishlist: wishlistCount,
        enquiries: enquiryCount,
        addresses: addressCount,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const suffix = Math.floor(1000 + Math.random() * 8999);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name.trim(),
        phone: dto.phone?.trim() ?? null,
        role: 'CLIENT',
        dossierCode: `DOSSIER // ${suffix}-VR`,
        tier: 'HERITAGE PATRON',
        atelierHub: 'COLOMBO FLAGSHIP',
        storeCreditUsd: 0,
      },
    });

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  async updateProfile(authHeader: string | undefined, dto: UpdateProfileDto) {
    const user = await this.resolveUserFromTokenOrDefault(authHeader);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() } : {}),
        ...(dto.atelierHub ? { atelierHub: dto.atelierHub.trim() } : {}),
        ...(dto.liaisonNotes !== undefined
          ? { liaisonNotes: dto.liaisonNotes.trim() }
          : {}),
      },
    });
    return { user: this.sanitizeUser(updated) };
  }
}
