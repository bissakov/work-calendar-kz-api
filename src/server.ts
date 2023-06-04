import express from "express";
import axios, { AxiosError } from "axios";
import { JSDOM } from "jsdom";
import compression from "compression";

const app = express();
app.use(compression());
const baseUrl = "https://online.zakon.kz/accountant/Calendars/Holidays/";

const isYearSupported = async (year: number): Promise<boolean> => {
  try {
    const url = `${baseUrl}${year}`;
    await axios.head(url);
    return true;
  } catch (error) {
    return false;
  }
};

app.get("/api/getSupportedYears", async (req, res) => {
  const currentYear = new Date().getFullYear();

  let year = currentYear;
  let years: number[] = [];

  try {
    while (true) {
      const url = `${baseUrl}${year}`;
      await axios.head(url);
      years.push(year);
      year--;
    }
  } catch (error) {}

  res.json({ years, ok: true });
});

app.get("/api/getCalendar", async (req, res) => {
  const year = Number(req.query.year);

  if (isNaN(year)) {
    res.status(400).json({ message: "Invalid 'year' value", ok: false });
    return;
  }

  const isSupported = await isYearSupported(year);
  if (!isSupported) {
    res.status(400).json({ message: "Year is not supported", ok: false });
    return;
  }

  try {
    const url = `${baseUrl}${year}`;

    const response = await axios.get(url, { timeout: 5000 });
    const html = response.data;
    const { window } = new JSDOM(html);
    const document = window.document;

    const monthContainers = document.querySelectorAll(".month-col--calendar");
    const message = await Promise.all(
      Array.from(monthContainers).map(async (monthContainer, index) => {
        return {
          month: index + 1,
          month_russian: monthContainer.querySelector("h6")?.textContent,
        };
      })
    );

    res.status(200).json({ message, ok: true });
  } catch (error) {
    const axiosError = error as AxiosError;
    res.status(500).json({
      message: axiosError?.message || "An error occurred",
      ok: false,
    });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
