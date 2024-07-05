import type { NextFunction, Request, Response } from "express";

export const catchAsync =
  (fn: any): any =>
  (err: any, req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);
