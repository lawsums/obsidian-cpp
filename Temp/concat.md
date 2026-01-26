
## 用法
pandas.concat(_objs_, _*_, _axis=0_, _join='outer'_, _ignore_index=False_, _keys=None_, _levels=None_, _names=None_, _verify_integrity=False_, _sort=False_, _copy=None_)

## 功能
Concatenate pandas objects along a particular axis.

Allows optional set logic along the other axes.

Can also add a layer of hierarchical indexing on the concatenation axis, which may be useful if the labels are the same (or overlapping) on the passed axis number.

## 示例

```python-repl
>>> s1 = pd.Series(['a', 'b'])
>>> s2 = pd.Series(['c', 'd'])
>>> pd.concat([s1, s2])
0    a
1    b
0    c
1    d
dtype: object
```