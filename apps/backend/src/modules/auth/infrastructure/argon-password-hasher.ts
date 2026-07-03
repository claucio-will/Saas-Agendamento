import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import type { PasswordHasher } from '../domain/password-hasher';

/**
 * Hashing de senha com Argon2id (@node-rs/argon2 — binário nativo pré-compilado,
 * sem node-gyp). Ver PRD 3.4.
 */
@Injectable()
export class ArgonPasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return hash(plain);
  }

  async verify(hashed: string, plain: string): Promise<boolean> {
    try {
      return await verify(hashed, plain);
    } catch {
      return false;
    }
  }
}
