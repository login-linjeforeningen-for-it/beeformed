UPDATE submissions SET status = 'registered' WHERE id = ANY($1::uuid[]);
