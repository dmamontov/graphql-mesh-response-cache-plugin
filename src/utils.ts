import { Md5 } from 'ts-md5';
import { stringInterpolator } from '@graphql-mesh/string-interpolation';
import { type OnDelegateHookPayload } from '@graphql-mesh/types';
import { type ExecutionRequest } from '@graphql-tools/utils';
import {
    type ResponseCacheCachesConfig,
    type ResponseCacheEffectingOperationConfig,
} from './types';

export const evaluate = (value?: any, sourceData: Record<string, any> = {}): any => {
    if (typeof value === 'string') {
        const data = {
            ...sourceData,
            env: process.env,
        };
        const result = stringInterpolator.parse(value, data);

        if (result === '') {
            return undefined;
        } else if (result === 'null') {
            return null;
        } else if (result === 'true' || result === 'false') {
            return result === 'true';
        } else if (!isNaN(Number(result))) {
            return Number(result);
        }

        return result;
    }

    return value;
};

export const generateKey = (
    cacheKey: string,
    config: ResponseCacheCachesConfig | ResponseCacheEffectingOperationConfig,
    payload: OnDelegateHookPayload<any>,
    request: ExecutionRequest,
): string => {
    let args = payload.args;
    if (payload.key && payload.argsFromKeys) {
        args = payload.argsFromKeys([payload.key]);
    }

    let fieldNamesHash = '';
    if (
        request.info?.fieldNodes &&
        request.info?.fieldNodes.length > 0 &&
        request.info?.fieldNodes[0]?.selectionSet
    ) {
        fieldNamesHash = hashObject(request.info?.fieldNodes[0]?.selectionSet);
    }

    const evaluatedCacheKey = evaluate(cacheKey, {
        sourceName: config.sourceName,
        typeName: config.typeName,
        fieldName: config.fieldName,
        context: payload.context,
        args,
        fieldNamesHash,
        argsHash: hashObject(args),
        info: payload.info,
    });

    return (evaluatedCacheKey as string).toLowerCase();
};

const hashObject = (value: any): string => {
    return Md5.hashStr(JSON.stringify(value));
};
