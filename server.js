import express from "express";
import axios from "axios";
import { JSDOM } from "jsdom";

const app = express();

app.get("/api/getCalendar", (req, res) => {
  const year = req.query.year;
  if (!year || isNaN(year) || year < 1900 || year > 2100) {
    res.status(400).json({ message: "Invalid year", ok: false });
    return;
  }

  const url = `https://online.zakon.kz/accountant/Calendars/Holidays/${year}`;

  axios
    .get(url)
    .then((response) => {
      const html = response.data;
      const { window } = new JSDOM(html);
      const document = window.document;

      const monthContainers = document.querySelectorAll(".month-col--calendar");
      const message = [...monthContainers].map((monthContainer, index) => {
        return {
          month: index + 1,
          month_russian: monthContainer.querySelector("h6").textContent,
        };
      });

      res.json({ message, ok: true });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: "An error occurred", ok: false });
    });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
