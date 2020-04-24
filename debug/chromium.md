# How To Debug PAC in Chromium
# 如何在Chromium中调试PAC

根据 MDN 上介绍，PAC提供了一个函数 `alert()` 用来输出 PAC 的运行信息。

在Chromium中，查看 `alert()` 输出的不是那么简单，但是也有办法。

在 Chromium 浏览器中，打开 `chrome://net-export/`, 点击`Start Logging To Disk`，选择网络事件日志的输出文件

访问几个网页，让PAC脚本运行起来，然后关闭日志的输出。

使用 Chromium 提供的日志查看器 https://netlog-viewer.appspot.com/ 打开日志文件。