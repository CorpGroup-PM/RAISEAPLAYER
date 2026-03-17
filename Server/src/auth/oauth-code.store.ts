import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface OAuthEntry {
  tokens: { access_token: string; refresh_token: string };
  user: {
    email: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
    role: string;
  };
  expiresAt: number;
}

@Injectable()
export class OAuthCodeStore {
  private readonly store = new Map<string, OAuthEntry>();
  private readonly TTL_MS = 2 * 60 * 1000; // 2 minutes

  generate(tokens: OAuthEntry['tokens'], user: OAuthEntry['user']): string {
    const code = crypto.randomBytes(32).toString('hex'); // 64-char cryptographically random hex
    this.store.set(code, { tokens, user, expiresAt: Date.now() + this.TTL_MS });
    setTimeout(() => this.store.delete(code), this.TTL_MS);
    return code;
  }

  consume(code: string): OAuthEntry | null {
    const entry = this.store.get(code);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(code);
      return null;
    }
    this.store.delete(code); // one-time use — deleted immediately after consumption
    return entry;
  }
}
