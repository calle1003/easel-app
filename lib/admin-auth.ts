/**
 * 管理API用認証ミドルウェア
 * すべての管理系APIエンドポイントで使用し、不正アクセスを防ぐ
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeader } from './auth';
import { logger } from './logger';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
}

export interface AuthError {
  error: string;
  status: number;
}

/**
 * 管理者認証を要求する
 * @returns ユーザー情報 or エラーオブジェクト
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ user: AuthenticatedUser } | AuthError> {
  const authHeader = request.headers.get('authorization');
  const token = getTokenFromHeader(authHeader);

  // トークンが存在しない
  if (!token) {
    logger.warn('Admin API accessed without token', {
      path: request.nextUrl.pathname,
      method: request.method,
    });
    return { error: 'Authentication required', status: 401 };
  }

  // トークンの検証
  const payload = await verifyToken(token);
  
  if (!payload) {
    logger.warn('Admin API accessed with invalid token', {
      path: request.nextUrl.pathname,
      method: request.method,
    });
    return { error: 'Invalid or expired token', status: 401 };
  }

  // 管理者権限の確認
  if (payload.role !== 'ADMIN' && payload.role !== 'SUPER_ADMIN') {
    logger.warn('Non-admin user attempted to access admin API', {
      userId: payload.id,
      email: payload.email,
      role: payload.role,
      path: request.nextUrl.pathname,
    });
    return { error: 'Admin privileges required', status: 403 };
  }

  logger.info('Admin API access authorized', {
    userId: payload.id,
    role: payload.role,
    path: request.nextUrl.pathname,
  });

  return { user: payload };
}

/**
 * SUPER_ADMIN権限を要求する（より制限の厳しい認証）
 */
export async function requireSuperAdmin(
  request: NextRequest
): Promise<{ user: AuthenticatedUser } | AuthError> {
  const result = await requireAdmin(request);
  
  if ('error' in result) {
    return result;
  }

  if (result.user.role !== 'SUPER_ADMIN') {
    logger.warn('Non-super-admin attempted to access super-admin API', {
      userId: result.user.id,
      role: result.user.role,
      path: request.nextUrl.pathname,
    });
    return { error: 'Super admin privileges required', status: 403 };
  }

  return result;
}

/**
 * 認証チェック結果を処理するヘルパー関数
 */
export function handleAuthResult(
  result: { user: AuthenticatedUser } | AuthError
): NextResponse | null {
  if ('error' in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }
  return null; // 認証成功
}

/**
 * 使用例:
 * 
 * export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
 *   const auth = await requireAdmin(request);
 *   const authError = handleAuthResult(auth);
 *   if (authError) return authError;
 *   
 *   const user = (auth as { user: AuthenticatedUser }).user;
 *   
 *   // 認証済みの処理...
 * }
 */
