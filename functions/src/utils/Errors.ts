export abstract class CustomError extends Error {
  public readonly code: number;
  protected constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string) {
    super(message, 404);
  }
}
