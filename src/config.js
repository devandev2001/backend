export const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyeKDAMT9hkUWvU2vTKCwj0ykmIV_ZtLNqNECs55_p6OCAKmOjc0RD2P35Nr-njDiB3/exec";

export const PARTIES = ["LDF", "UDF", "BJP/NDA", "Others"];

export const ACS = [
  "Kattakkada","Kovalam","Kazhakkoottam","Vattiyoorkavu","Thiruvananthapuram","Nemom","Attingal",
  "Chathannoor","Aranmula","Thiruvalla","Chengannur","Adoor","Poonjar","Kanjirappally",
  "Pala","Thrissur","Kunnathunad","Palakkad","Kozhikode North",
  "Kasaragod","Manjeshwaram",
  "Nattika","Malampuzha","Manalur","Perumbavoor"
];

/** Typo / alternate spellings from sheets → canonical name in ACS (aligns with Apps Script normalizeAcName). */
export const AC_NAME_ALIASES = {
  kattakada: "Kattakkada",
  kowalam: "Kovalam",
  trivandrum: "Thiruvananthapuram",
  kasargod: "Kasaragod",
  kasragod: "Kasaragod",
  kasaragode: "Kasaragod",
  kasargode: "Kasaragod",
  nemam: "Nemom",
  naimam: "Nemom",
  nemeom: "Nemom",
  naiyamam: "Nemom",
  neyyattinkara: "Nemom",
  manjeswaram: "Manjeshwaram",
  manjeshwar: "Manjeshwaram",
  manjeswar: "Manjeshwaram",
  nattikaac: "Nattika",
  nattikasc: "Nattika",
  thrissurac: "Thrissur",
  malampuzha: "Malampuzha",
  chengannur: "Chengannur",
  manalurac: "Manalur",
  perumbaavoor: "Perumbavoor",
  kanjirapalli: "Kanjirappally",
  kanjirappalli: "Kanjirappally",
  kazhakootam: "Kazhakkoottam",
  kunnathumar: "Kunnathunad",
  kunnathunadu: "Kunnathunad",
  kunnathunadac: "Kunnathunad",
  gunnarthunadu: "Kunnathunad",
};

const AC_NAME_BY_KEY = ACS.reduce((acc, name) => {
  acc[String(name).toLowerCase().replace(/[^a-z0-9]/g, "")] = name;
  return acc;
}, {});

/** Map sheet / API value to canonical ACS name when possible. */
export function canonicalAcName(raw) {
  const input = String(raw || "").trim();
  if (!input) return "";
  const key = input.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (AC_NAME_BY_KEY[key]) return AC_NAME_BY_KEY[key];
  if (AC_NAME_ALIASES[key]) return AC_NAME_ALIASES[key];
  return input;
}

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
  Nattika: "68",
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
