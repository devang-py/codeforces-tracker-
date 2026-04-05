const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', {
    title: 'CF Tracker — Forge Your Legend',
    error: req.query.error || null,
  });
});

module.exports = router;
