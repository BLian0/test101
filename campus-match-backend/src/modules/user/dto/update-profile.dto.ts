import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MinLength(2)
  nickname: string;

  @IsString()
  avatarUrl: string;

  @IsInt()
  @Min(18)
  @Max(35)
  age: number;

  @IsOptional()
  @IsString()
  @IsIn(['MALE', 'FEMALE', 'NON_BINARY'])
  gender?: string;

  @IsOptional()
  @IsString()
  @IsIn(['MALE', 'FEMALE', 'ALL'])
  sexualOrientation?: string;

  @IsOptional()
  @IsInt()
  @Min(500)
  @Max(99999)
  monthlySpending?: number;

  @IsOptional()
  @IsString()
  bio?: string;
}
