## 用法
DataFrame.rename(_mapper=None_, _*_, _index=None_, _columns=None_, _axis=None_, _copy=None_, _inplace=False_, _level=None_, _errors='ignore'_)

## 功能
重命名

## 示例
```python
import pandas as pd

def renameColumns(students: pd.DataFrame) -> pd.DataFrame:
    students = students.rename(columns={
    'id': 'student_id',
    'first': 'first_name',
    'last': 'last_name',
    'age': 'age_in_years'
    })
    
    return students
```
