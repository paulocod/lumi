import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

interface RequestWithBody extends Request {
  body: {
    email: string;
  };
}

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: RequestWithBody): Promise<string> {
    return Promise.resolve(req.body.email);
  }
}
