export interface IUser {
  id: string;
  email: string;
  [key: string]: any;
}

declare module 'express' {
  interface Request {
    user?: IUser;
  }
}
