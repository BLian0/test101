import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(3, 24)
  @Matches(/^[A-Za-z0-9_]+$/, {
    message: '用户名仅支持英文字母、数字和下划线',
  })
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  emailCode: string;

  @IsString()
  @Length(6, 32)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'password must contain both letters and numbers',
  })
  password: string;
}
