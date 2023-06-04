import express from "express";
import compression from "compression";
import {
  getSupportedYears,
  getCalendar,
} from "./controllers/calendarController";

const app = express();
app.use(compression());

app.get("/api/getSupportedYears", getSupportedYears);
app.get("/api/getCalendar", getCalendar);

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
