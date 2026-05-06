-- Migrate the old Rest of World sentinel to the clearer All countries sentinel.
UPDATE "DeliveryRule"
SET "countryCode" = 'ALL'
WHERE "countryCode" = 'OTHER';
