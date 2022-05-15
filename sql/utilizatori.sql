CREATE TYPE roluri AS ENUM('admin', 'moderator', 'comun');

CREATE TABLE IF NOT EXISTS utilizatori (
    id serial PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    nume VARCHAR(100) NOT NULL,
    prenume VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    parola VARCHAR(500) NOT NULL,
    data_inregistrare TIMESTAMP DEFAULT current_timestamp,
    culoare_chat VARCHAR(50) DEFAULT 'black',
    rol roluri NOT NULL DEFAULT 'comun',
    ocupatie VARCHAR(50),
    cale_imagine VARCHAR(500),
    salt varchar(500) NOT NULL,

    cod character varying(200),
    confirmat_mail boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS accesari (
   id serial PRIMARY KEY,
   ip VARCHAR(100) NOT NULL,
   user_id INT NULL REFERENCES utilizatori(id),
   pagina VARCHAR(500) NOT NULL,
   data_accesare TIMESTAMP DEFAULT current_timestamp
);

