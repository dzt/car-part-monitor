import config from './config.json';

import _ from 'underscore';
import qs from 'qs';

import cron from 'node-cron';
import cheerio from 'cheerio';
import defaults from './defaults';
import utils from './utils/index';
import axios, { AxiosError } from 'axios';
import discord from './utils/discord';
import { addPart, findAllMonitors, findAllVehicles, findDealer, findMonitorsByVehicleId, findPart } from './db/actions';
import { FormSubmission, Monitor, Part, PartsQuery, PartTableRow, Vehicle } from './types';


const fetch_url = 'https://car-part.com/cgi-bin/search.cgi';

const buildForm = (query: PartsQuery, year_range?: [number, number]) : FormSubmission => {
    let form : FormSubmission = {
        userPreference: 'zip',
        userPage: '1',
        userInterchange: 'None',
        userDate: query.year.toString(),
        userDate2: 'Ending Year',
        userSearch: 'int',
        userModel: query.model,
        userPart: query.part,
        userLocation: query.location,
        userZip: query.zipCode
    }
    if (year_range) {
        form['userSearch'] = 'exact';
        form['userDate'] = year_range[0];
        form['userDate2'] = year_range[1];
    }
    return form;
}

// Used for explicit variant searches
const fetchFormData = async (query: PartsQuery) : Promise<FormSubmission> => {
    try {
        const form_data = buildForm(query);
        const response = await axios.post(fetch_url, qs.stringify(form_data), {
            headers: defaults.headers
        });
        const $ = cheerio.load(response.data);
        let form_extract: Record<string, string> = {};
        $('input[type="hidden"]').each((_, el) => {
            const name = $(el).attr('name') || $(el).attr('NAME');
            const value = $(el).attr('value') || $(el).attr('VALUE') || "";
            if (name && value) {
                form_extract[name] = value;
            }
        });

        let form : FormSubmission = {
            userPreference: form_extract['userPreference'],
            userPage: form_extract['userPage'],
            userInterchange: form_extract['userInterchange'],
            userDate: form_extract['userDate'],
            userDate2: form_extract['userDate2'],
            userSearch: form_extract['userSearch'],
            userModel: form_extract['userModel'],
            userPart: form_extract['userPart'],
            userLocation: form_extract['userLocation'],
            userZip: form_extract['userZip']
        };

        if (query.variant) {
            let found = false;
            $('label').each((_, el) => {
                const interchangeTitle = $(el).text().trim();
                if (interchangeTitle.length > 0) {
                    console.log(`[${query.year} ${query.model} ${query.part}] ${interchangeTitle}`);
                    if ((interchangeTitle.length != 0) &&
                        (interchangeTitle.toLowerCase().includes((query.variant as string).toLowerCase())) && !found) {
                        const radioIndex = $(el).attr('for');
                        form['userInterchange'] = $(`input[id="${radioIndex}"]`).attr('value') as string;
                        found = true;
                    }
                }
            });
            if (!found) {
                throw new Error('Invalid varient value provided for ' + query.variant);
            }
        }
        return form;
    } catch (e) {
        console.error('Error occured while trying to fetch form data');
        throw e;
    }
}

