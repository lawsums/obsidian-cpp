
# 1 Grok 推荐
**是的！扩散模型（Diffusion Models）是当前图像修复（Inpainting）领域最主流的方向之一，效果远超传统GAN，尤其在大掩码、结构一致性和语义合理性上表现突出。**  

作为研零学生，我优先筛选了**代码官方、README清晰、inference上手快（最好支持预训练模型直接跑）、计算量可控**的论文。重点选了**无需从零训扩散模型**或**plug-and-play**的方案，避免你卡在训练DDPM/SD的巨量显存/时间上。

以下是**最推荐的3篇**（按上手难度从易到进阶排序），全部有官方PyTorch代码+预训练模型。它们都支持自定义图片+掩码，直接复现实验超友好。

### 1.1.1 **首推入门：RePaint**（最适合研零起步）
- **论文**：RePaint: Inpainting using Denoising Diffusion Probabilistic Models (CVPR 2022)  
- **为什么适合复现**：  
  - **纯inference方法**：用**预训练的无条件DDPM**（如ImageNet/CelebA/Places2模型），**无需任何训练或微调**，直接在推理时通过“加噪→去噪+重采样”实现条件修复。  
  - 处理极端大掩码效果极强，结构/纹理一致性好，是扩散Inpainting的经典baseline。  
  - 代码极简，配置驱动（改个yml就能跑自定义图+mask）。  
- **官方代码**：https://github.com/andreas128/RePaint  
- **上手流程**（5分钟出结果）：  
  1. `git clone` + `pip install` 几个依赖（torch等）。  
  2. `bash download.sh` 下载预训练模型。  
  3. 把你的图片和mask（255=已知区域，0=待修复）路径写进config yml。  
  4. `python test.py --conf_path confs/xxx.yml` → 输出修复图。  
- **硬件**：单张GPU（甚至老卡都行），inference很快（可调step数加速）。  
- **扩展建议**：先跑官方例子验证，再换自己的数据集（用LaMa工具生成mask）。想深入就改scheduler.py里的重采样参数。

### 1.1.2 **实用首选：BrushNet**（现代plug-and-play，强烈推荐）
- **论文**：BrushNet: A Plug-and-Play Image Inpainting Model with Decomposed Dual-Branch Diffusion (ECCV 2024)  
- **为什么适合复现**：  
  - **即插即用**：在任何预训练Stable Diffusion（SD v1.5或SDXL）上加一个轻量dual-branch模块（把masked image和noisy latent分开处理），**大幅降低学习难度**，语义一致性和mask区域保真度极高。  
  - 支持**文本引导**（prompt控制修复内容），支持随机/分割mask，效果远超早期diffusion方法。  
  - 有Gradio Demo，直接拖图+mask+文字就能玩。  
- **官方代码**：https://github.com/TencentARC/BrushNet  
- **上手流程**：  
  1. conda环境 + 安装diffusers。  
  2. 下载预训练BrushNet权重（Google Drive）。  
  3. 直接跑`test_brushnet.py`或启动`app_brushnet.py`（网页Demo）。  
  4. 想训自己的数据：用`train_brushnet.py`（accelerate支持多卡，batch小也能跑）。  
- **硬件**：推理很轻；训练SD v1.5用单张V100/4090就够（SDXL稍重，但可先用v1.5）。  
- **优势**：和Stable Diffusion生态无缝对接，后续可以接ControlNet、LoRA等进阶玩法。

### 1.1.3 **多功能进阶：PowerPaint**（一模型搞定多种任务）
- **论文**：PowerPaint: A Versatile Image Inpainting Model... (ECCV 2024)  
- **为什么适合复现**：  
  - 单模型支持**文本引导物体插入/移除、图像扩展（outpainting）、形状引导**等多个Inpainting子任务，实用性爆棚。  
  - 基于扩散，代码维护好（open-mmlab出品），社区活跃。  
- **官方代码**：https://github.com/open-mmlab/PowerPaint  
- **上手**：conda环境 + 直接跑inference脚本，有预训练模型。适合你想同时玩多种修复场景时用。

### 1.1.4 其他快速补充（Hugging Face生态）
- **Stable Diffusion Inpainting Pipeline**（最简单，无需看论文也能跑）：  
  Hugging Face `diffusers`库一行代码就能用`StableDiffusionInpaintPipeline`（runwayml/stable-diffusion-inpainting模型）。  
  适合你先验证扩散Inpainting效果，再去读上面论文。示例代码超级短，colab一键跑。

### 1.1.5 复现建议（研零专属）
1. **起步顺序**：先跑 **RePaint**（零训练成本，快速出图，建立信心）→ **BrushNet**（学plug-and-play + 文本控制）→ PowerPaint（多任务）。  
2. **数据集**：Places2 / CelebA-HQ / Open-Images + 随机/中心/不规则mask（代码里通常自带生成工具）。  
3. **评价指标**：PSNR/SSIM（像素级）+ LPIPS/FID（感知级）+ CLIP Score（文本一致性，BrushNet/PowerPaint常用）。  
4. **环境**：PyTorch 1.12+ / 2.x + CUDA，推荐用conda + accelerate（多卡友好）。  
5. **论文阅读**：先看Method里的网络图和采样流程 → 直接对照代码实现。  
6. **如果卡住**：这些仓库Issue都很活跃，直接提问题；或者把你的报错/想改的部分告诉我，我帮你分析代码修改点。

