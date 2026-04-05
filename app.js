require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const morgan = require('morgan');
const path = require('path');

const indexRouter = require('./routes/index');
const profileRouter = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use('/', indexRouter);
app.use('/profile', profileRouter);

app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: '404 — Lost in Shadows',
    layout: 'layouts/error',
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('errors/500', {
    title: '500 — Amaterasu Struck',
    layout: 'layouts/error',
    error: process.env.NODE_ENV === 'development' ? err.message : null,
  });
});

app.listen(PORT, () => {
  console.log(`\n🔥 CF Tracker running → http://localhost:${PORT}\n`);
});

module.exports = app;
