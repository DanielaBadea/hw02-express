const express = require('express')
const logger = require('morgan')
const cors = require('cors')
const passport = require("passport");
require("./config/passaport")(passport);
const path = require('path');
const fs = require('fs');

const contactsRouter = require('./routes/api/contacts')
const usersRouter = require('./routes/api/auth')

const app = express();

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

// distribuire de fisere statice 
app.use('/avatars', express.static(path.join(__dirname, 'public/avatars')));
console.log('Serving static files from:', path.join(__dirname, 'public/avatars'));

const avatarDir = path.join(__dirname, 'public/avatars');
fs.readdir(avatarDir, (err, files) => {
  if (err) {
    console.error('Unable to scan directory:', err);
    return;
  } 
  console.log('Files in avatars directory:', files);
});
app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use('/api/contacts', contactsRouter);
app.use('/api/auth', usersRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' })
})

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message })
})

module.exports = app
