
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