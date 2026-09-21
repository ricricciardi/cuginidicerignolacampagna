create table if not exists users (
  id            serial primary key,
  email         text not null unique,
  password_hash text not null,
  sex           text check (sex in ('M', 'F')),                     -- per la classifica per età e sesso
  birth_date    text check (birth_date ~ '^\d{4}-\d{2}-\d{2}$'),  -- mai mostrata agli altri
  created_at    timestamptz not null default now()
);

create table if not exists strava_connections (
  user_id         integer primary key references users(id) on delete cascade,
  athlete_id      bigint not null unique,
  athlete_name    text,
  avatar_url      text,                  -- foto profilo Strava
  access_token    text not null,
  refresh_token   text not null,
  expires_at      bigint not null,
  scope           text not null,
  consent_at      timestamptz not null,  -- consenso a mostrare i tempi agli altri iscritti
  connected_at    timestamptz not null default now(),
  last_synced_at  timestamptz,           -- ultima lettura da Strava riuscita
  last_sync_error text                   -- ultimo errore dell'aggiornamento notturno, se c'è
);

-- Gare: modificabili solo prima della partenza (controllo nell'applicazione).
create table if not exists competitions (
  id          serial primary key,
  name        text not null check (length(name) between 1 and 60),
  km          integer not null check (km between 1 and 100),
  start_date  text not null check (start_date ~ '^\d{4}-\d{2}-\d{2}$'),  -- ora italiana, dalle 00:00
  end_date    text not null check (end_date ~ '^\d{4}-\d{2}-\d{2}$'),    -- ora italiana, fino alle 24:00
  created_by  integer references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (end_date >= start_date)
);

-- Storico: una riga per corsa su strada con GPS, con i parziali al km.
-- Il tempo di ogni gara (primi N km) si calcola dai parziali.
create table if not exists activities (
  id               bigint primary key,          -- id attività Strava
  user_id          integer not null references users(id) on delete cascade,
  name             text,
  distance_m       real not null,
  moving_time_s    integer not null,
  elapsed_time_s   integer not null,
  splits           jsonb not null default '[]', -- [{ m: metri, s: trascorso, mv: in movimento }]
  start_date       timestamptz not null,
  start_date_local text,
  synced_at        timestamptz not null default now()
);
create index if not exists activities_user_idx on activities(user_id, start_date desc);
create index if not exists activities_start_idx on activities(start_date);
