

``` include sql
q2_sci_fi.sql
```

这里的||很重要因为我一开始写的是 **concat**(runtime_minutes, **" (mins)"**)
就出现了两个隐患，
1. Sqlite 和 sql 的标准不同，sqlite 中字符串连接符是||而不是 CONCAT
2. ""双引号标注字符串不符合 sql 语言的规范，一般使用''单引号标注


