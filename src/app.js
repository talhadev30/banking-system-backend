const express = require('express');
const connectdb = require('../src/config/db');
const dns = require('dns');
const dotenv = require('dotenv');
const authrouts = require('./routes/auth.routes')
const accountroutes = require('./routes/account.routes')
const cookieParser = require('cookie-parser');
const transactionRoutes = require('./routes/transaction.routes')
const cors = require('cors');


const app = express();

app.use(cors({
  origin: [
    "https://talha-banking-system.vercel.app"
  ],
  credentials: true,
}));
dotenv.config();
dns.setServers(['8.8.8.8']);
connectdb();
app.use(express.json());
app.use(cookieParser());

app.get("/",(req, res)=>{
  res.send("server is running")
})
app.use("/api/auth/" , authrouts)
app.use("/api/accounts/" , accountroutes)
app.use("/api/transaction/" , transactionRoutes)

module.exports = app;