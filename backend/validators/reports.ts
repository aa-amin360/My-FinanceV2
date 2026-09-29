import { dateOrToday, parseEnum } from "@/backend/validators/common";

export const REPORT_RANGES = ["ALL", "YEAR", "MONTH"] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];

export function parseReportQuery(params: URLSearchParams) {
  return {
    range: parseEnum(params.get("range") || "ALL", REPORT_RANGES, "Range"),
    today: dateOrToday(params.get("today")),
  };
}
