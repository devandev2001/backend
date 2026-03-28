export const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyeKDAMT9hkUWvU2vTKCwj0ykmIV_ZtLNqNECs55_p6OCAKmOjc0RD2P35Nr-njDiB3/exec";

export const PARTIES = ["LDF", "UDF", "BJP/NDA", "Others"];

export const ACS = [
  "Kattakkada","Kovalam","Kazhakkoottam","Vattiyoorkavu","Thiruvananthapuram","Nemom","Attingal",
  "Chathannoor","Aranmula","Thiruvalla","Chengannur","Adoor","Poonjar","Kanjirappally",
  "Pala","Thrissur","Kunnathunad","Palakkad","Kozhikode North",
  "Kasaragod","Manjeshwaram",
  "Nattika (SC)","Malampuzha","Manalur","Perumbavoor"
];

/** Official Kerala AC numbers (matches cast / ward mapping; sheet still stores name only). */
export const AC_NUMBER_BY_NAME = {
  Kattakkada: "138",
  Kovalam: "139",
  Kazhakkoottam: "132",
  Vattiyoorkavu: "133",
  Thiruvananthapuram: "134",
  Nemom: "135",
  Attingal: "128",
  Chathannoor: "126",
  Aranmula: "113",
  Thiruvalla: "111",
  Chengannur: "110",
  Adoor: "115",
  Poonjar: "101",
  Kanjirappally: "100",
  Pala: "93",
  Thrissur: "67",
  Kunnathunad: "84",
  Palakkad: "56",
  "Kozhikode North": "27",
  Kasaragod: "2",
  Manjeshwaram: "1",
  "Nattika (SC)": "68",
  Manalur: "64",
  Malampuzha: "55",
  Perumbavoor: "74",
};

export function getAcNo(acName) {
  const key = String(acName || "").trim();
  return AC_NUMBER_BY_NAME[key] || "";
}

/** Dropdown / chip label — does not change stored `ac` value. */
export function formatAcSelectLabel(acName) {
  const no = getAcNo(acName);
  const name = String(acName || "").trim();
  return no ? `${no} — ${name}` : name || "—";
}

function acSortKey(name) {
  const n = getAcNo(name);
  return n ? parseInt(n, 10) : 9999;
}

/** Sort constituency names by official AC number, then alphabetically. */
export function sortAcNames(names) {
  return [...names].sort((a, b) => {
    const ka = acSortKey(a);
    const kb = acSortKey(b);
    if (ka !== kb) return ka - kb;
    return String(a).localeCompare(String(b));
  });
}

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
