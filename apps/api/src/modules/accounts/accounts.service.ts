import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, createAccountDto: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        ...createAccountDto,
        userId,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.account.findMany({
      where: { userId },
    });
  }

  findOne(id: string, userId: string) {
    return this.prisma.account.findFirst({
      where: { id, userId },
    });
  }

  update(id: string, userId: string, updateAccountDto: UpdateAccountDto) {
    return this.prisma.account.updateMany({
      where: { id, userId },
      data: updateAccountDto,
    });
  }

  remove(id: string, userId: string) {
    return this.prisma.account.deleteMany({
      where: { id, userId },
    });
  }
}
