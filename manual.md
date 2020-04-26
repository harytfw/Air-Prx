# 版本 1.x.x

# 调整代理执行顺序

# Types
## Configuration

| Property | Type| Description | Value |
| -- | -- | -- | -- |
| features | string[] | 启用的扩展特性  | `debug` \|  `container` \| `limit_my_ip` |
| groups | GroupConfig[] | 规则组列表 |
| myIp | string | 我的ip地址 |
| myIpList | string[] | 我的ip地址列表 |
| subSource | string | 配置订阅源 |


## Features 介绍

* `container`: 

启用支持容器功能，需要安装`XX`。安装XX后每个标签页归属于指定的容器，扩展允许只代理指定的容器下的标签页，Firefox 上有效。

* `limit_my_ip`: 

当 `myIp` 不与 `myIpList` 匹配时，暂时不使用代理。使用场景: 当电脑使用了一个全局代理时，电脑的ip地址会发生变更，且不能匹配 `myIpList` 时，此时代理功能就会暂时关闭，避免了二次代理。

## GroupConfig 介绍

| Property | Type | Optional | Description |
| -- | -- | -- | -- | -- |
| name | string | No | 规则组名称 | |
| enable | boolean | No | 表明规则组是否启用 |
| proxyInfo | ProxyInfo | No | 规则组使用的代理信息|
| matchType | string| No | 规则组匹配类型 |
| rules |string[] | Yes | 规则列表，根据匹配类型的不同，规则列表的内容也会不同 |
| subSource | string | Yes | 规则列表订阅源 |
| subType | string | Yes | 订阅类型 |

### GroupConfig.matchType 说明

* `std`

标准匹配，匹配每个请求的URL地址，支持AutoProxy格式的规则。

* `hostname`

主机名匹配。只跟当前页面的主机名进行匹配，若匹配成功，则此页面所有请求都会经过代理。

* `ip`

ip地址匹配，匹配每个请求的ip地址。

* `container`

容器匹配，匹配标签页所属的容器名。

* `void`

空匹配，无视规则，直接匹配成功。

### GroupConfig.rules 和规则内容介绍
| 匹配类型 | 规则内容 | 规则例子
| -- | -- | -- |
| `std` | 符合AutoProxy格式的规则 | `||example.org`,  `/^https?:\/\/www.google.com/.*$/`
| `hostname` | 纯主机名 | `example.org` 或 `google.com`
| `ip` | CIDR格式 | `127.0.0.1/24`, `192.168.1.1/24`, `10.0.1.1/8`
| `container` | 容器名称 | `私人`

### GroupConfig.subType 介绍

* `autoproxy`:  AutoProxy的规则订阅源
* `base64_autoproxy`: 经过Base64编码的AutoProxy 规则订阅源
* `cidr`: CIDR格式的规则订阅源

## ProxyInfo 

| Property | Type | Optional | Description |
| -- | -- | -- | -- |
| type | string | No | 代理类型 |
| id | string | Yes |  标识当前代理信息的ID，方便被 `refId`项引用 |
| refId | string | Yes | 引用的ID。当此属性存在时，`type` 可省略，并会尝试引用具有相同ID值的代理信息 |
| host| string | Yes | 代理服务器的地址|
| port | number | Yes | 代理服务器的端口|
| username | string | Yes | 认证用户名 |
| password | string| Yes | 认证密码|
| proxyDNS | boolean | Yes | 是否代理DNS |

### ProxyInfo.type 介绍
* `direct`: 不经过代理服务器
* `http`: http协议代理
* `socks`: socks5协议代理

# 配置例子

## Global Proxy

```json
{

  "features": [],
  "groups": [
    {
      "name": "void",
      "enable": true,
      "matchType": "void",
      "proxyInfo": {
        "type": "http",
        "host": "127.0.0.1",
        "port": 1081
      },
      "subType": "",
      "subSource": ""
    }
  ]
}
```

## IP
```json
{

  "features": [],
  "groups": [
    {
      "name": "ip group",
      "enable": true,
      "matchType": "ip",
      "proxyInfo": {
        "type": "http",
        "host": "127.0.0.1",
        "port": 1081
      },
      "rules":[
        "1.2.3.4/16",
        "2.3.4.5/24",
      ],
      "subType": "",
      "subSource": ""
    },
    {
      "name": "void group",
      "enable": true,
      "matchType": "void",
      "proxyInfo": {
        "type": "direct"
      },
      "subType": "",
      "subSource": ""
    }
  ]
}
```

## Container
```json
{

  "features": ["container"],
  "groups": [
    {
      "name": "container group",
      "enable": true,
      "matchType": "container",
      "proxyInfo": {
        "type": "http",
        "host": "127.0.0.1",
        "port": 1081
      },
      "rules":["ContainerName"],
      "subType": "",
      "subSource": ""
    },
    {
      "name": "void group",
      "enable": true,
      "matchType": "void",
      "proxyInfo": {
        "type": "direct"
      },
      "subType": "",
      "subSource": ""
    }
  ]
}
```


## Proxy Info Reference

```json
{

  "features": [],
  "groups": [
    {
      "name": "home group",
      "enable": true,
      "matchType": "void",
      "proxyInfo": {
        "id": "myProxyInfo",
        "type": "http",
        "host": "127.0.0.1",
        "port": 1081
      },
      "rules":["www.google.com"],
      "subType": "",
      "subSource": "",
      "matchType": "hostname"
    },
    {
      "name": "company group",
      "enable": true,
      "matchType": "hostname",
      "proxyInfo": {
        "refId": "myProxyInfo",
      },
      "rules":["youtube.com"],
      "subType": "",
      "subSource": "",
    }
  ],
  "subSource": "example.com/sub.json"
}
```

## limit_my_ip
```json
{

  "features": ["limit_my_ip"],
  "groups": [
    {
      "name": "void group",
      "enable": true,
      "matchType": "void",
      "proxyInfo": {
        "type": "http",
        "host": "127.0.0.1",
        "port": 1081
      },
      "subType": "",
      "subSource": "",
      "matchType": "void"
    }
  ],
  "myIpList": [
    "192.168.1.1/24",
    "123.12.3.0/24"
  ]
}
```

## Subscription

```json
{

  "features": [],
  "groups": [
    {
      "name": "void",
      "enable": true,
      "matchType": "void",
      "proxyInfo": {
        "type": "http",
        "host": "127.0.0.1",
        "port": 1081
      },
      "subType": "autoproxy",
      "subSource": "http://example.com/autoproxy.txt",
      "rules":[]
    }
  ]
}
```
```json
{
  "subSource": "example.com/sub.json"
}
```


# 如何在 Chrome 上使用带授权的 HTTP 代理或 SOCKS 代理

使用 sstunel 将代理进行包装，在本地暴露出新的代理端口。