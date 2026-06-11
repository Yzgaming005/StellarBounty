import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChallengeQueryDto } from './dto/challenge-query.dto';

class VerifyDto {
  address!: string;
  signature!: string;
  nonce!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('challenge')
  getChallenge(@Query() query: ChallengeQueryDto) {
    return this.authService.getChallenge(query.address);
  }

  @Post('verify')
  verify(@Body() body: VerifyDto) {
    return this.authService.verify(body.address, body.signature, body.nonce);
  }
}
