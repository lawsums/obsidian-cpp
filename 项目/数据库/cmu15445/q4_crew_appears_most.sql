select 
    p.name,
    count(*) as cnt
from crew as c
left join people as p on c.person_id = p.person_id
group by p.person_id
order by cnt desc
limit 20;