如果你告诉我**具体需求**（比如纯无条件修复？要文本引导？手头是单卡4090还是A100？想侧重推理还是自己训模型？），我可以给你更精确的**训练config建议**、**PyTorch伪代码框架**，或者帮你对比这些方法在同一个数据集上的预期效果。

这些模型代码质量都很高，复现一篇就能写进小论文或者作为毕业设计核心～扩散Inpainting现在热度很高，加油！有问题随时贴代码或截图问我🚀

# 2 RePaint 实践
我看出来了，你是在 **AutoDL 容器** 里，conda 清华源报错了，**不用折腾 conda 了**，直接用 **Python 自带虚拟环境 venv** 100% 能跑！

## 2.1 最快解决方法（1 分钟搞定）
直接复制下面这 4 行，一步都不用改：
```bash
# 1. 创建虚拟环境（名字 env）
python -m venv env

# 2. 激活环境（AutoDL Linux 专用）
source env/bin/activate

# 3. 升级 pip
pip install --upgrade pip

# 4. 安装项目依赖
pip install numpy torch blobfile tqdm pyYaml pillow
```

## 2.2 修复找不到包的问题
pip config set global.index-url https://pypi.org/simple

激活成功后，你的命令行前面会出现 **(env)**，就对了！

---

## 2.3 然后继续跑项目（和之前一样）
```bash
# 下载模型
pip install --upgrade gdown
bash ./download.sh

# 运行示例
python test.py --conf_path confs/face_example.yml
```

---

## 2.4 为什么不用 conda？
你现在的 conda 配置了**旧的清华源**，官方已经弃用了，所以报错。
在 AutoDL 里，**venv 比 conda 更稳定、更快、不报错**。

---

### 2.4.1 总结
1. 别用 conda 了，直接用 **venv**
2. 复制我上面的命令，**100% 能跑**
3. 输出在 `./log/face_example/inpainted`

需要我继续帮你跑通吗？直接复制命令就行！

# 3 RePaint 实践 2

我给你 **纯 Conda 完整流程**，一步一步复制粘贴就能跑，**Windows / Mac / Linux 完全通用**，不会和你现有环境冲突！

---

## 3.1 第一步：创建并进入 Conda 环境
打开 **Anaconda Prompt**（Windows）或终端（Mac/Linux），执行：

```bash
# 1. 创建环境（名字：repaint，Python 3.9 最稳定）
conda create -n repaint python=3.9 -y

# 2. 激活环境
conda activate repaint
```
激活成功后，命令行前面会变成 **(repaint)**

---

## 3.2 第二步：克隆代码
```bash
git clone https://github.com/andreas128/RePaint.git
cd RePaint
```

---

## 3.3 第三步：安装依赖（Conda 环境内）
```bash
pip install numpy torch blobfile tqdm pyYaml pillow
```

---

## 3.4 第四步：下载模型
```bash
pip install --upgrade gdown
bash ./download.sh
```
Windows 没有 bash 的话，直接双击运行项目里的 `download.sh` 也行。

> [!fail] 
> 下载太慢, 怎么解决?

尝试手动上传

- [x] 下载模型
	- [x] **256x256_classifier.pt** 官方地址（推荐用浏览器或 IDM 下载）： [https://openaipublic.blob.core.windows.net/diffusion/jul-2021/256x256_classifier.pt](https://openaipublic.blob.core.windows.net/diffusion/jul-2021/256x256_classifier.pt)
	- [x] **256x256_diffusion.pt** 官方地址： [https://openaipublic.blob.core.windows.net/diffusion/jul-2021/256x256_diffusion.pt](https://openaipublic.blob.core.windows.net/diffusion/jul-2021/256x256_diffusion.pt)
	- [x] Google Drive 的三个文件（gdown 的那几个）：
	    - [x] [https://drive.google.com/uc?id=1norNWWGYP3EZ_o05DmoW1ryKuKMmhlCX](https://drive.google.com/uc?id=1norNWWGYP3EZ_o05DmoW1ryKuKMmhlCX)
	    - [x] [https://drive.google.com/uc?id=1QEl-btGbzQz6IwkXiFGd49uQNTUtTHsk](https://drive.google.com/uc?id=1QEl-btGbzQz6IwkXiFGd49uQNTUtTHsk)
	    - [x] [https://drive.google.com/uc?id=1Q_dxuyI41AAmSv9ti3780BwaJQqwvwMv](https://drive.google.com/uc?id=1Q_dxuyI41AAmSv9ti3780BwaJQqwvwMv) （这是 data.zip）
- [x] 移动到H盘
- [ ] 上传模型
- [ ] 删除本地模型

---

## 3.5 第五步：运行示例
```bash
python test.py --conf_path confs/face_example.yml
```

输出结果在：
```
./log/face_example/inpainted
```

---

# 4 超实用 Conda 小命令
```bash
# 退出环境
conda deactivate

# 删除环境（不用了再删）
conda remove -n repaint --all -y

# 查看所有环境
conda env list
```

---

### 4.1.1 总结
1. **Conda 是运行这个扩散模型项目的最优选择**，比 venv 更稳定
2. 全程只需要复制粘贴，**不会污染你的系统环境**
3. 输出图片在 `log/face_example/inpainted`

需要我帮你解决 **下载慢、CUDA 报错、Windows 运行 sh 脚本失败** 吗？
