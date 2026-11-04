import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/** Exemplo legado do scaffold: não está registrado no AppModule nem serve como health check. */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Usado apenas pelo teste legado enquanto o controller não está registrado. */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
