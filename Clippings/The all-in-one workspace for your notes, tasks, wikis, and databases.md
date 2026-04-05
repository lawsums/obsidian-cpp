---
title: "The all-in-one workspace for your notes, tasks, wikis, and databases."
source: "https://www.notion.so/13-C-IP-31f2e42f32a0804b9b19d323ba09dc7d#31f2e42f32a08042aa69c7b8879929d4"
author:
  - "[[Notion]]"
published:
created: 2026-04-05
description: "A tool that connects everyday work into one space. It gives you and your teams AI tools—search, writing, note-taking—inside an all-in-one, flexible workspace."
tags:
  - "clippings"
---
![🇺🇸 页面图标](https://notion-emojis.s3-us-west-2.amazonaws.com/prod/svg-twitter/1f1fa-1f1f8.svg)

## 0.1 13-C 如何购买美国静态住宅IP及应对风控教程

建议有谷歌Gemini Pro账号的同学认真看下，无论是否购买静态住宅IP，你可以参考下本文！

## 0.2 目录

## 0.3 一、 什么是美国静态住宅 IP 及其必要性

普通机场 IP 的风险（万人共用、风控值高）

AI 平台（ChatGPT/Claude）对 IP 的严苛要求

风控导致的后果（人机验证、封号、拒绝访问）

## 0.4 二、 购买美国静态住宅 IP 的避坑指南

2.1 陷阱一：带宽限速问题（多数仅 10-20M）

2.2 陷阱二：以机房 IP 冒充纯住宅 IP

## 0.5 三、 购买渠道与操作流程

3.1 购买渠道（电报与 QQ 联系方式）

3.2 购买流程：告知推荐人、城市选择（首选加州）

3.3 付款建议：支付宝按月支付，防止跑路

3.4 售后检测： [ping0.cc](https://ping0.cc/ip/) 、 [ipjiance](https://www.ipjiance.com/) 及 [scamalytics](https://scamalytics.com/) 欺诈值检测

## 0.6 四、 实操教程：如何使用美国静态住宅 IP

4.1 链式代理（套娃）原理：机场快节点 + 住宅 IP

4.2 软件推荐： [Clash Mi 使用教程](https://www.notion.so/13-A-Clash-Mi-for-Windows-30a2e42f32a080aa94d1c83b3ce1f095?pvs=21)

4.3 Yaml 配置文件修改详解：修改订阅、IP、端口、账号、密码五个地方

## 0.7 五、 应对 IP 风控值升高的策略

风控值升高的原因分析（多人并发、多设备登录等）

日常使用建议：专用浏览器、风控值超 50% 建议换 IP

## 0.8 六、 最佳解决方案：Yaml 文件分组选择

分流设置：仅 AI 分组走住宅 IP，其他（如 YouTube）走普通节点

此方案的潜在风险与操作建议

## 0.9 一、什么是美国静态住宅 IP 及其必要性

#### 0.9.1.1 通常来说，你购买的机场给你分配美国节点IP，有上万人同时使用，见下图，

你也可以自己去这里检测： [ping0.cc](https://ping0.cc/)

#### 0.9.1.2 https://ping0.cc/

![](https://www.notion.so/image/attachment%3A6cb4415f-4855-4b1c-9c02-055dbcef1568%3Aimage.png?table=block&id=31f2e42f-32a0-800f-a619-fd9116f9ed3c&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3A0fc7050e-5dce-459b-ad8a-cf4764fad611%3Aimage.png?table=block&id=3222e42f-32a0-803c-bf17-ef518bf988af&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2)

### 0.9.2 这种IP使用起来有风险：

### 0.9.3 目前全球各大 AI 平台，拥有着互联网上最严苛的 IP 风控系统。IP风控值高，你就会发现：

#### 0.9.3.1 AI网页登录时反复要求点击“证明你是人类”（红绿灯、Bus、台阶，消防水栓等）。

#### 0.9.3.2 对话中途网络断开，或者提示“Something went wrong”。

#### 0.9.3.3 ChatGPT 会频繁弹人机验证；

#### 0.9.3.4 极易导致 Claude 封号（见下图，我的一个号之前被封了）；

#### 0.9.3.5 若显示为“IDC 机房 IP”，几乎无法登录 ChatGPT 网页版（提示 Access Denied）；

……

![](https://www.notion.so/image/attachment%3A1ce4f295-4bec-4940-95ce-524d49bc3162%3Aimage.png?table=block&id=3202e42f-32a0-802a-9b2b-ce9bfabdbc2c&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2)

#### 0.9.3.6 为什么 AI 平台对 IP 要求极高？

#### 0.9.3.7 算力成本与防滥用： 大语言模型每一次生成对话都需要消耗极其昂贵的 GPU 算力。为了防止黑客使用机器批量注册账号、恶意白嫖 API 算力（即所谓的“刷接口”），AI 公司会接入顶级的网络防御系统（例如 ChatGPT 和 Claude 深度依赖 Cloudflare 的企业级风控体系）。

#### 0.9.3.8 区域合规性： 由于法律法规，这些 AI 服务未向全球所有地区开放。因此，它们必须精准识别用户的真实物理位置，而不仅仅是代理服务器的位置。

#### 0.9.3.9 “连坐”机制： 如果风控系统发现某个 IP 地址（例如一个共享代理节点）上，有哪怕一个用户在进行恶意注册或高频爬虫抓取，系统会立刻将该 IP 标记为“高危”，导致同一 IP 下的所有正常用户受到牵连，轻则频繁要求验证真人（拼图、选红绿灯），重则直接封禁账号。

## 0.10 二、 购买美国静态住宅 IP 的避坑指南

## 0.11 第一个坑：买的美国静态住宅IP限速

#### 0.11.1.1 你在油管上能找到的售卖美国静态住宅IP的，基本上都很恶心，不会跟你讲其带宽，都说IP地址如何纯净。我买过3个都是如此，这个就是坑！但是其实最大的坑就是这些住宅IP的带宽就是5M、10M、15M、20M。绝大多数的都是10M，也就是说，如果你家的宽带如果和我一样是1000M中国电信，你使用这个静态住宅IP后，你访问外网的速度只有10M，当然我测试过，有时候可以上到25-32M，但是还是很慢。当然，你访问网页或者使用AI问题应该不大，因为你在学校的wifi，我测试过，其实也就50M-90M，所以如果静态住宅IP能用，20M也够你查阅科研资料和使用AI了。

例如，我购买了下面的985IP、Cliproxy、还有Miya，就985好些，能到32M，其它都是10-18M左右。（这些你在YouTube或者Google上一搜就有相关视频和网址了）

![](https://www.notion.so/image/attachment%3A1053da91-3b96-4f3c-a53d-f94788327961%3Aimage.png?table=block&id=31f2e42f-32a0-80a3-b5f7-e9d6522578bc&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2)

## 0.12 第二个坑：卖家给的IP有些不是纯住宅IP，是机房IP，例如下图：

![](https://www.notion.so/image/attachment%3Afa78100a-633a-4e4e-873f-5714a41e3cb8%3Aimage.png?table=block&id=31f2e42f-32a0-8080-885e-f69c2cf667e2&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2)

#### 0.12.1.1 所以如果大家要购买静态住宅IP，可以尝试多人一起购买，6美元找5-6个人合买，也可以不超过10人购买，一个人一个月才几元钱。还是比较合算的。

![](https://www.notion.so/image/attachment%3A20064d90-9d2e-43e9-a0dc-5f4605eda4cf%3Aimage.png?table=block&id=31f2e42f-32a0-8005-b082-e58188c1ac24&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2)

## 0.13 三、 购买渠道与操作流程

### 0.13.1 如果你想团购，又凑不齐人，可联系我，我这里凑够5-7人，开团后，你们自己联系！

## 0.14 3\. 1. 去哪买？两种联系方式：电报+QQ

#### 0.14.1.1 当然，你如果对网速要求很高，和我一样，我是自己偶然找到的一个人，他提供的静态住宅IP可以跑满带宽，也就是你机场的出口带宽是1000M，那么你使用静态住宅IP的带宽就是1000M，反正很牛，但是要贵一点，好处是快。我是和我几个同学一起合买的。但是我不确定他会不会跑路，所以我都是按月充值的。

### 0.14.2 联系方式1：如果你有电报，直接电报联系他：

![](https://www.notion.so/image/attachment%3A29ade0b9-3cc5-4d25-a30b-0eb9ee6d2d1d%3Aimage.png?table=block&id=31f2e42f-32a0-80a7-99d7-c2091ce4ce91&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2)

### 0.14.3 联系方式2：直接联系他QQ：2096549014

![](https://www.notion.so/image/attachment%3A1b86b7eb-bc3d-4eb7-b028-d4749abc92db%3Aimage.png?table=block&id=31f2e42f-32a0-8056-a99b-d0b3b6615d35&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2)

## 0.15 怎么买？怎么付款？买的时候注意什么？

### 0.15.1 怎么买？

#### 0.15.1.1 电报或者QQ联系后，告知是同学推荐过来的，不要说团购，就说买一个美国静态住宅IP，对方会问你要哪个城市的，一般都买加州的，西海岸，离中国近，除非你有特殊要求（例如纽约）。

### 0.15.2 付款的话，对方会给支付宝二维码，你直接付款即可。

#### 0.15.2.1 按月购买，不要多买，防止对方跑路！

价格一般都是6美元一个，人民币就是42元。

![](https://www.notion.so/image/attachment%3Adcb5011b-10c6-46fc-a4ec-1294741c269d%3Aimage.png?table=block&id=31f2e42f-32a0-8057-a992-e023de6fb114&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=580&userId=&cache=v2)

### 0.15.3 买了IP之后要注意什么？怎么检测

### 0.15.4 通常，你如果购买的静态住宅IP，你通常会得到这样的一串信息：

### 0.15.5 分别是：IP地址：端口号：账号：密码

![](https://www.notion.so/image/attachment%3Acf8652fb-23fc-45b5-a2be-8acb68ecd863%3Aimage.png?table=block&id=31f2e42f-32a0-8081-839b-eba9170e0300&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2)

### 0.15.6 你需要复制最前面的IP地址去下面几个网站做检测，看是否是好的IP

### 0.15.7 第一个网址（最重要）：https://ping0.cc

这个是检测防风控制，IP地址类型以及共享人数

![](https://www.notion.so/image/attachment%3A59e23a76-82d4-4c47-8b2c-f029a246a69f%3Aimage.png?table=block&id=31f2e42f-32a0-80ef-a0ee-f8d71a4e8653&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2)

### 0.15.8 第二个网址（可做参考）：https://www.ipjiance.com/

![](https://www.notion.so/image/attachment%3Ad29c03a3-824e-4651-8551-27555ca022d5%3Aimage.png?table=block&id=31f2e42f-32a0-8092-8b74-e94a645fdc45&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=660&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3A411f1522-8ef6-4448-816a-72e0f81a53a2%3Aimage.png?table=block&id=31f2e42f-32a0-803d-9794-e931e7f28b8b&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=660&userId=&cache=v2)

### 0.15.9 第三个网址（欺诈值检测）：https://scamalytics.com/

检测值越低越好，0最完美。

![](https://www.notion.so/image/attachment%3Ad7c3c307-93e8-4a9b-98e7-a99d85a8caa7%3Aimage.png?table=block&id=31f2e42f-32a0-80fa-bd0b-c4122e7ae9cb&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2)

#### 0.15.9.1 做完三个检测如果都OK，这个IP就可以用了；如果哪一个不好，可以联系那个卖家老板更换，他人还不错，我找他都很热情的。

## 0.16 四、实操教程：如何使用美国静态住宅 IP

## 0.17 一句话：使用链式代理（我编写的yaml）+ Clash Mi (软件)

## 0.18 什么是链式代理？

### 0.18.1 换句话说，就是在你购买的梯子机场节点中，找一个最快的节点，通常是中国HK节点，将这个节点套上你购买的静态住宅IP，这就是链式代理。

![](https://www.notion.so/image/attachment%3A69f9de1e-bfef-4d00-89e4-a10b1d9fcb86%3Aimage.png?table=block&id=31f2e42f-32a0-8050-9cd5-cdbbe93222fa&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2)

### 0.18.2 链式代理其实就是套娃，在你购买的机场香港IP节点之上，套一个美国静态住宅IP，这个时候你就会以纯净的美国住宅IP访问这些对IP地址要求比较高的网址了。

### 0.18.3 所以静态住宅的带宽决定了你访问这些AI或者网址的网速。所以还是要买推荐的这家不限速的美国静态住宅IP。

## 0.19 使用什么软件来做这个链式代理呢？

### 0.19.1 推荐使用最新的科学上网软件Clash Mi.

![](https://www.notion.so/image/attachment%3A8f47d070-cdf6-44cb-be61-6ab7d8ae18b3%3Aimage.png?table=block&id=31f2e42f-32a0-8073-b349-de004fbc3fed&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=480&userId=&cache=v2)

#### 0.19.1.1 如何安装使用Clash Mi，请参考这篇文章，

#### 0.19.1.2 https://www.notion.so/13-A-Clash-Mi-for-Windows-30a2e42f32a080aa94d1c83b3ce1f095

#### 0.19.1.3 或者见班级QQ群的PDF文件：13-A Clash Mi for Windows使用教程 \_ Notion.pdf

![](https://www.notion.so/image/attachment%3Adfd398dc-014f-4d08-b43a-da849982a6d5%3Aimage.png?table=block&id=31f2e42f-32a0-80d9-bc40-c2c05935a73f&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2)

## 0.20 使用我给你们编写好的yaml文件

## 0.21 我自己使用AI编辑好了一个yaml文件（因为QQ群不给发敏感内容，所以大家需要的话直接QQ留言给我，找我要编辑好的文件，回去你自己修改），你通过Visual Studio Code软件编辑这个yaml文件，就把你购买的静态住宅IP地址信息和你机场的订阅地址填进去，然后保存。根据上面的那个教程文章，将这个yaml文件导入Clash Mi，然后在分组中选择好相应的节点即可。

![](https://www.notion.so/image/attachment%3A5a1a78d2-43ba-4ecf-af66-7390387e9bb7%3Aimage.png?table=block&id=31f2e42f-32a0-8045-9a07-c809d8ca4931&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2)

## 0.22 如何使用VSC编辑我给你们的yaml文件中的静态住宅IP信息和机场订阅地址？

### 0.22.1 通常，你如果购买的静态住宅IP，你通常会得到这样的一串信息：

### 0.22.2 分别是：IP地址：端口号：账号：密码

![](https://www.notion.so/image/attachment%3A195f46c9-95a0-46db-bbe5-a6a171b36a12%3Aimage.png?table=block&id=31f2e42f-32a0-8033-9fdf-fc8d309a2c65&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2)

### 0.22.3 你只要把我给你们的这个yaml文件用VSC软件打开后编辑下：

### 0.22.4 你需要修改5个地方（见下图）：

#### 0.22.4.1 1\. 最上面的是填入你自己的机场订阅地址，通常选Clash那个，或者你机场的通用订阅地址

#### 0.22.4.2 2\. IP 地址

#### 0.22.4.3 3\. 端口号

#### 0.22.4.4 4\. 账号

#### 0.22.4.5 5\. 密码

![](https://www.notion.so/image/attachment%3Aec1fd2f0-c1b3-4ca5-b88b-601ad21598ce%3Aimage.png?table=block&id=31f2e42f-32a0-809e-9ae8-d61187063bbf&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2)

填好这些之后，要在VSC软件中选择File，然后保存

![](https://www.notion.so/image/attachment%3A7341f6e5-20b2-429f-b84c-1b25c1789c14%3Aimage.png?table=block&id=31f2e42f-32a0-808b-8eb0-cc85f5d423da&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1150&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3A7e1b4e69-d01f-4d0f-ab73-02c76d6243db%3Aimage.png?table=block&id=31f2e42f-32a0-80bd-b7ad-c1c525ea96cd&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=660&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3A33860d74-cfce-495e-8fae-7cbd079427de%3Aimage.png?table=block&id=31f2e42f-32a0-80fd-b214-e561c14514a1&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=660&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3Ac3197216-b06e-43fb-a231-6a7c9dcc23bf%3Aimage.png?table=block&id=31f2e42f-32a0-80e1-88de-d654477150f3&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3A816546bd-22af-4cab-a0fe-ce7db327679b%3Aimage.png?table=block&id=31f2e42f-32a0-800b-9348-cad185f2ad77&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3Ab57e859b-e3d1-4070-8038-08ada0288ec2%3Aimage.png?table=block&id=31f2e42f-32a0-80c8-b749-e0fa5a985f9f&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3A4b23cc70-220e-4eb6-8eeb-a23e49a1656b%3Aimage.png?table=block&id=31f2e42f-32a0-8096-9db6-c41ae802329c&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3Ae51e2f91-08c5-4f40-ad56-7e567f5062cf%3Aimage.png?table=block&id=31f2e42f-32a0-80a8-9869-d68834ca4fc8&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3Ae7be4a28-4629-4f63-8c3e-8552f5583fe6%3Aimage.png?table=block&id=31f2e42f-32a0-801a-b80c-efedac2dd20c&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3A4ca5ba48-e0fa-4a22-8650-2c32f8f5fd06%3Aimage.png?table=block&id=31f2e42f-32a0-8076-b2ac-f1ef4aa7ed7d&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3A5007f6c2-77a6-4429-96ac-cfaaafd3ed6c%3Aimage.png?table=block&id=31f2e42f-32a0-8005-9a09-ecb04fe4549a&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3A6539e413-9cd4-4877-be54-06522da397be%3Aimage.png?table=block&id=31f2e42f-32a0-80ca-858d-ed762d257621&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3Af449d0ef-fd86-4e0c-a143-7f0769062d2a%3Aimage.png?table=block&id=31f2e42f-32a0-8002-9386-c9d3bece6442&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3A55e4e026-447d-4969-ab90-8cb90a40f72d%3Aimage.png?table=block&id=31f2e42f-32a0-8002-9f3d-f7835f9bdbf8&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3A2a666131-7e31-422b-84ec-0c5bcab2ab69%3Aimage.png?table=block&id=31f2e42f-32a0-8078-b4c4-fbc007c10ac1&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3A17b9c0d2-a7cc-43df-a7ad-cf531b31f653%3Aimage.png?table=block&id=31f2e42f-32a0-8032-b992-d436869dfa00&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3Adeac328a-cd22-41a2-ad78-0b2004aa069d%3Aimage.png?table=block&id=31f2e42f-32a0-8031-9f16-ca362275f314&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3Abce2df42-7c59-4021-a863-460d6c009099%3Aimage.png?table=block&id=31f2e42f-32a0-8077-8f51-f4f386e18005&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3A3c07d36a-3eae-4b6c-8e26-40fd052abb94%3Aimage.png?table=block&id=31f2e42f-32a0-8020-8c52-e31340e95f78&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1270&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3A49765e7d-ba7e-4cd5-9a24-02dba6ba630e%3Aimage.png?table=block&id=31f2e42f-32a0-809a-94e9-d1dc24b35163&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3A593e2ed8-5e71-4531-b1d6-6308a67f696c%3Aimage.png?table=block&id=31f2e42f-32a0-80d5-b2c0-eb6623b1716e&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2) ![](https://www.notion.so/image/attachment%3A9212e7a5-4867-4be9-98be-cf0c8d565eff%3Aimage.png?table=block&id=31f2e42f-32a0-8010-9b21-c49770c67e0a&spaceId=a602e42f-32a0-8148-b6c7-0003460a981c&width=1420&userId=&cache=v2)