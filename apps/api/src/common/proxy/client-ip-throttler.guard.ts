import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { clientIpOf } from './trusted-proxy';

/** Rate limits per visitor, also when requests arrive through the Cloudflare proxy. */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(request: Record<string, unknown>): Promise<string> {
    return clientIpOf(request as unknown as Request) ?? 'unknown';
  }
}
