# 扩展代理的过程

请求将会跟每个被启用的规则组进行匹配。

匹配成功，则使用规则组所指定的代理信息。每个规则组可指定使用代理（黑名单）还是不使用代理（白名单，直连）

若没有匹配成功，则继续跟下一个规则组进行匹配。直至所有规则组都被匹配。

每个匹配结果都会被缓存起来，缓存的key为每个请求的主机名。

# 调整代理执行顺序

在工具栏点击本扩展图标，在窗口UI中可以调整每个规则组的顺序。每次调整都会请求缓存。


# 配置

扩展使用JSON作为配置存储格式。

| 属性 | 类型| 描述 | 
| -- | -- | -- |
| features | string[] | 启用的扩展特性，有些功能需要添加到 `features` 才能生效，可用值 `debug` \|  `container` \| `limit_my_ip` |
| groups | GroupConfig[] | 规则组列表 |
| myIp | string | 我的ip地址，不指定时可以自动获取 |
| myIpList | string[] | 我的ip地址列表，CIDR格式 |
| subSource | string | 配置订阅源 |

## features 特性介绍

* `container`: 

启用支持容器功能，需要安装`XX`。安装XX后每个标签页归属于指定的容器，扩展允许只代理指定的容器下的标签页，Firefox 上有效。

* `limit_my_ip`: 

当 `myIp` 与 `myIpList` 匹配失败时，暂时关闭扩展功能。使用场景: 当电脑使用了一个全局代理时，电脑的ip地址会发生变更，且不能匹配 `myIpList` 时，此时扩展功能就会暂时关闭，避免了二次代理。

* `debug`

打印调试信息

## GroupConfig 规则组介绍

| 属性 | 类型 | 可选 | 描述 |
| -- | -- | -- | -- | -- |
| name | string | No | 规则组名称 | |
| enable | boolean | No | 表明规则组是否启用 |
| proxyInfo | ProxyInfo | No | 规则组使用的代理信息|
| matchType | string| No | 规则组匹配类型 |
| rules |string[] | Yes | 规则列表，根据匹配类型的不同，规则列表的内容也会不同 |
| subSource | string | Yes | 规则列表订阅源 |
| subType | string | Yes | 订阅类型 |

### matchType 匹配类型值说明

* `std`

标准匹配，匹配每个请求的URL地址，支持AutoProxy格式的规则。

* `hostname`

主机名匹配。只跟当前页面的主机名进行匹配，若匹配成功，则此页面所有请求都会经过代理。只限Firefox

* `ip`

ip地址匹配，匹配每个请求的ip地址。

* `container`

容器匹配，匹配标签页所属的容器名。只限Firefox

* `void`

空匹配，无视规则，直接匹配成功。

### rules 规则组说明
| 对应匹配类型 | 规则内容 | 规则例子
| -- | -- | -- |
| `std` | 符合AutoProxy格式的规则，白名单表示不代理 | `||example.org`,  `/^https?:\/\/www.google.com/.*$/`
| `hostname` | 纯主机名 | `example.org` 或 `google.com`
| `ip` | CIDR格式 | `127.0.0.1/24`, `192.168.1.1/24`, `10.0.1.1/8`
| `container` | 容器名称 | `私人`

### subType 订阅类型介绍

* `autoproxy`

AutoProxy 的规则订阅源

* `base64_autoproxy`

 经过Base64编码的 AutoProxy 规则订阅源

* `cidr`

 CIDR格式的规则订阅源

## ProxyInfo 代理信息说明

| 属性 | 类型 | 可选 | 描述 |
| -- | -- | -- | -- |
| type | string | No | 代理类型，支持 `direct` \| `http` \| `socks` |
| id | string | Yes |  标识当前代理信息的ID，方便被 `refId`项引用 |
| refId | string | Yes | 引用的ID。当此属性存在时，`type` 可省略，并会尝试引用具有相同ID值的代理信息 |
| host| string | Yes | 代理服务器的地址|
| port | number | Yes | 代理服务器的端口|
| username | string | Yes | 认证用户名，`socks` 有效 |
| password | string| Yes | 认证密码，`socks` 有效 |
| proxyDNS | boolean | Yes | 是否代理DNS，`socks` 有效 |

### type 介绍
* `direct`

 直连，不经过代理服务器

* `http`

 http协议代理

* `socks`

socks5协议代理

## 配置例子

### 全局代理

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

### 匹配IP地址
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

### Container 容器
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


### 引用代理信息

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

### 限制我的IP
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

### 订阅

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