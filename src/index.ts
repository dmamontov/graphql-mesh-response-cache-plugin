import { type Plugin } from 'graphql-yoga';
import { type MeshPlugin, type MeshPluginOptions } from '@graphql-mesh/types';
import { createDefaultExecutor } from '@graphql-tools/delegate';
import { type ExecutionRequest, type ExecutionResult } from '@graphql-tools/utils';
import { type ResponseCacheConfig, type ResponseCacheEffectingOperationConfig } from './types';
import { evaluate, generateKey } from './utils';

export default function useResponseCache(
    pluginOptions: MeshPluginOptions<ResponseCacheConfig>,
): MeshPlugin<any> {
    const { enabled, caches } = pluginOptions;
    const isEnabled = evaluate(enabled);

    return {
        onPluginInit({ addPlugin }) {
            addPlugin({
                onParams({ params, setParams }) {
                    if (!params.variables) {
                        return;
                    }

                    setParams({
                        query: params.query + '\n# variables=' + JSON.stringify(params.variables),
                        variables: params.variables,
                        extensions: params.extensions,
                        operationName: params.operationName,
                    });
                },
            } as Plugin);
        },
        onDelegate(payload) {
            if (!isEnabled) {
                return;
            }

            const config = caches.find(
                cache =>
                    cache.sourceName === payload.sourceName &&
                    cache.typeName === payload.typeName &&
                    cache.fieldName === payload.fieldName,
            );

            const searchEffectingOperations = (opertaion: ResponseCacheEffectingOperationConfig) =>
                opertaion.sourceName === payload.sourceName &&
                opertaion.typeName === payload.typeName &&
                opertaion.fieldName === payload.fieldName;

            const configByEffecting = caches.find(cache =>
                cache?.invalidate?.effectingOperations?.find(searchEffectingOperations),
            );

            // @ts-expect-error
            if (!payload.schema?._withoutCacheExecutor) {
                // @ts-expect-error
                payload.schema._withoutCacheExecutor =
                    // @ts-expect-error
                    payload.schema?.executor || createDefaultExecutor(payload.schema?.schema);
            }

            // @ts-expect-error
            payload.schema.executor = async (request: ExecutionRequest) => {
                const invalidate = async () => {
                    if (!configByEffecting?.invalidate?.effectingOperations) {
                        return;
                    }

                    const effectingConfig =
                        configByEffecting.invalidate.effectingOperations.find(
                            searchEffectingOperations,
                        );
                    if (!effectingConfig?.matchPrefix) {
                        return;
                    }

                    const matchKey = generateKey(
                        effectingConfig.matchPrefix,
                        effectingConfig,
                        payload,
                        request,
                    );

                    const matchKeys = await payload.context.cache.getKeysByPrefix(matchKey);
                    for (const matchKey of matchKeys) {
                        await payload.context.cache.delete(matchKey);
                    }
                };

                if (!config || payload.context?.request?.headers['cache-control'] === 'no-cache') {
                    // @ts-expect-error
                    const result = (await payload.schema._withoutCacheExecutor(
                        request,
                    )) as ExecutionResult;

                    await invalidate();

                    return result;
                }

                const cacheKey = generateKey(
                    config.cacheKey ||
                        '{sourceName}-{typeName}-{fieldName}-{argsHash}-{fieldNamesHash}',
                    config,
                    payload,
                    request,
                );

                let result = await payload.context.cache.get(cacheKey);
                if (result) {
                    await invalidate();

                    return result;
                }

                // @ts-expect-error
                result = (await payload.schema._withoutCacheExecutor(request)) as ExecutionResult;

                if (
                    (result?.errors && result.errors.length > 0) ||
                    !result?.data ||
                    (Object.keys(result.data).includes(config.fieldName) &&
                        !result.data[config.fieldName]) ||
                    (Object.keys(result.data).includes('__gqtlw__') &&
                        Object.keys(result.data.__gqtlw__).includes(config.fieldName) &&
                        !result.data.__gqtlw__[config.fieldName])
                ) {
                    return result;
                }

                await payload.context.cache.set(cacheKey, result, config.invalidate);

                await invalidate();

                return result;
            };
        },
    };
}
