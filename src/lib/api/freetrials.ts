// lib/api/freetrials.ts
export interface FreeTrial {
    name: string; // required
    phone: string | null; // optional, can be null if empty
    email: string | null; // optional, can be null if empty
    date_time?: string | null; // optional, if you want to manually select a date
    status?: string; // optional, defaults to 'pending' in the DB
}

const BASE_URL = '/api/free_trials';

export async function getFreeTrials(): Promise<FreeTrial[]> {
    const res = await fetch(BASE_URL);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch free trials');
    return data.data;
}

export async function createFreeTrial(payload: FreeTrial): Promise<FreeTrial> {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create free trial');
    return data;
}

export async function updateFreeTrial(payload: FreeTrial): Promise<FreeTrial> {
    const res = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update free trial');
    return data;
}
