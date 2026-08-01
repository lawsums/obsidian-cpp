select 
    name,
    IFNULL(died, 2022) - born as age
from people
where born >= 1900
order by age desc, name
limit 20;