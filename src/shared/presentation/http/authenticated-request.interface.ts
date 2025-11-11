import { Request } from 'express';

export interface AuthenticatedUser {
  sub: string;
  email?: string;
  roles?: string[];
  [key: string]: unknown;
}

export interface AuthenticatedRequest<TUser extends AuthenticatedUser = AuthenticatedUser>
  extends Request {
  user: TUser;
}
