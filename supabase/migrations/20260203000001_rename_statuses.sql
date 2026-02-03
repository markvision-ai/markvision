
-- Rename statuses to match new funnel requirements
UPDATE leads SET status = 'Без ответа' WHERE status = 'Недозвон';
UPDATE leads SET status = 'Оплачен' WHERE status = 'Оплачено';
