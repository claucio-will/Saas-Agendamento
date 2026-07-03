import { z } from 'zod';
import { userRoleSchema } from '../enums.js';

/** Cadastro público de cliente final (role CUSTOMER). Ver PRD 2.8. */
export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().min(8).max(20).optional(),
});
export type RegisterDto = z.infer<typeof registerSchema>;

/** Login por e-mail + senha. Ver PRD 2.2. */
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof loginSchema>;

/** Troca de refresh token por um novo par de tokens (rotação). */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10),
});
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

/** Usuário autenticado retornado pela API (sem dados sensíveis). */
export const authUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  tenantId: z.string().uuid().nullable(),
});
export type AuthUserDto = z.infer<typeof authUserSchema>;

/** Resposta de login/registro/refresh: usuário + par de tokens. */
export const authResponseSchema = z.object({
  user: authUserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthResponseDto = z.infer<typeof authResponseSchema>;
