[[diffusion除图像修复相关论文]]

# 1 🤗 Diffusers 简介

![[Attachments/diffusion-00-diffusers-library.jpg]]

在这个 Notebook 中，你将训练你的第一个扩散模型，用来**生成可爱蝴蝶 🦋 的图片**。在此过程中，你会了解 🤗 Diffusers 库的核心组件，这将为后面课程中更高级的应用打下良好的基础。

让我们开始吧！

## 1.1 你将学到什么

在这个 Notebook 中，你将：

- 看到一个强大的自定义扩散模型 pipeline 的实际运行效果（并了解如何制作你自己的版本）
- 通过以下步骤创建你自己的迷你 pipeline：
    - 回顾扩散模型背后的核心思想
    - 从 Hub 加载训练数据
    - 探索如何用 scheduler 给数据添加噪声
    - 创建并训练 UNet 模型
    - 把各个部分组合成一个可运行的 pipeline
- 编辑并运行一个用于初始化较长训练的脚本，它会处理：
    - 通过 🤗 Accelerate 进行多 GPU 训练
    - 实验日志记录，以跟踪关键指标
    - 将最终模型上传到 Hugging Face Hub

❓如果你有任何问题，请在 Hugging Face Discord 服务器的 `#diffusion-models-class` 频道发帖提问。如果你还没有注册，可以在这里注册：[https://huggingface.co/join/discord](https://huggingface.co/join/discord)

## 1.2 前置要求

在深入研究这个 Notebook 之前，你应该：

- 📖 阅读第 1 单元的材料
- 🤗 在 Hugging Face Hub 上创建一个账号。如果你还没有创建，可以在这里注册：[https://huggingface.co/join](https://huggingface.co/join)

## 1.3 第 1 步：环境配置

运行下面的单元格来安装 diffusers 库以及一些其他依赖：

```bash
%pip install -qq -U diffusers datasets transformers accelerate ftfy pyarrow==9.0.0
```

接下来，前往 [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)，如果你还没有访问令牌（access token），就创建一个具有写权限的令牌：

![[Attachments/diffusion-01-hf-token-settings.png]]

你可以用命令行（`huggingface-cli login`）登录，也可以运行下面的单元格：

```python
from huggingface_hub import notebook_login

notebook_login()
```

```text
Login successful
Your token has been saved to /root/.huggingface/token
```

然后你需要安装 Git-LFS，用于上传模型检查点（checkpoint）：

```python
%%capture
!sudo apt -qq install git-lfs
!git config --global credential.helper store
```

最后，导入我们将要用到的库，并定义几个后面会用到的便捷函数：

```python
import numpy as np
import torch
import torch.nn.functional as F
from matplotlib import pyplot as plt
from PIL import Image


def show_images(x):
    """给定一批图像 x，生成一个网格并转换为 PIL 格式"""
    x = x * 0.5 + 0.5  # 从 (-1, 1) 映射回 (0, 1)
    grid = torchvision.utils.make_grid(x)
    grid_im = grid.detach().cpu().permute(1, 2, 0).clip(0, 1) * 255
    grid_im = Image.fromarray(np.array(grid_im).astype(np.uint8))
    return grid_im


def make_grid(images, size=64):
    """给定一组 PIL 图像，把它们横向拼成一行，方便查看"""
    output_im = Image.new("RGB", (size * len(images), size))
    for i, im in enumerate(images):
        output_im.paste(im.resize((size, size)), (i * size, 0))
    return output_im


# Mac 用户可能需要改成 device = 'mps'（未测试）
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
```

好了，一切就绪！

## 1.4 Dreambooth：未来的功能抢先看

如果你在过去几个月里关注过任何与 AI 相关的社交媒体，那你一定听说过 Stable Diffusion。它是一个强大的、以文本为条件的潜在扩散模型（别担心，我们会搞清楚这都是什么意思）。但它有一个缺陷：除非你足够出名、照片在网上随处可见，否则它并不知道你或我长什么样。

Dreambooth 让我们可以创建自己的模型变体，让它额外掌握某个特定人脸、物体或风格的知识。Corridor Crew 制作了一个很棒的[视频](https://www.youtube.com/watch?v=W4Mcuh38wyM)，用它来讲述角色形象一致的故事，是展示这项技术能力的一个绝佳例子：

```python
from IPython.display import YouTubeVideo

YouTubeVideo("W4Mcuh38wyM")
```

下面是一个例子，用的是在一款流行儿童玩具「土豆先生」（Mr Potato Head）的 5 张照片上训练的[一个模型](https://huggingface.co/sd-dreambooth-library/mr-potato-head)。

首先，我们加载 pipeline。这会从 Hub 下载模型权重等文件。由于为了一个一行的演示就要下载好几 GB 的数据，你完全可以跳过这个单元格，直接欣赏示例输出就好！

```python
from diffusers import StableDiffusionPipeline

# 在 https://huggingface.co/sd-dreambooth-library 可以找到大量社区贡献的模型
model_id = "sd-dreambooth-library/mr-potato-head"

# 加载 pipeline
pipe = StableDiffusionPipeline.from_pretrained(model_id, torch_dtype=torch.float16).to(
    device
)
```

```text
Fetching 15 files:   0%|          | 0/15 [00:00<?, ?it/s]
```

pipeline 加载完成后，我们就可以这样生成图像：

```python
prompt = "an abstract oil painting of sks mr potato head by picasso"
image = pipe(prompt, num_inference_steps=50, guidance_scale=7.5).images[0]
image
```

![[Attachments/diffusion-02-dreambooth-mr-potato-head.png]]

**练习：** 用不同的 prompt 自己试一试。`sks` 这个 token 在这里代表新概念的唯一标识符——如果不写它会怎样？你还可以试试改变采样步数（最少能降到多少？）以及 `guidance_scale`（它决定模型在多大程度上贴合 prompt）。

那个神奇的 pipeline 内部做了很多事情！到课程结束时你就会明白它是如何运作的了。现在，我们先来看看如何从零开始训练一个扩散模型。

## 1.5 MVP（最小可用 Pipeline）

🤗 Diffusers 的核心 API 分为三大组件：

1. **Pipelines（管线）**：高层类，旨在以对用户友好的方式，快速用流行的预训练扩散模型生成样本。
2. **Models（模型）**：用于训练新扩散模型的常见架构，例如 [UNet](https://arxiv.org/abs/1505.04597)。
3. **Schedulers（调度器）**：在*推理*时从噪声生成图像、以及在*训练*时生成带噪图像所用的各种技术。

Pipelines 对终端用户很友好，但既然你来上这门课，我们假设你想知道底层到底发生了什么！所以在这个 Notebook 剩下的部分，我们将构建自己的 pipeline，用来生成小尺寸的蝴蝶图片。下面是它的最终运行效果：

```python
from diffusers import DDPMPipeline

# 加载蝴蝶 pipeline
butterfly_pipeline = DDPMPipeline.from_pretrained(
    "johnowhitaker/ddpm-butterflies-32px"
).to(device)

# 生成 8 张图片
images = butterfly_pipeline(batch_size=8).images

# 查看结果
make_grid(images)
```

```text
Fetching 4 files:   0%|          | 0/4 [00:00<?, ?it/s]
  0%|          | 0/1000 [00:00<?, ?it/s]
```

![[Attachments/diffusion-03-butterflies-32px.png]]

也许没有 DreamBooth 的例子那么惊艳，但要知道我们是从零开始训练，而且只用了训练 Stable Diffusion 所用数据量的约 0.0001%。说到训练，回忆一下本单元介绍里提到的，训练扩散模型大致是这样的：

1. 从训练数据中加载一些图像
2. 按不同的量添加噪声
3. 把输入的带噪版本喂给模型
4. 评估模型对这些输入的去噪效果
5. 利用这些信息更新模型权重，然后重复

接下来的几节我们会逐步探索这些步骤，直到搭出一个完整的训练循环，然后我们会研究如何从训练好的模型中采样，以及如何把所有东西打包成一个便于分享的 pipeline。让我们从数据开始……

## 1.6 第 2 步：下载训练数据集

在这个例子中，我们将使用 Hugging Face Hub 上的一个图像数据集。具体来说是[这个包含 1000 张蝴蝶图片的集合](https://huggingface.co/datasets/huggan/smithsonian_butterflies_subset)。这是一个非常小的数据集，因此我们也提供了一些更大数据集的注释代码行。如果你想用自己的图像集合，也可以用注释掉的代码示例，改为从文件夹中加载图片。

```python
import torchvision
from datasets import load_dataset
from torchvision import transforms


dataset = load_dataset("huggan/smithsonian_butterflies_subset", split="train")

# 或者从本地文件夹加载图像
# dataset = load_dataset("imagefolder", data_dir="path/to/folder")

# 我们将在 32 像素的正方形图像上训练，你也可以试试更大的尺寸
image_size = 32
# 如果 GPU 显存不够，可以调小 batch size
batch_size = 64

# 定义数据增强
preprocess = transforms.Compose(
    [
        transforms.Resize((image_size, image_size)),  # 缩放
        transforms.RandomHorizontalFlip(),  # 随机水平翻转（数据增强）
        transforms.ToTensor(),  # 转换为张量 (0, 1)
        transforms.Normalize([0.5], [0.5]),  # 映射到 (-1, 1)
    ]
)


def transform(examples):
    images = [preprocess(image.convert("RGB")) for image in examples["image"]]
    return {"images": images}


dataset.set_transform(transform)

# 从数据集创建一个 dataloader，分批提供转换后的图像
train_dataloader = torch.utils.data.DataLoader(
    dataset, batch_size=batch_size, shuffle=True
)
```

```text
Using custom data configuration huggan--smithsonian_butterflies_subset-7665b1021a37404c
Found cached dataset parquet (/home/lewis_huggingface_co/.cache/huggingface/datasets/huggan___parquet/huggan--smithsonian_butterflies_subset-7665b1021a37404c/0.0.0/2a3b91fbd88a2c90d1dbbb32b460cf621d31bd5b05b934492fdef7d8d6f236ec)
```

我们可以取出一批图像并查看其中的一些，像这样：

```python
xb = next(iter(train_dataloader))["images"].to(device)[:8]
print("X shape:", xb.shape)
show_images(xb).resize((8 * 64, 64), resample=Image.NEAREST)
```

```text
X shape: torch.Size([8, 3, 32, 32])
/tmp/ipykernel_4278/3975082613.py:3: DeprecationWarning: NEAREST is deprecated and will be removed in Pillow 10 (2023-07-01). Use Resampling.NEAREST or Dither.NONE instead.
  show_images(xb).resize((8 * 64, 64), resample=Image.NEAREST)
```

![[Attachments/diffusion-04-training-data-batch.png]]

我们会坚持使用这个只有 32 像素图像的小数据集，以便在这个 Notebook 里把训练时间控制在可管理的范围内。

## 1.7 第 3 步：定义 Scheduler

我们的训练计划是：取这些输入图像，给它们加噪，然后把带噪图像喂给模型。而在推理时，我们会用模型的预测来迭代地去除噪声。在 `diffusers` 中，这两个过程都由 **scheduler** 处理。

噪声调度（noise schedule）决定了在不同时间步添加多少噪声。下面我们创建一个使用「DDPM」训练和采样默认设置的 scheduler（基于论文 ["Denoising Diffusion Probabilistic Models"](https://arxiv.org/abs/2006.11239)）：

```python
from diffusers import DDPMScheduler


noise_scheduler = DDPMScheduler(num_train_timesteps=1000)
```

DDPM 论文描述了一个加噪过程：每个「时间步」都加入少量噪声。给定某个时间步的 $x_{t-1}$，我们可以通过下式得到下一个（噪声略微更多的）版本 $x_t$：

$$
q(\mathbf{x}_t \vert \mathbf{x}_{t-1}) = \mathcal{N}(\mathbf{x}_t; \sqrt{1 - \beta_t} \mathbf{x}_{t-1}, \beta_t\mathbf{I}) \quad q(\mathbf{x}_{1:T} \vert \mathbf{x}_0) = \prod^T_{t=1} q(\mathbf{x}_t \vert \mathbf{x}_{t-1})
$$

也就是说，我们把 $x_{t-1}$ 乘以 $\sqrt{1 - \beta_t}$ 进行缩放，再加上按 $\beta_t$ 缩放的噪声。这个 $\beta$ 按照某种 schedule 对每个 t 定义，决定每个时间步加入多少噪声。不过，我们并不想为了得到 $x_{500}$ 而真的做 500 次这个操作，所以我们还有另一个公式，可以直接从 $x_0$ 得到任意 t 的 $x_t$：

$$
q(\mathbf{x}_t \vert \mathbf{x}_0) = \mathcal{N}(\mathbf{x}_t; \sqrt{\bar{\alpha}_t} \mathbf{x}_0, {(1 - \bar{\alpha}_t)} \mathbf{I})
$$

其中 $\bar{\alpha}_t = \prod_{i=1}^T \alpha_i$，$\alpha_i = 1-\beta_i$。

数学符号看起来总是很吓人！好在 scheduler 帮我们处理了这一切。我们可以画出 $\sqrt{\bar{\alpha}_t}$（标记为 `sqrt_alpha_prod`）和 $\sqrt{1 - \bar{\alpha}_t}$（标记为 `sqrt_one_minus_alpha_prod`），看看输入（x）和噪声在不同时间步下是如何被缩放和混合的：

```python
plt.plot(noise_scheduler.alphas_cumprod.cpu() ** 0.5, label=r"${\sqrt{\bar{\alpha}_t}}$")
plt.plot((1 - noise_scheduler.alphas_cumprod.cpu()) ** 0.5, label=r"$\sqrt{(1 - \bar{\alpha}_t)}$")
plt.legend(fontsize="x-large");
```

![[Attachments/diffusion-05-noise-schedule-plot.png]]

**练习：** 你可以通过换成下面注释掉的某个选项，来探索当 beta_start、beta_end 和 beta_schedule 取不同值时这张图会如何变化：

```python
# 噪声太少的一个：
# noise_scheduler = DDPMScheduler(num_train_timesteps=1000, beta_start=0.001, beta_end=0.004)

# 'cosine' schedule，对小尺寸图像可能更好：
# noise_scheduler = DDPMScheduler(num_train_timesteps=1000, beta_schedule='squaredcos_cap_v2')
```

无论你选哪个 scheduler，现在都可以用 `noise_scheduler.add_noise` 函数来按不同的量添加噪声，像这样：

```python
timesteps = torch.linspace(0, 999, 8).long().to(device)
noise = torch.randn_like(xb)
noisy_xb = noise_scheduler.add_noise(xb, noise, timesteps)
print("Noisy X shape", noisy_xb.shape)
show_images(noisy_xb).resize((8 * 64, 64), resample=Image.NEAREST)
```

```text
Noisy X shape torch.Size([8, 3, 32, 32])
```

![[Attachments/diffusion-06-noisy-images.png]]

同样，在这里可以探索不同噪声 schedule 和参数的效果。[这个视频](https://www.youtube.com/watch?v=fbLgFrlTnGU)更详细地讲解了上面的一些数学内容，是了解这些概念的一个很好的入门。

## 1.8 第 4 步：定义模型

现在来到核心组件：模型本身。

大多数扩散模型使用的架构都是 [U-net](https://arxiv.org/abs/1505.04597) 的某种变体，这里我们也将使用它。

![[Attachments/diffusion-unet-model.png]]

简而言之：

- 模型让输入图像经过若干层 ResNet 块，每个块把图像尺寸缩小一半
- 然后再经过同样数量的块，把图像上采样回原来的尺寸
- 在下采样路径上的特征与上采样路径中对应层之间有跳跃连接（skip connection）

这个模型的一个关键特性是，它预测的输出与输入尺寸相同，而这正是我们这里所需要的。

Diffusers 提供了一个很方便的 `UNet2DModel` 类，可以用 PyTorch 创建所需的架构。

下面为我们想要的图像尺寸创建一个 U-net。注意 `down_block_types` 对应下采样块（上图中绿色部分），`up_block_types` 是上采样块（上图中红色部分）：

```python
from diffusers import UNet2DModel


# 创建模型
model = UNet2DModel(
    sample_size=image_size,  # 目标图像分辨率
    in_channels=3,  # 输入通道数，RGB 图像为 3
    out_channels=3,  # 输出通道数
    layers_per_block=2,  # 每个 UNet 块使用多少个 ResNet 层
    block_out_channels=(64, 128, 128, 256),  # 通道数越多 -> 参数量越多
    down_block_types=(
        "DownBlock2D",  # 普通的 ResNet 下采样块
        "DownBlock2D",
        "AttnDownBlock2D",  # 带空间自注意力的 ResNet 下采样块
        "AttnDownBlock2D",
    ),
    up_block_types=(
        "AttnUpBlock2D",
        "AttnUpBlock2D",  # 带空间自注意力的 ResNet 上采样块
        "UpBlock2D",
        "UpBlock2D",  # 普通的 ResNet 上采样块
    ),
)

model.to(device);
```

处理更高分辨率的输入时，你可能想使用更多的下采样和上采样块，并把注意力层只保留在最低分辨率（最底层）的层上，以减少内存占用。稍后我们会讨论如何针对你的用例实验出最佳设置。

我们可以检查一下：传入一批数据和一些随机时间步，得到的输出与输入数据形状相同：

```python
with torch.no_grad():
    model_prediction = model(noisy_xb, timesteps).sample

model_prediction.shape
```

```text
torch.Size([8, 3, 32, 32])
```

下一节我们将看看如何训练这个模型。

## 1.9 第 5 步：创建训练循环

是时候训练了！下面是 PyTorch 中一个典型的优化循环：我们逐批遍历数据，每一步用优化器更新模型参数——这里用的是学习率为 0.0004 的 AdamW 优化器。

对每一批数据，我们会：

- 采样一些随机时间步
- 相应地给数据加噪
- 把带噪数据送入模型
- 用均方误差（MSE）作为损失函数，比较模型预测与目标（在这里就是噪声）
- 通过 `loss.backward()` 和 `optimizer.step()` 更新模型参数

在这个过程中，我们还会记录损失随时间的变化，以便之后绘图。

注意：这段代码运行起来需要将近 10 分钟。如果你赶时间，可以跳过这两个单元格，直接使用预训练模型。或者，你也可以通过上面的模型定义减少每层的通道数来加速。

[官方的 diffusers 训练示例](https://colab.research.google.com/github/huggingface/notebooks/blob/main/diffusers/training_example.ipynb)在这个数据集上以更高分辨率训练了一个更大的模型，可以作为「不那么精简」的训练循环的参考：

```python
# 设置噪声 scheduler
noise_scheduler = DDPMScheduler(
    num_train_timesteps=1000, beta_schedule="squaredcos_cap_v2"
)

# 训练循环
optimizer = torch.optim.AdamW(model.parameters(), lr=4e-4)

losses = []

for epoch in range(30):
    for step, batch in enumerate(train_dataloader):
        clean_images = batch["images"].to(device)
        # 采样要加到图像上的噪声
        noise = torch.randn(clean_images.shape).to(clean_images.device)
        bs = clean_images.shape[0]

        # 为每张图像采样一个随机时间步
        timesteps = torch.randint(
            0, noise_scheduler.num_train_timesteps, (bs,), device=clean_images.device
        ).long()

        # 根据每个时间步的噪声强度，把噪声加到干净图像上
        noisy_images = noise_scheduler.add_noise(clean_images, noise, timesteps)

        # 获取模型预测
        noise_pred = model(noisy_images, timesteps, return_dict=False)[0]

        # 计算损失
        loss = F.mse_loss(noise_pred, noise)
        loss.backward(loss)
        losses.append(loss.item())

        # 用优化器更新模型参数
        optimizer.step()
        optimizer.zero_grad()

    if (epoch + 1) % 5 == 0:
        loss_last_epoch = sum(losses[-len(train_dataloader) :]) / len(train_dataloader)
        print(f"Epoch:{epoch+1}, loss: {loss_last_epoch}")
```

```text
Epoch:5, loss: 0.16273280512541533
Epoch:10, loss: 0.11161588924005628
Epoch:15, loss: 0.10206522420048714
Epoch:20, loss: 0.08302505919709802
Epoch:25, loss: 0.07805309211835265
Epoch:30, loss: 0.07474562455900013
```

画出损失曲线可以看到，模型一开始提升很快，之后继续以较慢的速度变好（如果像右图那样用对数刻度会更明显）：

```python
fig, axs = plt.subplots(1, 2, figsize=(12, 4))
axs[0].plot(losses)
axs[1].plot(np.log(losses))
plt.show()
```

```text
[<matplotlib.lines.Line2D at 0x7f40fc40b7c0>]
```

![[Attachments/diffusion-07-loss-curves.png]]

作为运行上面训练代码的替代方案，你可以直接使用 pipeline 里的模型，像这样：

```python
# 取消注释以加载我之前训练好的模型：
# model = butterfly_pipeline.unet
```

## 1.10 第 6 步：生成图像

我们如何用这个模型得到图像呢？

### 1.10.1 方案 1：创建 pipeline

```python
from diffusers import DDPMPipeline


image_pipe = DDPMPipeline(unet=model, scheduler=noise_scheduler)

pipeline_output = image_pipe()
pipeline_output.images[0]
```

![[Attachments/diffusion-08-generated-sample-1.png]]

我们可以像这样把一个 pipeline 保存到本地文件夹：

```python
image_pipe.save_pretrained("my_pipeline")
```

查看文件夹内容：

```bash
!ls my_pipeline/
```

```text
model_index.json  scheduler  unet
```

`scheduler` 和 `unet` 子文件夹包含了重建这些组件所需的一切。例如，在 `unet` 文件夹里你会找到模型权重（`diffusion_pytorch_model.bin`），以及一个指定 UNet 架构的配置文件。

```bash
!ls my_pipeline/unet/
```

```text
config.json  diffusion_pytorch_model.bin
```

这些文件合在一起，包含了重建该 pipeline 所需的一切。你可以手动把它们上传到 Hub 与他人分享，也可以查看下一节的代码，通过 API 来完成这件事。

### 1.10.2 方案 2：编写采样循环

如果你查看 pipeline 的 forward 方法，就能看到运行 `image_pipe()` 时发生了什么：

```python
# ??image_pipe.forward
```

我们从随机噪声开始，按照从噪声最多到最少的顺序遍历 scheduler 的时间步，每一步根据模型预测去除少量噪声：

```python
# 随机起点（8 张随机图像）：
sample = torch.randn(8, 3, 32, 32).to(device)

for i, t in enumerate(noise_scheduler.timesteps):

    # 获取模型预测
    with torch.no_grad():
        residual = model(sample, t).sample

    # 用这一步更新 sample
    sample = noise_scheduler.step(residual, t, sample).prev_sample

show_images(sample)
```

![[Attachments/diffusion-09-sampling-loop-output.png]]

`noise_scheduler.step()` 函数会执行更新 `sample` 所需的数学运算。采样方法有很多种——在下一单元中我们会看到如何换用不同的采样器，以加快现有模型的图像生成速度，并更深入地讨论从扩散模型采样的理论。

## 1.11 第 7 步：把模型推送到 Hub

在上面的例子中，我们把 pipeline 保存到了本地文件夹。要把模型推送到 Hub，我们需要一个模型仓库（repository）。我们会根据想给模型起的 ID 来确定仓库名（你可以随意替换 `model_name`，只要其中包含你的用户名即可，这正是函数 `get_full_repo_name()` 所做的）：

```python
from huggingface_hub import get_full_repo_name


model_name = "sd-class-butterflies-32"
hub_model_id = get_full_repo_name(model_name)
hub_model_id
```

```text
'lewtun/sd-class-butterflies-32'
```

接下来，在 🤗 Hub 上创建模型仓库并推送我们的模型：

```python
from huggingface_hub import HfApi, create_repo


create_repo(hub_model_id)
api = HfApi()
api.upload_folder(
    folder_path="my_pipeline/scheduler", path_in_repo="", repo_id=hub_model_id
)
api.upload_folder(folder_path="my_pipeline/unet", path_in_repo="", repo_id=hub_model_id)
api.upload_file(
    path_or_fileobj="my_pipeline/model_index.json",
    path_in_repo="model_index.json",
    repo_id=hub_model_id,
)
```

```text
'https://huggingface.co/lewtun/sd-class-butterflies-32/blob/main/model_index.json'
```

最后要做的是创建一份漂亮的模型卡片（model card），这样我们的蝴蝶生成器就能很容易地在 Hub 上被找到（欢迎自行扩展和编辑描述！）：

````python
from huggingface_hub import ModelCard


content = f"""
---
license: mit
tags:
- pytorch
- diffusers
- unconditional-image-generation
- diffusion-models-class
---

# Model Card for Unit 1 of the [Diffusion Models Class 🧨](https://github.com/huggingface/diffusion-models-class)

This model is a diffusion model for unconditional image generation of cute 🦋.

## Usage

```python
from diffusers import DDPMPipeline

pipeline = DDPMPipeline.from_pretrained('{hub_model_id}')
image = pipeline().images[0]
image
```
"""

card = ModelCard(content)
card.push_to_hub(hub_model_id)
````

现在模型已经在 Hub 上了，你可以在任何地方通过 `DDPMPipeline` 的 `from_pretrained()` 方法下载它，像这样：

```python
from diffusers import DDPMPipeline


image_pipe = DDPMPipeline.from_pretrained(hub_model_id)
pipeline_output = image_pipe()
pipeline_output.images[0]
```

```text
Fetching 4 files:   0%|          | 0/4 [00:00<?, ?it/s]
  0%|          | 0/1000 [00:00<?, ?it/s]
```

![[Attachments/diffusion-10-generated-sample-2.png]]

很好，成功了！

# 2 用 🤗 Accelerate 扩展训练

这个 Notebook 是为学习目的编写的，因此我尽量让代码尽可能精简、干净。正因为如此，我们省略了一些你在用更多数据训练更大模型时可能想要的功能，例如多 GPU 支持、进度和示例图像的日志记录、用于支持更大 batch size 的梯度检查点（gradient checkpointing）、模型自动上传等等。幸运的是，这些功能大多都可以在[这里](https://github.com/huggingface/diffusers/raw/main/examples/unconditional_image_generation/train_unconditional.py)的示例训练脚本中找到。

你可以像这样下载该文件：

```bash
!wget https://github.com/huggingface/diffusers/raw/main/examples/unconditional_image_generation/train_unconditional.py
```

打开这个文件，你会看到模型是在哪里定义的，以及有哪些可用设置。我是用下面这条命令运行这个脚本的：

```python
# 给我们的新模型起个名字，用于 Hub
model_name = "sd-class-butterflies-64"
hub_model_id = get_full_repo_name(model_name)
hub_model_id
```

```text
'lewtun/sd-class-butterflies-64'
```

```bash
!accelerate launch train_unconditional.py \
  --dataset_name="huggan/smithsonian_butterflies_subset" \
  --resolution=64 \
  --output_dir={model_name} \
  --train_batch_size=32 \
  --num_epochs=50 \
  --gradient_accumulation_steps=1 \
  --learning_rate=1e-4 \
  --lr_warmup_steps=500 \
  --mixed_precision="no"
```

和之前一样，我们把模型推送到 Hub，并创建一份漂亮的模型卡片（欢迎随意编辑！）：

````python
create_repo(hub_model_id)
api = HfApi()
api.upload_folder(
    folder_path=f"{model_name}/scheduler", path_in_repo="", repo_id=hub_model_id
)
api.upload_folder(
    folder_path=f"{model_name}/unet", path_in_repo="", repo_id=hub_model_id
)
api.upload_file(
    path_or_fileobj=f"{model_name}/model_index.json",
    path_in_repo="model_index.json",
    repo_id=hub_model_id,
)

content = f"""
---
license: mit
tags:
- pytorch
- diffusers
- unconditional-image-generation
- diffusion-models-class
---

# Model Card for Unit 1 of the [Diffusion Models Class 🧨](https://github.com/huggingface/diffusion-models-class)

This model is a diffusion model for unconditional image generation of cute 🦋.

## Usage

```python
from diffusers import DDPMPipeline

pipeline = DDPMPipeline.from_pretrained('{hub_model_id}')
image = pipeline().images[0]
image
```
"""

card = ModelCard(content)
card.push_to_hub(hub_model_id)
````

```text
'https://huggingface.co/lewtun/sd-class-butterflies-64/blob/main/README.md'
```

大约 45 分钟后，结果如下：

```python
pipeline = DDPMPipeline.from_pretrained(hub_model_id).to(device)
images = pipeline(batch_size=8).images
make_grid(images)
```

```text
  0%|          | 0/1000 [00:00<?, ?it/s]
```

![[Attachments/diffusion-11-butterflies-64px.png]]

**练习：** 看看你能否找出在尽可能短的时间内给出好结果的训练/模型设置，并把你的发现分享给社区。到脚本里翻一翻，看看能否理解这些代码，遇到任何看起来令人困惑的地方都可以提问。

# 3 进一步探索的方向

希望这让你对 🤗 Diffusers 库能做什么有了初步的体会！一些可能的下一步：

- 尝试在一个新数据集上训练无条件扩散模型——如果你[自己创建一个数据集](https://huggingface.co/docs/datasets/image_dataset)就更好了。你可以在 Hub 上的 [HugGan 组织](https://huggingface.co/huggan)找到一些很适合这个任务的优秀图像数据集。只是如果你不想等模型训练太久，记得先把它们降采样！
- 试用 DreamBooth，用[这个 Space](https://huggingface.co/spaces/multimodalart/dreambooth-training) 或[这个 notebook](https://colab.research.google.com/github/huggingface/notebooks/blob/main/diffusers/sd_dreambooth_training.ipynb) 创建你自己的定制 Stable Diffusion pipeline
- 修改训练脚本，探索不同的 UNet 超参数（层数、通道数等）、不同的噪声 schedule 等等
- 看看 [Diffusion Models from Scratch](https://github.com/huggingface/diffusion-models-class/blob/main/unit1/02_diffusion_models_from_scratch.ipynb) 这个 notebook，它对本单元涵盖的核心思想提供了另一种讲解角度

祝你好运，敬请期待第 2 单元！
