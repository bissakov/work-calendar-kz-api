import { Request, Response } from "express";
import axios, { AxiosError, AxiosResponse } from "axios";
import {
  isYearSupported,
  isLeapYear,
  getMonthCalendar,
} from "../utils/calendarUtils";

const baseUrl = "https://online.zakon.kz/accountant/Calendars/Holidays/";

export const getSupportedYears = async (req: Request, res: Response) => {
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

  res
    .status(200)
    .setHeader("Content-Type", "application/json")
    .json({ ok: true, years });
};

export const getCalendar = async (req: Request, res: Response) => {
  const year = Number(req.query.year);

  if (isNaN(year)) {
    res
      .status(400)
      .setHeader("Content-Type", "application/json")
      .json({
        ok: false,
        message: `Invalid value '${req.query.year}' for year`,
      });
    return;
  }

  const isSupported = await isYearSupported(year);
  if (!isSupported) {
    res
      .status(400)
      .setHeader("Content-Type", "application/json")
      .json({ ok: false, message: `Year ${year} is not supported` });
    return;
  }

  try {
    const url = `${baseUrl}${year}`;

    const response = await axios.get(url, { timeout: 5000 });
    const isLeap = isLeapYear(year);
    const result = {
      year: year,
      isLeap: isLeap,
      daysCount: 365 + (isLeap ? 1 : 0),
      months: getMonthCalendar(response),
    };

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .json({ ok: true, message: "success", result });
  } catch (error) {
    const axiosError = error as AxiosError;
    res
      .status(500)
      .setHeader("Content-Type", "application/json")
      .json({
        ok: false,
        message: axiosError?.message || "An error occurred",
      });
  }
};
