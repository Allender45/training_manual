DO $$
    BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vacancy_leads') THEN
            ALTER TABLE vacancy_leads ADD COLUMN IF NOT EXISTS comment TEXT;
        END IF;
    END $$;