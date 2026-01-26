

## 用法
pandas.pivot(_data_, _*_, _columns_, _index=<no_default>_, _values=<no_default>_)

## 功能
Pivot 函数： 在 pandas 中 pivot 函数被用来基于列的值重塑数据并且在外部得到一个新的 DataFrame。Pivot 采用我们将使用的以下参数：
**Index**： 确定新 DataFrame 中的行。
**Columns**： 确定新 DataFrame 中的列。
**Values**： 指定重塑表格时要使用的值。

**注意：**
- **丢失的数据**： pivot 函数不处理相同索引/列组合的重复条目。如果有重复的条目，可以考虑使用 [[pivot_table]]，它可以聚合重复的条目。
- **数据类型**： 对于每个给定的表，city 和 month 列是 object 数据类型，相当于 pandas 中的字符串型，而 temperature 是整型。
- **顺序**： 输出不一定与示例中的顺序相同 (即从 1 月到 5 月)。如果您想要按特定顺序排列，则必须在透视后对其进行排序。
****
## 示例

```python
import pandas as pd

def pivotTable(weather: pd.DataFrame) -> pd.DataFrame:
    ans = weather.pivot(index='month', columns='city', values='temperature')
    return ans
```
