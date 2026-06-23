---
title: "Count Subgrid Sum = K"
source: "https://atcoder.jp/contests/abc461/tasks/abc461_d"
author:
  - "[[AtCoder Inc.]]"
published: 2026-06-06
created: 2026-06-23
description: "AtCoder is a programming contest site for anyone from beginners to experts. We hold weekly programming contests online."
tags:
  - "clippings"
---
D - Count Subgrid Sum = K

---

Time Limit: 4 sec / Memory Limit: 1024 MiB

配点: $425$ 点

### 0.1.1 問題文

$H \times W$ のグリッドがあり、各マスには $0$ または $1$ の整数が書き込まれています。  
各マスに書き込まれた整数の情報は $H$ 個の長さ $W$ の文字列 $S_1,S_2,\dots,S_H$ として与えられます。 $S_i$ の $j$ 文字目が `0` である時はグリッドの上から $i$ 行目、左から $j$ 列目に $0$ が書き込まれており、 $S_i$ の $j$ 文字目が `1` である時はグリッドの上から $i$ 行目、左から $j$ 列目に $1$ が書き込まれています。

書き込まれた整数の総和が $K$ となる長方形領域がいくつあるか求めてください。  
厳密には、以下の条件を全て満たす整数の四つ組 $(r_1,c_1,r_2,c_2)$ がいくつあるか求めてください。

- $1 \le r_1 \le r_2 \le H$
- $1 \le c_1 \le c_2 \le W$
- グリッドの上から $i$ 行目、左から $j$ 列目に書き込まれた整数を、 $r_1 \le i \le r_2, c_1 \le j \le c_2$ を満たす全ての整数組 $(i,j)$ について足し合わせた値が $K$ である。

### 0.1.2 制約

- $H,W$ は $1$ 以上 $500$ 以下の整数
- $K$ は $0$ 以上 $HW$ 以下の整数
- $S_i$ は `0`, `1` からなる長さ $W$ の文字列

---

### 0.1.3 入力

入力は以下の形式で標準入力から与えられる。

```
HH WW KK
S1S_1
S2S_2
⋮\vdots
SHS_H
```

### 0.1.4 出力

答えを出力せよ。

---

### 0.1.5 入力例 1

```
3 4 3
1001
1101
0110
```

### 0.1.6 出力例 1

```
8
```

書き込まれた整数の総和が $K$ となる長方形領域は以下の $8$ 個です。

- 上から $1$ 行目から $2$ 行目、左から $1$ 列目から $2$ 列目を抜き出した長方形領域
- 上から $1$ 行目から $2$ 行目、左から $1$ 列目から $3$ 列目を抜き出した長方形領域
- 上から $1$ 行目から $2$ 行目、左から $2$ 列目から $4$ 列目を抜き出した長方形領域
- 上から $1$ 行目から $3$ 行目、左から $2$ 列目から $3$ 列目を抜き出した長方形領域
- 上から $1$ 行目から $3$ 行目、左から $3$ 列目から $4$ 列目を抜き出した長方形領域
- 上から $2$ 行目から $2$ 行目、左から $1$ 列目から $4$ 列目を抜き出した長方形領域
- 上から $2$ 行目から $3$ 行目、左から $1$ 列目から $2$ 列目を抜き出した長方形領域
- 上から $2$ 行目から $3$ 行目、左から $2$ 列目から $3$ 列目を抜き出した長方形領域

---

### 0.1.7 入力例 2

```
5 4 20
0101
1010
0101
1010
0101
```

### 0.1.8 出力例 2

```
0
```

---

### 0.1.9 入力例 3

```
15 20 17
10111101101100000100
01100000000010000011
01110010111000111000
11001100000111011000
10100001100011100010
01101000101010000101
10110001111110000100
10110011101100101101
01010001110011001001
01010110010001100110
01110100011110011110
01100000100111010010
11001101100111101100
10111100010101111011
00101101011100010000
```

### 0.1.10 出力例 3

```
448
```

Score: $425$ points

### 0.1.11 Problem Statement

There is an $H \times W$ grid, and each cell contains an integer $0$ or $1$.  
The information of the integer written in each cell is given as $H$ strings $S_1, S_2, \dots, S_H$ of length $W$. If the $j$ -th character of $S_i$ is `0`, then $0$ is written in the cell at the $i$ -th row from the top and the $j$ -th column from the left of the grid; if the $j$ -th character of $S_i$ is `1`, then $1$ is written in that cell.

Find the number of rectangular regions where the sum of the written integers equals $K$.  
More formally, find the number of quadruples of integers $(r_1, c_1, r_2, c_2)$ satisfying all of the following conditions:

- $1 \le r_1 \le r_2 \le H$
- $1 \le c_1 \le c_2 \le W$
- The sum of the integers written in the cell at the $i$ -th row from the top and the $j$ -th column from the left, over all pairs of integers $(i, j)$ satisfying $r_1 \le i \le r_2, c_1 \le j \le c_2$, equals $K$.

### 0.1.12 Constraints

- $H$ and $W$ are integers between $1$ and $500$, inclusive.
- $K$ is an integer between $0$ and $HW$, inclusive.
- $S_i$ is a string of length $W$ consisting of `0` and `1`.

---

### 0.1.13 Input

The input is given from Standard Input in the following format:

```
HH WW KK
S1S_1
S2S_2
⋮\vdots
SHS_H
```

### 0.1.14 Output

Output the answer.

---

### 0.1.15 Sample Input 1

```
3 4 3
1001
1101
0110
```

### 0.1.16 Sample Output 1

```
8
```

There are eight rectangular regions where the sum of the written integers equals $K$:

- The rectangular region extracted from row $1$ to row $2$ from the top and column $1$ to column $2$ from the left
- The rectangular region extracted from row $1$ to row $2$ from the top and column $1$ to column $3$ from the left
- The rectangular region extracted from row $1$ to row $2$ from the top and column $2$ to column $4$ from the left
- The rectangular region extracted from row $1$ to row $3$ from the top and column $2$ to column $3$ from the left
- The rectangular region extracted from row $1$ to row $3$ from the top and column $3$ to column $4$ from the left
- The rectangular region extracted from row $2$ to row $2$ from the top and column $1$ to column $4$ from the left
- The rectangular region extracted from row $2$ to row $3$ from the top and column $1$ to column $2$ from the left
- The rectangular region extracted from row $2$ to row $3$ from the top and column $2$ to column $3$ from the left

---

### 0.1.17 Sample Input 2

```
5 4 20
0101
1010
0101
1010
0101
```

### 0.1.18 Sample Output 2

```
0
```

---

### 0.1.19 Sample Input 3

```
15 20 17
10111101101100000100
01100000000010000011
01110010111000111000
11001100000111011000
10100001100011100010
01101000101010000101
10110001111110000100
10110011101100101101
01010001110011001001
01010110010001100110
01110100011110011110
01100000100111010010
11001101100111101100
10111100010101111011
00101101011100010000
```

### 0.1.20 Sample Output 3

```
448
```

---

2026-06-23 (Tue)  
18:03:31 +08:00

💬📋🗑️

![](chrome-extension://ajbgdbcbcadgdbjngebdkpcbmjklglip/fill_box.png)