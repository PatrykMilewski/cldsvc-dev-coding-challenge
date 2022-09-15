import createError from 'http-errors';
import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // if err message is safe to expose to client or we are in development mode
  if (err.expose || process.env.NODE_ENV === 'development') {
    res.status(err.status || 500).send(err);
  } else {
    res.status(500).send(new createError.InternalServerError());
  }
};

interface Error {
  expose: boolean;
  status?: number;
}
