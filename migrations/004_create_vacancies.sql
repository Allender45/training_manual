CREATE TABLE IF NOT EXISTS vacancies (
                                         id           SERIAL PRIMARY KEY,
                                         title        VARCHAR(255) NOT NULL,
                                         description  TEXT NOT NULL,
                                         image_url    VARCHAR(500),
                                         status       VARCHAR(20) NOT NULL DEFAULT 'open',
                                         created_by   INTEGER REFERENCES users(id),
                                         created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vacancy_leads (
                                             id                SERIAL PRIMARY KEY,
                                             vacancy_id        INTEGER NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
                                             referrer_user_id  INTEGER REFERENCES users(id),
                                             telegram_id       BIGINT NOT NULL,
                                             full_name         VARCHAR(255) NOT NULL,
                                             phone             VARCHAR(20) NOT NULL,
                                             status            VARCHAR(20) NOT NULL DEFAULT 'new',
                                             comment           TEXT,
                                             created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);