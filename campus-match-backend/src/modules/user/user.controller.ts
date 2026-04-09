import { Body, Controller, Get, Put, Query } from '@nestjs/common';

import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

@Controller('profile')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMyProfile() {
    return this.userService.getMyProfile();
  }

  @Get('nickname/check')
  checkNickname(@Query('nickname') nickname: string) {
    return this.userService.checkNickname(nickname ?? '');
  }

  @Put('me')
  updateMyProfile(@Body() body: UpdateProfileDto) {
    return this.userService.updateMyProfile(body);
  }
}
