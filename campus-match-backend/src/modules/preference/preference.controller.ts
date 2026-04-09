import { Body, Controller, Get, Put } from '@nestjs/common';

import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { PreferenceService } from './preference.service';

@Controller('preferences')
export class PreferenceController {
  constructor(private readonly preferenceService: PreferenceService) {}

  @Get('me')
  getMyPreference() {
    return this.preferenceService.getMyPreference();
  }

  @Put('me')
  updateMyPreference(@Body() body: UpdatePreferenceDto) {
    return this.preferenceService.updateMyPreference(body);
  }
}
