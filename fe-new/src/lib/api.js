
const RAW = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export const API_BASE = RAW.replace(/\/+$/, '');

export function apiFetch(path, init) {
    const url = path.startsWith('/') ? `${API_BASE}${path}` : `${API_BASE}/${path}`;
    return fetch(url, init);
}
