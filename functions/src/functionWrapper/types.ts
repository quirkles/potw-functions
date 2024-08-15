import {TypeOf, ZodSchema} from "zod";
import type {Maybe, OrPromise} from "../typeUtils";

export type HandlerFunctionConfig<
    PayloadSchema extends ZodSchema,
    ResponseSchema extends ZodSchema,
> = {
    payloadSchema?: PayloadSchema,
    responseSchema?: ResponseSchema,
    loggerName?: string,
};

export type HandlerFunction<
    PayloadSchema extends ZodSchema,
    ResponseSchema extends ZodSchema,
> = (
    payload: PayloadSchema extends undefined ? unknown : TypeOf<PayloadSchema>
) => ResponseSchema extends undefined ? unknown : Maybe<OrPromise<TypeOf<ResponseSchema>>>;
