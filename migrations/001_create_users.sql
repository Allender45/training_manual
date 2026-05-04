CREATE TABLE IF NOT EXISTS users (
                                     id               SERIAL PRIMARY KEY,
                                     last_name        VARCHAR(255) NOT NULL,
    first_name       VARCHAR(255) NOT NULL,
    middle_name      VARCHAR(255) NOT NULL,
    phone            VARCHAR(20)  NOT NULL,
    email            VARCHAR(255),
    photo            VARCHAR(500),
    passport_series  VARCHAR(4),
    passport_number  VARCHAR(6),
    registered_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    birthday         DATE,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    comment          TEXT,
    has_adaptation   BOOLEAN      NOT NULL DEFAULT FALSE,
    password_hash    VARCHAR(255) NOT NULL,

    CONSTRAINT users_phone_unique UNIQUE (phone),
    CONSTRAINT users_email_unique UNIQUE (email)
    );