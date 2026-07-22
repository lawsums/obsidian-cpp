这个性质其实是**商法则（Quotient Rule）**求导后的直接结果。

Softmax 函数的定义是：
$$ \hat{y}_i = \frac{e^{o_i}}{\sum_k e^{o_k}} $$

为了书写方便，我们令分母 $S = \sum_k e^{o_k}$。那么 $\hat{y}_i = \frac{e^{o_i}}{S}$。

我们需要求 $\hat{y}_i$ 对某个输入 $o_j$ 的偏导数 $\frac{\partial \hat{y}_i}{\partial o_j}$。这里分两种情况讨论：

---

### 0.1.1 情况一：当 $i = j$ 时（对自己求导）
此时分子 $e^{o_i}$ 和分母 $S$ 中都包含变量 $o_i$。根据**商法则** $(\frac{u}{v})' = \frac{u'v - uv'}{v^2}$：

1.  **分子求导**：$\frac{\partial (e^{o_i})}{\partial o_i} = e^{o_i}$
2.  **分母求导**：$\frac{\partial S}{\partial o_i} = \frac{\partial (\dots + e^{o_i} + \dots)}{\partial o_i} = e^{o_i}$ （因为 $S$ 中只有这一项含 $o_i$）

代入商法则公式：
$$
\begin{aligned}
\frac{\partial \hat{y}_i}{\partial o_i} &= \frac{e^{o_i} \cdot S - e^{o_i} \cdot e^{o_i}}{S^2} \\
&= \frac{e^{o_i}}{S} - \frac{e^{o_i}}{S} \cdot \frac{e^{o_i}}{S} \\
&= \hat{y}_i - \hat{y}_i \cdot \hat{y}_i \\
&= \hat{y}_i(1 - \hat{y}_i)
\end{aligned}
$$
这就是第一种情况的由来。

---

### 0.1.2 情况二：当 $i \neq j$ 时（对别人求导）
此时我们要计算 $\frac{\partial \hat{y}_i}{\partial o_j}$。注意 $\hat{y}_i$ 的分子是 $e^{o_i}$，它不包含 $o_j$，所以分子对 $o_j$ 的导数为 0。但分母 $S$ 中包含 $e^{o_j}$。

再次使用商法则：
1.  **分子求导**：$\frac{\partial (e^{o_i})}{\partial o_j} = 0$
2.  **分母求导**：$\frac{\partial S}{\partial o_j} = e^{o_j}$

代入公式：
$$
\begin{aligned}
\frac{\partial \hat{y}_i}{\partial o_j} &= \frac{0 \cdot S - e^{o_i} \cdot e^{o_j}}{S^2} \\
&= - \frac{e^{o_i}}{S} \cdot \frac{e^{o_j}}{S} \\
&= - \hat{y}_i \hat{y}_j
\end{aligned}
$$
这就是第二种情况的由来。

---

### 0.1.3 总结
这个性质之所以存在，是因为 Softmax 的分母是一个**求和项**。
- 当你改变 $o_i$ 时，不仅分子变了，分母也跟着变，导致结果稍微复杂一点（$\hat{y}_i(1-\hat{y}_i)$）。
- 当你改变 $o_j$ ($j \neq i$) 时，虽然 $\hat{y}_i$ 的分子没变，但分母变了（分母变大，整体分数值就会变小），所以导数永远是负的（$-\hat{y}_i \hat{y}_j$），意味着增加其他类别的得分会压低当前类别的概率。

---

这个推导是理解 Softmax 的核心，需要我帮你把完整的交叉熵梯度推导过程也写出来吗？