# Response Cache Plugin for GraphQL Mesh

Response Cache Plugin is designed to enhance the performance of your GraphQL services by providing caching capabilities for delegated context results. This plugin allows you to cache responses and invalidate them efficiently based on specified configurations.

## Installation

Before you can use the Response Cache Plugin, you need to install it along with GraphQL Mesh if you haven't already done so. You can install these using npm or yarn.

```bash
npm install @dmamontov/graphql-mesh-response-cache-plugin
```

or

```bash
yarn add @dmamontov/graphql-mesh-response-cache-plugin
```

## Configuration

### Modifying tsconfig.json

To make TypeScript recognize the Response Cache Plugin, you need to add an alias in your tsconfig.json.

Add the following paths configuration under the compilerOptions in your tsconfig.json file:

```json
{
  "compilerOptions": {
    "paths": {
       "response-cache": ["node_modules/@dmamontov/graphql-mesh-response-cache-plugin"]
    }
  }
}
```

### Adding the Plugin to GraphQL Mesh

You need to include the Response Cache Plugin in your GraphQL Mesh configuration file (usually .meshrc.yaml). Below is an example configuration that demonstrates how to use this plugin:

```yaml
plugins:
  - responseCache:
      enabled: true
      caches:
          - sourceName: Orders
            typeName: Query
            fieldName: order
            cacheKey: '{sourceName}-{typeName}-{fieldName}-{fieldNamesHash}'
            invalidate:
              ttl: 300
              effectingOperations:
                - sourceName: Orders
                  typeName: Query
                  fieldName: updateOrder
                  matchPrefix: '{sourceName}-{typeName}-{fieldName}-'
```

- **enabled**: A boolean value to enable or disable the caching functionality;
- **caches**: array represents a specific caching rule and contains the following properties:
  - **sourceName**: The name of the data source;
  - **typeName**: Type of operation, either Query or Mutation;
  - **fieldName**: The name of the field (method) to be cached;
  - **cacheKey**: A template string for generating cache keys. It can include variables like {sourceName}, {typeName}, {fieldName}, {context}, {args}, {fieldNamesHash}, {argsHash}, {info};
  - **invalidate**: invalidation settings:
    - **ttl**: Time-to-live (in seconds) for cache entries;
    - **effectingOperations**: An array of operations that, when executed, will trigger cache invalidation based on the specified prefix:
        - **sourceName**: The name of the data source;
        - **typeName**: Type of operation, either Query or Mutation;
        - **fieldName**: The name of the field;
        - **matchPrefix**: A template string that defines the prefix for matching cache keys to be invalidated.

## Conclusion

Remember, always test your configurations in a development environment before applying them in production to ensure that everything works as expected.