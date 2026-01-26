---
title: "解决使用git时遇到Failed to connect to github.com port 443 after 21090 ms: Couldn‘t connect to server_git couldn't connect to server-CSDN博客"
source: "https://blog.csdn.net/qq_40296909/article/details/134285451"
author:
  - "[[成就一亿技术人!]]"
  - "[[hope_wisdom 发出的红包]]"
published:
created: 2025-12-15
description: "文章浏览阅读7.6w次，点赞377次，收藏435次。文章讲述了在访问GitHub时遇到的连接问题，通常由于开VPN导致的系统端口和Git端口不一致。提供了解决方案，包括查看并设置git的代理端口，以及如何在不挂梯子时调整或清除代理设置。"
tags:
  - "clippings"
---
#git

文章讲述了在访问GitHub时遇到的连接问题，通常由于开VPN导致的系统端口和Git端口不一致。提供了解决方案，包括查看并设置git的代理端口，以及如何在不挂梯子时调整或清除代理设置。

先试试你能直接访问 [GitHub: Let’s build from here · GitHub](https://github.com/ "GitHub: Let’s build from here · GitHub") 吗？

你是直接就可以访问成功还是挂梯子之后访问成功的呢？

### 一、如果是在挂着梯子的情况下拉取或者推送代码的时候是否遇到了报错？

> fatal: unable to access 'https://github.com/xxx/\*\*\*\*\*\*.git/': Failed to connect to github.com port 443 after 21090 ms: Couldn't connect to server

一般出现这种问题都是开过 [VPN](https://so.csdn.net/so/search?q=VPN&spm=1001.2101.3001.7020) 导致的本机系统端口号和git的端口号不一致导致的。

解决办法：

1.查看本机系统端口号：

> 设置->网络和Internet->代理

![](https://i-blog.csdnimg.cn/blog_migrate/edfde9b94f1a9d05ee2329ecf6b1b888.png)

2.设置git端口号和上面的端口号保持一致（我的是10809）：

> git config --global http.proxy 127.0.0.1:10809
> 
> git config --global https.proxy 127.0.0.1:10809

3.查看git设置（可以省略）：

> PS D:\\demo> git config --global -l
> 
>   
> user.email=xxx@qq.com  
> user.name=xxx  
> http.proxy=127.0.0.1:10809  
> https.proxy=127.0.0.1:10809

4.再次 push 或者 pull 即可（保险起见可以先在cmd窗口中使用 ipconfig/flushdns 刷新dns缓存）。

### 二、如果没有挂着梯子但是还是遇到了以上报错

还是一样的原因，两边端口不一致导致的，那么直接去掉git代理即可：

> git config --global --unset http.proxy
> 
> git config --global --unset https.proxy

再次push 或者 pull 即可（保险起见可以先在cmd窗口中使用 ipconfig/flushdns 刷新dns缓存）。

![](https://kunyu.csdn.net/1.png?p=58&adBlockFlag=1&adId=1079659&a=1079659&c=3646750&k=%E8%A7%A3%E5%86%B3%E4%BD%BF%E7%94%A8git%E6%97%B6%E9%81%87%E5%88%B0Failed%20to%20connect%20to%20github.com%20port%20443%20after%2021090%20ms:%20Couldn%E2%80%98t%20connect%20to%20server&spm=1001.2101.3001.5002&articleId=134285451&d=1&t=3&u=4ee077ea70014f818e4f8c02b74410c9)[fatal*:* unable *to* access ‘https*:*// *github**.**com* /xxx*.**git* /‘ OpenSSL SSL\_ *connect**:* SSL\_ERROR\_SYSCALL *解决* 方案](https://catcoder.blog.csdn.net/article/details/139750939)

[

热门推荐

](https://catcoder.blog.csdn.net/article/details/139750939)

[weixin\_43178406的博客](https://blog.csdn.net/weixin_43178406)

06-17 23万+ [本文主要介绍了fatal*:* unable *to* access ‘https*:*// *github**.**com* /xxx*.**git* /’*:* OpenSSL SSL\_ *connect**:* SSL\_ERROR\_SYSCALL in *connect* ion *to* *github**.**com**:**443* *解决* 方案，希望能对 *使用* *git* 的同学们有所帮助。 文章目录 1*.* 问题描述 2*.**解决* 方案](https://catcoder.blog.csdn.net/article/details/139750939)

61 条评论

[ImDebuging](https://blog.csdn.net/Bite_belief) 热评

NB，解决了！

写评论[【已 *解决* 】 *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* 2078 *ms**:**Couldn* ‘t *connect* *to* *server*](https://javapub.blog.csdn.net/article/details/144324013)

[JavaPub](https://blog.csdn.net/qq_40374604)

12-08 2839[【代码】【】 *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* 2078 *ms**:**Couldn't* *connect* *to* *server* 。](https://javapub.blog.csdn.net/article/details/144324013)[【 *Git* 】 *GitHub* 连接失败 *解决* 方案： *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* *21090* *ms**:**Couldn* ’t *connect* *to* se](https://blog.csdn.net/lph159/article/details/143783520)

[lph159的博客](https://blog.csdn.net/lph159)

11-14 4万+[*GitHub* 端口 *443* 连接失败的问题可能是由多种原因造成的，特别是在 VPN 环境下，代理设置和网络配置可能会干扰 *Git* 的正常连接。](https://blog.csdn.net/lph159/article/details/143783520)[*Failed* *to* *connect* *to* *github**.**com* *port* *443*](https://devpress.csdn.net/v1/article/detail/153631960)

[

最新发布

](https://devpress.csdn.net/v1/article/detail/153631960)

[金石软件](https://blog.csdn.net/Metal1)

10-20 1883[摘要：无法克隆 *GitHub* 仓库可能是网络连接、代理设置或防火墙问题导致。建议按以下步骤排查：1)检查基础网络能否访问 *GitHub* ；2)检查并配置或清除 *git* 代理设置；3)关闭防火墙/安全软件测试；4)更换DNS服务器；5)改用SSH协议克隆；6)确认 *GitHub* 服务状态。若仍无法 *解决* ，可能是网络环境限制，可尝试切换网络。](https://devpress.csdn.net/v1/article/detail/153631960)[超级 *解决* 方案 *使用* *git* *时* 遇到 *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* *21090* *ms**:**Couldn* ‘t *connect* *to* *server*](https://blog.csdn.net/weixin_47121832/article/details/135890628)

[而世之奇伟、瑰怪，非常之观，常在于险远，而人之所罕至焉，故非有志者不能至也！](https://blog.csdn.net/weixin_47121832)

01-28 1029[超级 *解决* 方案 *使用* *git* *时* 遇到 *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* *21090* *ms**:**Couldn* ‘t *connect* *to* *server*](https://blog.csdn.net/weixin_47121832/article/details/135890628)[*解决* *git* clone报错*:**Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* *21090* *ms**:* Could not *connect* *to* *server*](https://devpress.csdn.net/v1/article/detail/146601073)

[m0\_69688176的博客](https://blog.csdn.net/m0_69688176)

03-28 1914[想用 *git* 从网上拉一下练手项目，结果直接报错了，结果采用科学上网的方式还是不行，依旧报错，说是连接不到服务。](https://devpress.csdn.net/v1/article/detail/146601073)[*解决* *Git* 连接失败： *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* *21090* *ms**:**Couldn* ‘t *connect* *to* *server*](https://libin9ioak.blog.csdn.net/article/details/135168426)

[猫头虎技术团队：授渔优于赠鱼，兴趣引领智慧，探索之乐尤显珍贵。商务合作+：Libin9iOak ，万粉变现+：CSDNWF，猫头虎承诺每年免费为100名C站创作者做账号流量诊断服务！全网搜：猫头虎技术团队，点击文章底部名片或直接私信我一切皆可谈，快找虎哥！](https://blog.csdn.net/qq_44866828)

12-23 4766[在这篇技术博客中，我们将深入探讨如何 *解决* *Git* 在连接 *GitHub* *时* 遇到的“ *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* *21090* *ms**:**Couldn* ‘t *connect* *to* *server* ”错误。本文适合各级别读者，无论你是编程新手还是经验丰富的开发者，都能从中获益。通过SEO优化，本文包含关键词如 *Git*, *GitHub*, 端口 *443*, VPN, 代理设置等，旨在帮助更多遇到相同问题的朋友。问题场景 *解决* 方法重要命令 *使用* VPN *时* 调整 *Git* 代理设置。](https://libin9ioak.blog.csdn.net/article/details/135168426)[关于 *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after**.**.**.**ms**:**Couldn* ‘t *connect* *to* *server* 的 *解决* 办法](https://devpress.csdn.net/v1/article/detail/137457572)

[ProgramNovice的博客](https://blog.csdn.net/ProgramNovice)

04-08 1万+[关于 *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after**.**.**.**ms**:**Couldn* ‘t *connect* *to* *server* 的 *解决* 办法](https://devpress.csdn.net/v1/article/detail/137457572)[push代码的 *时* 候报错 *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* 21098 *ms**:* Could not *connect* *to* *server*](https://devpress.csdn.net/v1/article/detail/145884328)

[2301\_80197997的博客](https://blog.csdn.net/2301_80197997)

02-26 1637[在 *使用* *Git* 与 *GitHub* 交互 *时* ，遇到这样的错误信息：“ *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* *21090* *ms**:**Couldn* ‘t *connect* *to* *server* ”。这通常发生在 *使用* VPN后，系统端口号与 *Git* 端口号不一致 *时* 。](https://devpress.csdn.net/v1/article/detail/145884328)[【 *git* 实战】 *github* 上克隆代码报错 *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* xxx *ms**:**Couldn* ’t *connect* *to* serve](https://blog.csdn.net/weixin_42206314/article/details/141951016)

[weixin\_42206314的博客](https://blog.csdn.net/weixin_42206314)

09-06 1171[今日本想进入自己的 *github* 下载自己的一个项目，结果报错，告诉我连接到 *github**.**com* 的 *443* 端口号失败，无法连接服务器。 *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* 21076 *ms**:**Couldn't* *connect* *to* *server*](https://blog.csdn.net/weixin_42206314/article/details/141951016)[73、 *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* 1 *ms**:**Couldn* ‘t *connect* *to* *server*](https://blog.csdn.net/FDoubleman/article/details/144500471)

[FDoubleman的博客](https://blog.csdn.net/FDoubleman)

12-16 612[正常项目开发过程中， *使用* *git* *com* mit代码后，准备push 代码到 *github* 上面。发现了问题原因 ，代理端口不匹配导致。获取对应的地址：127*.*0*.*0*.*1。通过一番问题分析（google）之后输入用户名 和密码。](https://blog.csdn.net/FDoubleman/article/details/144500471)[*git* clone报错： *connect* *to* *github**.**com* *port* *443* *after* 21088 *ms**:**Couldn* ‘t *connect* *to* *server*](https://blog.csdn.net/ruoxuer/article/details/135723034)

[ruoxuer的博客](https://blog.csdn.net/ruoxuer)

01-20 2111[*git* clone不了任何地址，报错： *connect* *to* *github**.**com* *port* *443* *after* 21088 *ms**:**Couldn't* *connect* *to* *server*](https://blog.csdn.net/ruoxuer/article/details/135723034)[*Git* 拉取 *GitHub* 项目，报错： *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* *21090* *ms**:**Couldn* ‘t *connect* *to* serve](https://devpress.csdn.net/v1/article/detail/135881590)

[Greenhand\_BN的博客](https://blog.csdn.net/Greenhand_BN)

01-27 1785[*Git* 拉取 *GitHub* 项目 *时* ，无反应，一段 *时* 间后报错： *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* *21090* *ms**:**Couldn* ‘t *connect* *to* *server* 。(Windows) 打开。](https://devpress.csdn.net/v1/article/detail/135881590)[*解决* *Git* 连接 *github* 失败 *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* *21090* *ms**:**Couldn* ‘t *connect* *to* *server*](https://devpress.csdn.net/v1/article/detail/141827834)

[skvjw的博客](https://blog.csdn.net/skvjw)

09-02 1795[*git* config --global https*.*proxy 127*.*0*.*0*.*1*:*<你的端口号> *git* config --global http*.*proxy 127*.*0*.*0*.*1*:*<你的端口号>*:* 打开“设置 -> 网络和Internet -> 代理”，记录下当前的端口号。最后一步，关闭Pycharm重新打开 就可以了。检查输出，确认代理设置已正确配置。在打开VPN的前提下去查看端口，我的端口号是10809，所以就是。接下来，在 *Git* 命令行种输入。我是因为连接VPN导致的。](https://devpress.csdn.net/v1/article/detail/141827834)[【debug】 *Failed* *to* *connect* *to* *github**.**com* *port* *443*](https://devpress.csdn.net/v1/article/detail/131510141)

[gsgs1234的博客](https://blog.csdn.net/gsgs1234)

07-03 1910[debug*:**Failed* *to* *connect* *to* *github**.**com* *port* *443*](https://devpress.csdn.net/v1/article/detail/131510141)[*Git* - *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* *21090* *ms**:**Couldn* ‘t *connect* *to* *server* *解决*](https://devpress.csdn.net/v1/article/detail/140347915)

[c\_h\_q\_的博客](https://blog.csdn.net/c_h_q_)

07-11 1554[*Git* - *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* *21090* *ms**:**Couldn* ‘t *connect* *to* *server* *解决*](https://devpress.csdn.net/v1/article/detail/140347915)[*Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* 21129 *ms**:**Couldn* ‘t *connect* *to* *server*](https://blog.csdn.net/2201_75475077/article/details/136244981)

[2201\_75475077的博客](https://blog.csdn.net/2201_75475077)

02-22 1498[2*.*产生原因：一般是这是因为服务器的SSL证书没有经过第三方机构的签署，所以才报错。1*.*关闭代理，并且在终端设置。](https://blog.csdn.net/2201_75475077/article/details/136244981)[*Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* *21090* *ms**:**Couldn* ‘t *connect* *to* *server*](https://devpress.csdn.net/v1/article/detail/130933642)

[xieeryihe的博客](https://blog.csdn.net/xieeryihe)

05-29 751[*github* push 出错](https://devpress.csdn.net/v1/article/detail/130933642)[mac 电脑 *Git* clone 出现 *Failed* *to* *connect* *to* *github**.**com* *port* *443* *after* 75007 *ms**:**Couldn* ‘t *connect* *to* *server* 问题 *解决*](https://wenku.csdn.net/answer/3zjuq7tx4k)

07-29[fatal*:* unable *to* access 'https*:*// *github**.**com* /*.**.**.*'*:**Failed* *to* *connect* *to* *github**.**com* *port* *443**:**Connect* ion timed out \`\`\` 该错误通常表示 *Git* 无法通过 HTTPS 协议访问 *GitHub* 服务器。造成这一问题的原因可能*.**.**.*](https://wenku.csdn.net/answer/3zjuq7tx4k)

实付 元

[使用余额支付](https://blog.csdn.net/qq_40296909/article/details/)

点击重新获取

扫码支付

钱包余额 0

抵扣说明：

1.余额是钱包充值的虚拟货币，按照1:1的比例进行支付金额的抵扣。  
2.余额无法直接购买下载，可以购买VIP、付费专栏及课程。

[余额充值](https://i.csdn.net/#/wallet/balance/recharge)

举报

[![](https://i-operation.csdnimg.cn/images/df6c67fa661c48eba86beaeb64350df0.gif)](https://mall.csdn.net/vip?utm_source=25618_vip_blogrighticon) [![](https://csdnimg.cn/release/blogv2/dist/pc/img/toolbar/Group.png) 点击体验  
DeepSeekR1满血版](https://ai.csdn.net/chat?utm_source=cknow_pc_blogdetail&spm=1001.2101.3001.10583) 隐藏侧栏 ![程序员都在用的中文IT技术交流社区](https://g.csdnimg.cn/side-toolbar/3.6/images/qr_app.png)

程序员都在用的中文IT技术交流社区

![专业的中文 IT 技术社区，与千万技术人共成长](https://g.csdnimg.cn/side-toolbar/3.6/images/qr_wechat.png)

专业的中文 IT 技术社区，与千万技术人共成长

![关注【CSDN】视频号，行业资讯、技术分享精彩不断，直播好礼送不停！](https://g.csdnimg.cn/side-toolbar/3.6/images/qr_video.png)

关注【CSDN】视频号，行业资讯、技术分享精彩不断，直播好礼送不停！

客服 返回顶部

💬 📋 🗑️

![](https://i-blog.csdnimg.cn/blog_migrate/edfde9b94f1a9d05ee2329ecf6b1b888.png)