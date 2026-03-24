CREATE TABLE IF NOT EXISTS Dealers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone_number INTEGER,
    address TEXT,
    state TEXT,
    city TEXT,
    zip_code TEXT,
    website TEXT,
    UNIQUE(name, city, state)
);

CREATE TABLE IF NOT EXISTS Parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    type TEXT NOT NULL, 
    description TEXT,
    image TEXT,
    miles INTEGER,
    grade TEXT,
    stock_id TEXT,
    price DECIMAL(19, 4),
    dealer_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, dealer_id),
    FOREIGN KEY(dealer_id) REFERENCES Dealers(id)
    FOREIGN KEY(vehicle_id) REFERENCES Vehicles(id)
);

CREATE TABLE IF NOT EXISTS Vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_webhook TEXT,
    schedule TEXT, -- cron job format
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    description TEXT NOT NULL,
    year_range_start INTEGER NOT NULL,
    year_range_end INTEGER NOT NULL,
    UNIQUE(model, year) -- added on march 16th
);

CREATE TABLE IF NOT EXISTS Monitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER,
    part_type TEXT,
    variant TEXT,
    UNIQUE(vehicle_id, part_type, variant), -- added on march 16th
    FOREIGN KEY(vehicle_id) REFERENCES Vehicles(id)
);