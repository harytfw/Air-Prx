# 调整代理执行顺序

# Example Configuration


```json
{
  "_": "",
  "features": [],
  "groups": [
    {
      "name": "void",
      "enable": true,
      "proxyInfo": {
        "type": "http",
        "host": "127.0.0.1",
        "port": 1081
      },
      "order": 1,
      "subType": "",
      "matchType": "void",
      "subSource": "",
    }
  ]
}
```

# Types
## Configuration

| property name | type | value |
| -- | -- | -- |
| features | string[] | `'log'|'cache'|'ipv6'` |
| groups | GroupConfig[] | |


## GroupConfig

| property name | type | optional | value |
| -- | -- | -- | -- |
| name | string | No | |
| enable | boolean | No |
| matchType | string| Yes |
| order | number | Yes|
| proxyInfo | ProxyInfo | No |
| rules |string[] | Yes |
| subSource | string | Yes　|
| subType | string | Yes |

## ProxyInfo 

| property name | type | optional | value |
| -- | -- | -- | -- |
| type | string | No | |
| id | string | Yes | |
| refId | string | Yes | |
| host| string | Yes | |
| port | number | Yes | |
| username | string | Yes | |
| password | string| Yes | |
| proxyDNS | boolean | Yes | |
