-- 给出每十年的平均rating，最高rating，最低rating，总发表数
-- 除了那些没有首映得电影
-- 首先按平均评分降序排列，其次按十年降序排列，打破平局。

-- DECADE|AVG_RATING|TOP_RATING|MIN_RATING|NUM_RELEASES
-- 计算每十年的起始年份并分组

-- 根据 premiered / 10 进行分组

SELECT 
    (cast(premiered-premiered%10 as TEXT) || 's') as DECADE,  
    -- cast起到什么作用
    round(avg(r.rating), 2) as avg_rating,
    max(r.rating) as top_rating,
    min(r.rating) as min_rating,
    count(*) as num_releases
FROM titles t
--left join ratings r on t.title_id = r.title_id
inner join ratings r on t.title_id = r.title_id
GROUP BY FLOOR(t.premiered / 10)
ORDER BY round(avg(rating, 2)) desc, FLOOR(t.premiered / 10);
