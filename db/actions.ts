import db from './index';
import { Dealer, Monitor, Part, PartTableRow, Vehicle, VehicleUpdate } from "../types";

// Dealer Actions

export const findDealer = (name: string, city: string, state: string) : Dealer | undefined => {
    const query = db.prepare(`
        SELECT * FROM Dealers
        WHERE name = ? AND city = ? AND state = ?
    `);
    return query.get(name, city, state) as Dealer | undefined;
}

export const findDealerById = (id: number) : Dealer | undefined | Error  => {
    const query = db.prepare(`
        SELECT * FROM Dealers
        WHERE id = ?
    `);
    return query.get(id) as Dealer | undefined;
}

export const addDealer = (name: string, city: string, state: string) : Dealer | undefined => {
    const insert = db.prepare(`
        INSERT INTO Dealers (name, city, state) VALUES (?, ?, ?)
        RETURNING *
    `)
    return insert.get(name, city, state) as Dealer | undefined;
}

// Vehicle Actions
export const findAllVehicles = () : Vehicle[] => {
    const query = db.prepare('SELECT * FROM Vehicles');
    return query.all() as Vehicle[];
}

export const addVehicle = (
    webhook: string,
    model: string, year: string,
    desc: string,
    year_range: [number, number],
    schedule: string) : Vehicle | undefined => {
        const insert = db.prepare(`
            INSERT INTO Vehicles (
                discord_webhook,
                model,
                year,
                description,
                year_range_start,
                year_range_end,
                schedule) VALUES (?, ?, ?, ?, ?, ?, ?)
            RETURNING *
        `);
        return insert.get(webhook, model, year, desc, year_range[0], year_range[1], schedule) as Vehicle | undefined;
}

export const findVehicle = (model: string, year_range: [number, number]) : Vehicle | undefined => {
    const query = db.prepare(`
        SELECT * FROM Vehicles
        WHERE model = ?
        AND year_range_start = ?
        AND year_range_end = ?
    `);
    return query.get(model, year_range[0], year_range[1]) as Vehicle | undefined;
}

export const findVehicleById = (id: number) : Vehicle | undefined => {
    const query = db.prepare(`
        SELECT * FROM Vehicles
        WHERE id = ?
    `);
    return query.get(id) as Vehicle | undefined;
}

export const updateVehicle = (vehicle_id: number, changes: VehicleUpdate) : Vehicle | undefined => {
    const vehicle = findVehicleById(vehicle_id);
    if (vehicle instanceof Error || !vehicle) {
        throw new Error(`No vehicle found with the following ID provided: ${vehicle_id}`);
    } else {
        const update = {
            discord_webhook: changes.discord_webhook || vehicle.discord_webhook,
            schedule: changes.schedule || vehicle.schedule,
            description: changes.description || vehicle.description
        }
        const query = db.prepare(`
            UPDATE Vehicles
            SET discord_webhook = ?, schedule = ?, description = ?
            WHERE id = ?
            RETURNING *
        `);
        return query.get(update.discord_webhook, update.schedule, update.description, vehicle_id) as Vehicle | undefined;
    }
}

// Monitor Actions

export const addMonitor = (vehicle_id: number, part_type: string, variant: string) : Monitor | undefined => {
    const insert = db.prepare(`
        INSERT INTO Monitors (vehicle_id, part_type, variant) VALUES (?, ?, ?)
        RETURNING *
    `);
    return insert.get(vehicle_id, part_type, variant) as Monitor | undefined;
}

export const findMonitor = (vehicle_id: number, part_type: string, variant: string) : Monitor | undefined => {
    let query;
    if (variant) {
        query = db.prepare(`
            SELECT * FROM Monitors
            WHERE vehicle_id = ? AND part_type = ? AND variant = ?
        `);
        return query.get(vehicle_id, part_type, variant) as Monitor;
    } else {
        query = db.prepare(`
            SELECT * FROM Monitors
            WHERE vehicle_id = ? AND part_type = ? AND variant IS NULL
        `);
        return query.get(vehicle_id, part_type) as Monitor | undefined;
    }
}

export const findAllMonitors = () : Monitor[] => {
    const query = db.prepare('SELECT * FROM Monitors');
    return query.all();
}

export const findMonitorsByVehicleId = (id: number) : Monitor[] => {
    const query = db.prepare(`
        SELECT * FROM Monitors
        WHERE vehicle_id = ?
    `);
    return query.all(id) as Monitor[];
}

// Part Actions

export const findPart = (stock_id: string, dealer_id: number) : Part | undefined => {
    const query = db.prepare(`
        SELECT * FROM Parts
        WHERE stock_id = ? AND dealer_id = ?
    `);
    return query.get(stock_id, dealer_id) as Part | undefined;
}

export const addPart = (part: PartTableRow, vehicle_id: number) : Part =>  {
    const state = part?.dealer_state;
    const city = part?.dealer_city;
    if (!state || !city) {
        throw new Error("Location data missing");
    }

    let dealer = findDealer(part.dealer, city, state);
    let dealerId;

    if (!dealer) {
        dealer = addDealer(part.dealer, city, state);
    }

    if (dealer) dealerId = dealer.id;

    const insert = db.prepare(`
        INSERT INTO Parts (
            model,
            year,
            vehicle_id,
            type,
            description,
            image,
            miles,
            grade,
            stock_id,
            price,
            dealer_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
    `);
    return insert.get(
        part.model,
        part.year,
        vehicle_id,
        part.type,
        part.description,
        part.image,
        part.miles,
        part.grade,
        part.stock_id,
        part.price,
        dealerId
    );
}