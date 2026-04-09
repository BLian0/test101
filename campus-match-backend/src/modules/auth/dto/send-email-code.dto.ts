import { IsEmail, IsIn, IsString } from 'class-validator';

export class SendEmailCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsIn(['REGISTER', 'LOGIN'])
  scene: string;
}
