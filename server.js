import express from 'express';
import bodyParser from 'body-parser';
import dotenv from "dotenv";
import connectDB from './src/config/db.js';
import identificationRouter from './src/routes/identificationRoute.js';
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(cors());

app.use(express.static('public'));
// rest api
app.use("/api", identificationRouter);

app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});