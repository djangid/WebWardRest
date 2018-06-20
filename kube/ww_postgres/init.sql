CREATE USER webward WITH SUPERUSER PASSWORD 'webward';
CREATE DATABASE webward;
GRANT ALL PRIVILEGES ON DATABASE webward TO webward;
CREATE USER arachni WITH SUPERUSER PASSWORD 'arachni';
CREATE DATABASE arachni;
GRANT ALL PRIVILEGES ON DATABASE arachni TO arachni;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";