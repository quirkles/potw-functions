import {DocumentOptions} from "firebase-functions/lib/v2/providers/firestore";
import {HttpsOptions} from "firebase-functions/v2/https";
import {PubSubOptions} from "firebase-functions/v2/pubsub";
import {TypeOf, ZodSchema} from "zod";

import {TopicNames} from "../services/pubsub";
import type {Maybe, OrPromise} from "../typeUtils";

export type HttpHandlerFunctionConfig<
    BodySchema extends ZodSchema | undefined,
    QuerySchema extends ZodSchema | undefined,
    ResponseSchema extends ZodSchema | undefined,
    RequireAuthToken extends boolean,
> = HttpsOptions & {
    bodySchema?: BodySchema,
    querySchema?: QuerySchema,
    responseSchema?: ResponseSchema,
    loggerName?: string,
    useAppCheck?: boolean,
    requireAuthToken?: RequireAuthToken,
    functionName?: string,
};

export type HttpHandlerFunction<
    BodySchema extends ZodSchema | undefined,
    QuerySchema extends ZodSchema | undefined,
    ResponseSchema extends ZodSchema | undefined,
    RequireAuthToken extends boolean,
> = (
    payload: {
        body: BodySchema extends ZodSchema ? TypeOf<BodySchema> : unknown,
        query: QuerySchema extends ZodSchema ? TypeOf<QuerySchema> : unknown,
        headers: Record<string, string>,
        tokenPayload: RequireAuthToken extends true ? {
            email: string,
            firestoreId: string,
           sqlId: string,
        } : Record<string, string>,
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

export type PubSubHandlerFunctionConfig<
    BodySchema extends ZodSchema | undefined,
> = PubSubOptions & {
    topic: TopicNames,
    bodySchema?: BodySchema,
    loggerName?: string,
    useAppCheck?: boolean,
    functionName?: string,
}

export type PubSubHandlerFunction<
    BodySchema extends ZodSchema | undefined,
> = (
    payload: BodySchema extends ZodSchema ? TypeOf<BodySchema> : unknown,
) => unknown | Promise<unknown>;

export type OnDocumentCreatedHandlerFunction<
    NewDocumentSchema extends ZodSchema | undefined,
    ParamsSchema extends ZodSchema | undefined,
> = (
    payload: NewDocumentSchema extends ZodSchema ? TypeOf<NewDocumentSchema> : unknown,
    params: ParamsSchema extends ZodSchema ? TypeOf<ParamsSchema> : unknown,
) => unknown | Promise<unknown>;

export type OnDocumentCreatedHandlerFunctionConfig<
    NewDocumentSchema extends ZodSchema | undefined,
    ParamsSchema extends ZodSchema | undefined,
    Document extends string
> = DocumentOptions<Document> & {
    newDocumentSchema?: NewDocumentSchema,
    paramsSchema?: ParamsSchema,
    functionName?: string,
}

export type OnDocumentUpdateHandlerFunction<
    BeforeDocumentSchema extends ZodSchema | undefined,
    AfterDocumentSchema extends ZodSchema | undefined,
    ParamsSchema extends ZodSchema | undefined,
> = (
    before: BeforeDocumentSchema extends ZodSchema ? TypeOf<BeforeDocumentSchema> : unknown,
    after: AfterDocumentSchema extends ZodSchema ? TypeOf<AfterDocumentSchema> : unknown,
    params: ParamsSchema extends ZodSchema ? TypeOf<ParamsSchema> : unknown,
) => unknown | Promise<unknown>;

export type OnDocumentUpdateHandlerFunctionConfig<
    BeforeDocumentSchema extends ZodSchema | undefined,
    AfterDocumentSchema extends ZodSchema | undefined,
    ParamsSchema extends ZodSchema | undefined,
    Document extends string
> = DocumentOptions<Document> & {
    beforeDocumentSchema?: BeforeDocumentSchema,
    afterDocumentSchema?: AfterDocumentSchema,
    paramsSchema?: ParamsSchema,
    functionName?: string,
}

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
