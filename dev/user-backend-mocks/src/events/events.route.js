const express = require('express');
const router = express.Router();
const { eventsData } = require('./events.mock');

router.get('/', (req, res) => res.json(eventsData));

router.get('/:id', (req, res) => {
  const event = eventsData.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ message: 'Not found' });
  res.json(event);
});

module.exports = router;
