import { IsIn, IsString, Matches } from 'class-validator';

export class SendPhoneCodeDto {
  @Matches(/^1\d{10}$/, {
    message: '请输入正确的 11 位手机号',
  })
  phone: string;

  @IsString()
  @IsIn(['REGISTER', 'LOGIN'])
  scene: string;
}
