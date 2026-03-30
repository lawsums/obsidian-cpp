
 - [x] 下载仓库
 - [x] 搭建环境
	 - [x] conda env create -f conda_env.yml
	 - [x] conda install pytorch torchvision torchaudio cudatoolkit=10.2 -c pytorch -y
	 - [x] pip install pytorch-lightning==1.2.9
 - [x] 下载模型和测试训练集
	 - [x] 下载模型
	 - [x] 下载训练集
- [x] 上传模型和数据集
 - [x] 跑通一下看看
	 - [x] python3 bin/predict.py model.path=$(pwd)/big-lama indir=$(pwd)/LaMa_test_images outdir=$(pwd)/output

## 0.1 启动虚拟环境
``` bash
conda init 
source /root/.bashrc
conda activate lama
```

## 0.2 下载模型和图片集
网址:
[LaMa - Google 云端硬盘](https://drive.google.com/drive/folders/1B2x7eQDgecTL0oh3LSIBDGj0fTxs6Ips)

## 0.3 跑一个测试
- [ ] 先跑inference验证，
- [ ] 再用Places365小规模训练。
- [ ] README有完整数据准备脚本。

## 0.4 教程
[LaMa 论文复现：Resolution-robust Large Mask Inpainting with Fourier Convolutions-CSDN博客](https://blog.csdn.net/qq_35831906/article/details/134015152)
