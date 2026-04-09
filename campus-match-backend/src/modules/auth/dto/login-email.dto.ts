import { IsString, Length } from 'class-validator';

export class LoginEmailDto {
  @IsString()
  @Length(1, 128)
  email: string;

  @IsString()
  @Length(6, 32)
  password: string;
}
