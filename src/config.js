export const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyeKDAMT9hkUWvU2vTKCwj0ykmIV_ZtLNqNECs55_p6OCAKmOjc0RD2P35Nr-njDiB3/exec";

export const PARTIES = ["LDF", "UDF", "BJP/NDA", "Others"];

export const ACS = [
  "Kattakkada","Kovalam","Vattiyoorkavu","Thiruvananthapuram","Nemom","Attingal",
  "Chathannoor","Aranmula","Thiruvalla","Chengannur","Adoor","Poonjar",
  "Pala","Thrissur","Kunnathunad","Palakkad","Kozhikode North",
  "Kasaragod","Manjeshwaram"
];

// Format today as d/M/yyyy for the API
export function todayStr() {
  const d = new Date();
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// Format a Date as dd-Mon-yyyy for summary tab names
export function toTabName(date) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata"
  }).replace(/ /g, "-");
}

// Format a Date as d/M/yyyy for entries API
export function toEntryDate(date) {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}
