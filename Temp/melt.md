

## 用法
DataFrame.melt(_id_vars=None_, _value_vars=None_, _var_name=None_, _value_name='value'_, _col_level=None_, _ignore_index=True_)

## 功能
**关键概念:**
	**Melt 函数**: pandas 的 melt 函数用于转换或重塑数据。它将 DataFrame 从宽格式 (列表示多个变量) 更改为长格式 (每行表示一个唯一变量)。在我们的例子中，我们希望将销售数据从每个季度有单独的列转换为季度有一列、销售额有一列的格式。

**Melt 函数参数定义：**
	- **Id_vars**：这指定了应该保持不变的列。对于这个问题，只有 product 列保持不变，因为我们希望输出中的每一行都与一个产品相关联。
	- **Value_vars**：这指定了我们想要“melt”或将其整形成行的列。在我们的示例中，以下是每个季度的销售数据列：quarter_1、quarter_2、quarter_3 和 quarter_4。
	- **Var_name**：这是将存储来自 value_vars 的标头名称的新列的名称。在我们的问题中，这些是季度名称。
	- **Value_name**：这是将存储 value_vars 中的值的新列的名称。在我们的问题中，这将是每个季度每种产品的销售数据。****

## 示例
```python
import pandas as pd

def meltTable(report: pd.DataFrame) -> pd.DataFrame:
    return report.melt(id_vars = ['product'], 
           value_vars = ['quarter_1', 'quarter_2', 'quarter_3', 'quarter_4'], 
           var_name = 'quarter', 
           value_name = 'sales',)
    
```
