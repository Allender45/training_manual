CREATE TABLE IF NOT EXISTS news (
                                    id SERIAL PRIMARY KEY,
                                    title VARCHAR(255) NOT NULL,
                                    body TEXT NOT NULL,
                                    image_url VARCHAR(500),
                                    created_by INTEGER NOT NULL REFERENCES users(id),
                                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);