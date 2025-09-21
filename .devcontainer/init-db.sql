CREATE DATABASE vol_bingo_development;
GRANT ALL PRIVILEGES ON DATABASE vol_bingo_development TO postgres;
\c vol_bingo_development;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE DATABASE vol_bingo_test;
GRANT ALL PRIVILEGES ON DATABASE vol_bingo_test TO postgres;
\c vol_bingo_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
