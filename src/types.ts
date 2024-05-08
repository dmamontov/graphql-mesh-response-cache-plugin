export type RootType = 'Query' | 'Mutation';

export interface ResponseCacheConfig {
    enabled: boolean;
    caches: ResponseCacheCachesConfig[];
}
export interface ResponseCacheCachesConfig {
    sourceName: string;
    typeName: RootType;
    fieldName: string;
    cacheKey?: string;
    invalidate: ResponseCacheInvalidateConfig;
}

export interface ResponseCacheInvalidateConfig {
    effectingOperations?: [ResponseCacheEffectingOperationConfig];
    ttl: number;
}

export interface ResponseCacheEffectingOperationConfig {
    sourceName: string;
    typeName: RootType;
    fieldName: string;
    matchPrefix: string;
}
