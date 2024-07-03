const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const db = require('./models');
require('dotenv').config();

const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
}));

app.use(require('./routes'));

app.use(require('./middlewares/error.handler'))

const PORT = process.env.PORT || 9999;
const HOST_NAME = process.env.HOST_NAME || 'localhost';

app.listen(PORT, HOST_NAME, () => {
    console.log(`Server is running at: http://${HOST_NAME}:${PORT}`);
    db.connectDb();
});
