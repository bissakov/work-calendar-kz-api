import express from "express";
import axios, { AxiosError, AxiosResponse } from "axios";
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

const getEnglishMonthName = (month: number): string => {
  const date = new Date();
  date.setMonth(month);
  return date.toLocaleString("en", { month: "long" });
};

const isLeapYear = (year: number): boolean => {
  if (year % 4 !== 0) {
    return false;
  } else if (year % 100 !== 0) {
    return true;
  } else if (year % 400 !== 0) {
    return false;
  }
  return true;
};

interface Month {
  month: number;
  monthEnglish: string;
  month_russian?: string | null;
  daysCount: number;
  days: Day[];
}

interface Day {
  day: number;
}

const getMonthCalendar = (response: AxiosResponse): Month[] => {
  const html = response.data;
  const { window } = new JSDOM(html);
  const document = window.document;

  const monthContainers = document.querySelectorAll(".month-col--calendar");
  return Array.from(monthContainers).map((monthContainer, index) => {
    const monthEnglish = getEnglishMonthName(index);
    const monthRussion = monthContainer.querySelector("h6")?.textContent;
    const dayElements = monthContainer.querySelectorAll(".calendar-day");
    const daysInfo = Array.from(dayElements)
      .filter((dayElement) => {
        return !dayElement.classList.contains("prev-month");
      })
      .map((dayElement) => {
        return {
          day: Number(dayElement.textContent),
          isDayOff: dayElement.classList.contains("holiday"),
          isSuperHoliday: dayElement.classList.contains("super-holiday"),
        };
      });

    return {
      month: index + 1,
      monthEnglish: monthEnglish,
      monthRussion: monthRussion,
      daysCount: daysInfo.length,
      days: daysInfo,
    };
  });
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

  res.json({ ok: true, years });
});

app.get("/api/getCalendar", async (req, res) => {
  const year = Number(req.query.year);

  if (isNaN(year)) {
    res.status(400).json({ ok: false, message: "Invalid 'year' value" });
    return;
  }

  const isSupported = await isYearSupported(year);
  if (!isSupported) {
    res.status(400).json({ ok: false, message: "Year is not supported" });
    return;
  }

  try {
    const url = `${baseUrl}${year}`;

    const response = await axios.get(url, { timeout: 5000 });
    const isLeap = isLeapYear(year);
    const message = {
      year: year,
      isLeap: isLeap,
      daysCount: 365 + (isLeap ? 1 : 0),
      months: getMonthCalendar(response),
    };

    res.status(200).json({ ok: true, message });
  } catch (error) {
    const axiosError = error as AxiosError;
    res.status(500).json({
      ok: false,
      message: axiosError?.message || "An error occurred",
    });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
