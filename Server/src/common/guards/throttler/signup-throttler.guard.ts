import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class SignupThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ips?.length ? req.ips[0] : req.ip;
  }

  protected errorMessage = 'Too many signup attempts. Please try again later.';
}