// Used to parse all items on results page
const fetchParts = async (query: PartsQuery, direct_search = false, interchange = true, year_range?: [number, number]) : Promise<PartTableRow[]> => {

    let part_list : PartTableRow[] = [];
    let form_data : FormSubmission;
    
    try {

        let response;
        if (direct_search) {
            if (!interchange && year_range) {
                form_data = buildForm(query, year_range);
            } else {
                form_data = buildForm(query);
            }
        } else {
            form_data = await fetchFormData(query);
        }

        response = await axios.post(fetch_url, qs.stringify(form_data), {
            headers: defaults.headers
        });

        if (response.data.includes('could not match your request')) {
            return [];
        } else if (response.data.includes('INVALID SELECTION')) {
            throw new Error(`Invalid vehicle model provided: ${form_data.userDate} ${form_data.userModel}`);
        }

        const $ = cheerio.load(response.data);

        $('table[border="1"] tr').each((_index, el) => {

            const td_arr = $(el).find('td');
            let img_preview : string | undefined | null;
            img_preview = $(el).find('td a img').attr('src');

            if (img_preview && !img_preview.includes('http')) {
                img_preview = null;
            }
            
            if (td_arr.length == 8 || td_arr.length == 7) {

                let offset = 0;
                if (td_arr.length == 7) offset = 1;

                let part_details;
                if (!td_arr.eq(0).html()) return;

                // Should throw an error in catch(e) block if td_arr.eq(0) is undefined
                part_details = (td_arr.eq(0).html() as string).split('<br>');

                const part_miles = td_arr.eq(2).text().trim();
                const dealer = td_arr.eq(6 - offset).text().split('Request_Quote')[0].trim();

                let price : number | null;
                let price_dom = td_arr.eq(5 - offset).text();

                if (price_dom.includes('$')) {
                    if (price_dom.includes('actual')) {
                        price = Number(price_dom.split('actual')[0].slice(1));
                    } else {
                        price = Number(price_dom.slice(1));
                    }
                } else {
                    price = null;
                }

                let description : string | null = td_arr.eq(1).text().split('Estimated CO2e')[0].trim();
                if (description.length == 0) description = null;

                const part : PartTableRow = {
                    model: part_details[2],
                    year: part_details[0],
                    type: part_details[1],
                    description: description,
                    image: (img_preview) ? img_preview.replace(/thumb/g, 'web') : null,
                    miles: (part_miles.length == 0 || td_arr.length == 7) ? null : Number(part_miles.replace(/,/g, '')),
                    grade: td_arr.eq(3 - offset).text().charAt(0),
                    stock_id: td_arr.eq(4 - offset).text(),
                    price: price,
                    dealer: dealer.split('USA-')[0].trim(),
                    dealer_state: (dealer.split('USA-')[1]) ? dealer.split('USA-')[1].substring(0, 2) : null,
                    dealer_city: (dealer.split('USA-')[1]) ? dealer.split('USA-')[1].split('(')[1].split(')')[0] : null
                }
                
                if (!(part.description == 'Description' || part.type == 'Part')) {
                    part_list.push(part);
                }

            }
        });
        return part_list;
    } catch (e: any) {
        if (e instanceof AxiosError && e.code === 'ERR_BAD_REQUEST' && e.response?.status === 403) {
            throw new Error('Service is temporarily unavailable.');
        }
        console.error(e);
        throw e;
    }
}

const findNewParts = async (search: PartsQuery) : Promise<Part[]> => {
    const new_parts = [];
    let parts;
    if (search.variant && search.variant != '[ALL]') {
        parts = await fetchParts(search);
    } else if (search.variant == '[ALL]') {
        parts = await fetchParts(search, true, false, search.year_range);
    } else {
        parts = await fetchParts(search, true);
    }
    for (const part of parts) {
        const dealerCity = part?.dealer_city;
        const dealerState = part?.dealer_state;
        if (!dealerCity || !dealerState) throw new Error('dealer_city and dealer_state cannot be null.');
        const dealer_query = findDealer(part.dealer, dealerCity, dealerState);
        if (!dealer_query) {
            const new_part = addPart(part, search.vehicle_id);
            new_parts.push(new_part);
        } else {
            const part_query = findPart(part.stock_id, dealer_query.id);
            if (!part_query) {
                const new_part = addPart(part, search.vehicle_id);
                new_parts.push(new_part);
            }
        }
    }
    return new_parts;
}

// Create Cron Jobs
const vehicles : Vehicle[] = findAllVehicles();
console.log(`${vehicles.length} vehicles found.`);
console.log(`${findAllMonitors().length} monitors found.`);

discord.init(1000); // Init Discord Webhook @ 1000ms cycle

for (const vehicle of vehicles) {
    const monitors : Monitor[] = findMonitorsByVehicleId(vehicle.id);
    const schedule = vehicle.schedule;
    cron.schedule((schedule as string), async () => {
        try {
            const tasks = monitors.map(monitor => () =>
                findNewParts({
                    vehicle_id: vehicle.id,
                    discord_webhook: vehicle.discord_webhook,
                    year_range: [vehicle.year_range_start, vehicle.year_range_end],
                    model: vehicle.model,
                    year: vehicle.year,
                    variant: monitor.variant,
                    part: monitor.part_type,
                    location: config.location,
                    zipCode: config.zip_code
                })
            );
            const all_parts = await utils.runSequential(tasks, 10000);
            const summary = {
                fulfilled: _.where(all_parts, { status: 'fulfilled' }),
                rejected: _.where(all_parts, { status: 'rejected' })
            }
            const new_parts = summary.fulfilled.map(s => s.value).flat();
            console.error(`${summary.rejected.length} tasks failed while attempting to fetch.`);
            console.log(`${new_parts.length} new ${vehicle.year} ${vehicle.model} parts discovered.`);

            if (summary.rejected.length > 0) {
                console.error(summary.rejected);
            }
            for (const part of new_parts) {
                if (vehicle.discord_webhook) {
                    discord.pushToQueue({
                        webhook_url: vehicle.discord_webhook,
                        part
                    });
                }
            }
        } catch (e) {
            console.error("Error fetching data:", e);
        }
    });
}

console.log('Cron Jobs are active now');