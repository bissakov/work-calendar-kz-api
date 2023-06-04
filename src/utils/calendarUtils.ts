import axios, { AxiosResponse } from "axios";
import { JSDOM } from "jsdom";

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

const baseUrl = "https://online.zakon.kz/accountant/Calendars/Holidays/";

export const isYearSupported = async (year: number): Promise<boolean> => {
  try {
    const url = `${baseUrl}${year}`;
    await axios.head(url);
    return true;
  } catch (error) {
    return false;
  }
};

export const isLeapYear = (year: number): boolean => {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
};

export const getMonthCalendar = (response: AxiosResponse): Month[] => {
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

export const getEnglishMonthName = (month: number): string => {
  const date = new Date();
  date.setMonth(month);
  return date.toLocaleString("en", { month: "long" });
};
