select 
    primary_title,
    premiered,
    runtime_minutes || ' (mins)'
from titles 
WHERE genres LIKE '%Sci-Fi%'
order by runtime_minutes desc
limit 10;