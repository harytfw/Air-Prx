# 版本 1.x.x

# 调整代理执行顺序

# 配置模板


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
| features | string[] | `debug` \| `ipv6` \| `container` |
| groups | GroupConfig[] | |


## GroupConfig

| property name | type | Optional | value |
| -- | -- | -- | -- |
| name | string | No | |
| enable | boolean | No |
| proxyInfo | ProxyInfo | No |
| matchType | string| No |
| order | number | Yes|
| rules |string[] | Yes |
| subSource | string | Yes　|
| subType | string | Yes |
| containerName | string | Yes |

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



# 如何在 Chrome 上使用带授权的 HTTP 代理或 SOCKS 代理

使用 sstunel 将代理进行包装，在本地暴露出新的代理端口。