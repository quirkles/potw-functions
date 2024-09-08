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

export class ForbiddenError extends CustomError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ServerError extends CustomError {
  constructor(message: string) {
    super(message, 500);
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
  case BadRequestError:
    return {
      statusCode: 400,
      response: {
        message: error.message,
      },
    };
  case ServerError:
    return {
      statusCode: 500,
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
