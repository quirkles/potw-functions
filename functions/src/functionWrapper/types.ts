import {TypeOf, ZodSchema} from "zod";
import type {Maybe, OrPromise} from "../typeUtils";

export type HandlerFunctionConfig<
    BodySchema extends ZodSchema | undefined,
    QuerySchema extends ZodSchema | undefined,
    ResponseSchema extends ZodSchema | undefined,
> = {
    bodySchema?: BodySchema,
    querySchema?: QuerySchema,
    responseSchema?: ResponseSchema,
    loggerName?: string,
};

export type HandlerFunction<
    BodySchema extends ZodSchema | undefined,
    QuerySchema extends ZodSchema | undefined,
    ResponseSchema extends ZodSchema | undefined,
> = (
    payload: {
        body: BodySchema extends ZodSchema ? TypeOf<BodySchema> : unknown,
        query: QuerySchema extends ZodSchema ? TypeOf<QuerySchema> : unknown,
    },
) => OrPromise<ResponseSchema extends ZodSchema ? {
        statusCode: ErrorStatusCodes,
    } | {
        response: TypeOf<ResponseSchema>,
        statusCode?: OKStatusCodes,
    } : Maybe<{
        response?: unknown
        statusCode?: number,
    }>
>;

type OKStatusCodes = 200 | 201 | 204;
type ErrorStatusCodes =
    400 |
    401 |
    403 |
    404 |
    405 |
    409 |
    422 |
    429 |
    500 |
    501 |
    502 |
    503 |
    504 |
    505 |
    506 |
    507 |
    508 |
    510 |
    511 |
    512 |
    599;
