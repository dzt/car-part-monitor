import { Part, WebhookQueue } from "../types";

const axios = require('axios');
const db = require('../db/actions.js');

const formatPhoneNumber = (phone_num: number) => {
    return phone_num.toString().replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
}

const pushToDiscord = async (webhook_url: string, part: Part) => {
    try {
        const dealer = db.findDealerById(part.dealer_id);
        const formatVal = (val: string, fallback = 'N/A') => val ? val : fallback;
        const price = (part.price) ? `$${part.price.toFixed(2)}` : 'Unavailable';
        let payload = {
            embeds: [
                {
                    title: `New Inventory`,
                    description: `${part.year} ${part.model} ${part.type}\n${part.description ?? 'No description available.'}`,
                    thumbnail: {
                        url: part.image
                    },
                    color: 3594372,
                    fields: [
                        {
                            name: 'Part Details',
                            value: `- Grade: ${formatVal(part.grade)}\n- Mileage: ${part.miles ? part.miles.toLocaleString() : 'Unavailable'}\n- Price: ${price}`,
                            inline: true
                        },
                        {
                            name: 'Yard Information',
                            value: `- ${dealer.name}\n- Located in ${dealer.city}, ${dealer.state}\n- ${(dealer.phone_number) ? formatPhoneNumber(dealer.phone_number) : 'Contact Info Unavailable'}`,
                            inline: true
                        }
                    ],
                    footer: {
                        text: 'Built by Peter Soboyejo'
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        }
        const response = await axios.post(webhook_url, payload);
        return response.data;
    } catch (error) {
        throw error;
    }
}

let webhook_queue: WebhookQueue[] = [];

const init = (delay = 1000) => {
    // State variable to avoid clashing in the event of async function taking longer than delay
    let running = false;
    setInterval(async () => {
        if (running || webhook_queue.length == 0) return;
        running = true;
        const payload = webhook_queue[0];
        try {
            webhook_queue.splice(0, 1);
            await pushToDiscord(payload.webhook_url, payload.part);
        } catch (e) {
            console.error('Failed sending webhook message');
        } finally {
            running = false;
        }
    }, delay);
}

const pushToQueue = (payload: WebhookQueue) => webhook_queue.push(payload);

export default { init, pushToQueue }