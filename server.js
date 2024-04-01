import express from 'express';
import bodyParser from 'body-parser';
import dotenv from "dotenv";
import connectDB from './src/config/db.js';
import identificationRouter from './src/routes/identificationRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

// rest api
app.use("/api", identificationRouter);

app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});