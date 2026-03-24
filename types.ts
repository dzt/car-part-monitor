// Generic Types

export type Headers = {
    'Content-Type': string;
    'User-Agent': string;
    'Accept': string;
    'Accept-Encoding': string;
    'Connection': string;
}

export type Location = {
    id: string;
    title: string;
}

export type MonitorDefaults = {
    headers: Headers;
    location_options: Location[];
    parts: string[];
}

// Raw Data extract from car-part.com
export type PartTableRow = {
    model: string;
    year: string;
    type: string;
    description: string | null;
    image: string | null;
    miles: number | null;
    grade: string;
    stock_id: string;
    price: number | null;
    dealer: string;
    dealer_state: string | null;
    dealer_city: string | null;
}

// POST data sent to car-part.com

export type FormSubmission = {
    userPreference: string;
    userPage: string | number;
    userInterchange: string;
    userDate: string | number;
    userDate2: string | number;
    userSearch: string;
    userModel: string;
    userPart: string;
    userLocation: string;
    userZip: string;
}

// Drrived from monitors.json file, initalized when cron job is made

export type PartsQuery = {
    vehicle_id: number;
    discord_webhook: string | null;
    year_range: [number, number];
    model: string;
    year: number;
    variant: string | null;
    part: string;
    location: string;
    zipCode: string;
}

// Database Tables

export type Dealer = {
    id: number;
    name: string;
    phone_number: number | null;
    address: string | null;
    state: string | null;
    city: string | null;
    zip_code: string | null;
    website: string | null;
}

export type Part = {
    id: number;
    vehicle_id: number,
    model: string,
    year: number,
    type: string,
    description: string | null;
    image: string | null;
    miles: number | null;
    grade: string;
    stock_id: string;
    price: number;
    dealer_id: number;
    created_at: Date;
}

export type Vehicle = {
    id: number;
    discord_webhook: string | null;
    schedule: string | null;
    model: string;
    year: number;
    description: string;
    year_range_start: number;
    year_range_end: number;
}

export type Monitor = {
    id: number;
    vehicle_id: number;
    part_type: string;
    variant: string;
}

// Database Actions

export type VehicleUpdate = {
    discord_webhook: string;
    schedule: string;
    description: string;
}

// Discord API
export type WebhookQueue = {
    webhook_url: string;
    part: Part;
}