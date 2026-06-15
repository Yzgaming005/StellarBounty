import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ChallengeQueryDto {
  @ApiProperty({
    description: 'Stellar public key requesting an authentication challenge',
    example: 'GDXP4W5M2K2N7KDXP4W5M2K2N7KDXP4W5M2K2N7KDXP4W5M2K2N7KDX',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^G[A-Z2-7]{55}$/, {
    message: 'address must be a valid Stellar public key (starts with G, 56 characters)',
  })
  address!: string;
}

export class ChallengeResponseDto {
  @ApiProperty({
    description: 'One-time nonce to sign with the requested Stellar account',
    example: 'f8a9f3d6a0e6c4b2f1d9c7a5e3b1d0c9f8a7e6d5c4b3a2918070605040302010',
  })
  nonce!: string;
}
