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

export function getResponseFromError(error: Error): { statusCode: number; response: Record<string, unknown> } {
  switch (error.constructor) {
  case NotFoundError:
    return {
      statusCode: 404,
      response: {
        message: error.message,
      },
    };
  default:
    return {
      statusCode: 500,
      response: {
        message: "An error occurred",
      },
    };
  }
}
