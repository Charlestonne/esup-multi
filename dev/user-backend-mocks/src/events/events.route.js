const express = require('express');
const router = express.Router();
const { eventsData } = require('./events.mock');

router.get('/', (req, res) => res.json(eventsData));

module.exports = router;
