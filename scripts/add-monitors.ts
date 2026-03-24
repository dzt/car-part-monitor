const monitors = require('../monitors.json');
const db = require('../db/actions.js');

let add_vehicles = 0;
let added_monitors = 0;
let vehicles_changed = 0;

for (const vehicle of monitors) {
    let vehicleQuery = db.findVehicle(vehicle.model, vehicle.year_range);
    if (!vehicleQuery) {
        try {
            vehicleQuery = db.addVehicle(
                vehicle.discord_webhook,
                vehicle.model,
                vehicle.year,
                vehicle.description,
                vehicle.year_range,
                vehicle.schedule
            );
            add_vehicles += 1;
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    } else {
        // update params such as discord webhooks, schedule, and description
        if ((vehicle.discord_webhook != vehicleQuery.discord_webhook) ||
            (vehicle.description != vehicleQuery.description) ||
            (vehicle.schedule != vehicleQuery.schedule)) {
                db.updateVehicle(vehicleQuery.id, {
                    discord_webhook: vehicle.discord_webhook,
                    schedule: vehicle.schedule,
                    description: vehicle.description
                });
                vehicles_changed += 1;
        }
    }
    for (const part of vehicle.parts) {
        let monitorQuery = db.findMonitor(vehicleQuery.id, part.type, part.variant);
        if (!monitorQuery) {
            try {
                db.addMonitor(vehicleQuery.id, part.type, part.variant);
                console.log(`[ADDED]: ${vehicle.year} ${vehicle.model} (ID=${vehicleQuery.id}) ${part.type} ${part.variant ?? '(No Variant Defined)'}`);
                added_monitors += 1;
            } catch (e) {
                console.error(e);
                process.exit(1);
            }
        }
    }
}

console.log('Operation Complete');
console.log(`${add_vehicles} vehicles added.`);
console.log(`${added_monitors} monitors added.`);
console.log(`${vehicles_changed} vehicles were modified`);