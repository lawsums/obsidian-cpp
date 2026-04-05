
[[diffusion除图像修复相关论文]]

# 1 评估指标
1. PSNR
  PSNR (Peak Signal-to-Noise Ratio)：最经典指标，基于均方误差（MSE）。越高越好（单位 dB）。 公式：PSNR = 10 × log₁₀(MAX² / MSE)。 优点：简单、直观；缺点：不完全符合人眼感知（可能高 PSNR 但视觉模糊）。SR 和修复任务中几乎所有论文都会报告。 
2. SSIM
SSIM (Structural Similarity Index) / MS-SSIM：结构相似性指数（0~1，越高越好）。考虑亮度、对比度和结构，更贴近人眼。 常用于 SR（如 DIV2K、Set5 数据集）和修复基准。