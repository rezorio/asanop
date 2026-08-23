import { Controller, Get, Header, ServiceUnavailableException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  ready() {
    return this.checkDatabase()
  }

  @Get('live')
  @Header('Cache-Control', 'no-store')
  live() {
    return { ok: true, service: 'asanop-api', pid: process.pid }
  }

  @Get('ready')
  @Header('Cache-Control', 'no-store')
  readiness() {
    return this.checkDatabase()
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return {
        ok: true,
        service: 'asanop-api',
        database: 'ready',
        pid: process.pid,
      }
    } catch {
      throw new ServiceUnavailableException({
        ok: false,
        service: 'asanop-api',
        database: 'unavailable',
      })
    }
  }
}
