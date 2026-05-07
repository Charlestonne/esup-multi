const express = require('express');
const router = express.Router();

const DIRECTUS_URL = 'http://localhost:8055/items/events?fields=*,organizer.name';

function mapEvent(e) {
  return {
    id: String(e.id),
    title: e.name,
    description: e.description || '',
    creator: e.organizer?.name || e.organizer || e.source || '',
    location: e.location || '',
    locationLat: e.geo?.coordinates?.[1] ?? null,
    locationLng: e.geo?.coordinates?.[0] ?? null,
    contactInfo: null,
    association: e.source || null,
    type: Array.isArray(e.categories) && e.categories.length > 0 ? e.categories[0] : null,
    startDate: e.startDate,
    endDate: e.endDate,
    imageUrl: e.Image ? `http://localhost:8055/assets/${e.Image}` : null,
  };
}

async function fetchEvents() {
  const res = await fetch(DIRECTUS_URL);
  if (!res.ok) throw new Error(`Directus error: ${res.status}`);
  const json = await res.json();
  return json.data.map(mapEvent);
}

router.get('/', async (_req, res) => {
  try {
    const events = await fetchEvents();
    res.json(events);
  } catch (err) {
    console.error('Failed to fetch events from Directus:', err.message);
    res.status(502).json({ message: 'Could not reach Directus', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const events = await fetchEvents();
    const event = events.find(e => e.id === req.params.id);
    if (!event) return res.status(404).json({ message: 'Not found' });
    res.json(event);
  } catch (err) {
    console.error('Failed to fetch events from Directus:', err.message);
    res.status(502).json({ message: 'Could not reach Directus', error: err.message });
  }
});

module.exports = router;
