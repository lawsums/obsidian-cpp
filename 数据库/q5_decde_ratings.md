
## 我的做法

![[q5_decade_ratings.sql]]
``` include sql
q5_decade_ratings.sql
```


## 正确做法

```sql
select  
	(cast(premiered-premiered%10 as TEXT) || 's') as DECADE,
	round(AVG(rating),2) as AVG_RATING,
	MAX(rating) as TOP_RATING,
	MIN(rating) as MIN_RATING,
	count(*) as NUM_RELEASES
from ratings join titles on ratings.title_id=titles.title_id
where premiered IS NOT NULL
group by premiered-premiered%10
order by round(AVG(rating),2) DESC,premiered-premiered%10 ASC;
```

## 区别点（我错在哪）

