import { IsString, Length, Matches } from 'class-validator';

export class LoginPhoneDto {
  @Matches(/^1\d{10}$/, {
    message: '请输入正确的 11 位手机号',
  })
  phone: string;

  @IsString()
  @Length(6, 32)
  password: string;
}
