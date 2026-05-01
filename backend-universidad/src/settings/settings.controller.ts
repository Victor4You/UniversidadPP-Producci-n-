import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':key')
  async getSetting(@Param('key') key: string) {
    return this.settingsService.getByKey(key);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async updateSetting(@Body() body: { key: string; value: any }) {
    // Usamos el método upsert que ya tienes definido en tu service
    return this.settingsService.upsert(body.key, body.value);
  }
}
