export const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyeKDAMT9hkUWvU2vTKCwj0ykmIV_ZtLNqNECs55_p6OCAKmOjc0RD2P35Nr-njDiB3/exec";

export const PARTIES = ["LDF", "UDF", "BJP/NDA", "Others"];

export const ACS = [
  "Adoor","Ambalapuzha","Aranmula","Aroor","Attingal",
  "Beypur",
  "Chalakkudy","Changanassery","Chathannoor","Chelakkara","Chengannur","Cherthala","Chirayankeezhu",
  "Devikulam",
  "Ettumanoor",
  "Guruvayoor",
  "Harippad",
  "Idukki","Irinjalakuda","Irikkur",
  "Kalpetta","Kanhangad","Kanjirappally","Karunagappally","Kasaragod",
  "Kattakkada","Kayamkulam","Kazhakkoottam","Kodungallur","Konni",
  "Kottarakkara","Kottayam","Kovalam","Kozhikode North",
  "Kunnamkulam","Kunnathunad","Kunnathur","Kuttanad",
  "Malampuzha","Manalur","Manjeshwaram","Mankada","Mavelikkara",
  "Nattika","Nedumangad","Nemom","Nenmara",
  "Ollur","Ottapalam",
  "Pala","Palakkad","Peerumade","Peravoor","Perumbavoor","Ponnani","Poonjar","Puthukkad",
  "Ranni",
  "Shornur","Sultan Bathery","Sulthan Bathery",
  "Thiruvalla","Thiruvambady","Thiruvananthapuram","Thodupuzha",
  "Thrikkakara","Thripunithura","Thrissur",
  "Udumbanchola",
  "Vaikom","Vamanapuram","Varkala","Vattiyoorkavu",
  "Wadakkanchery"
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
  perumbavoorac: "Perumbavoor",
  kanjirapalli: "Kanjirappally",
  kanjirappalli: "Kanjirappally",
  kazhakootam: "Kazhakkoottam",
  kunnathumar: "Kunnathunad",
  kunnathunadu: "Kunnathunad",
  kunnathunadac: "Kunnathunad",
  gunnarthunadu: "Kunnathunad",
  kunnathumad: "Kunnathunad",
  thripunitura: "Thripunithura",
  thrippunithura: "Thripunithura",
  thrikakkara: "Thrikkakara",
  sulthanbathery: "Sulthan Bathery",
  sultanbathery: "Sultan Bathery",
  irinjalakkuda: "Irinjalakuda",
  beypur: "Beypur",
  beypore: "Beypur",
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
  Manjeshwaram: "1",
  Kasaragod: "2",
  Kanhangad: "4",
  Irikkur: "9",
  Kalpetta: "14",
  "Sultan Bathery": "15",
  "Sulthan Bathery": "15",
  Mananthavady: "16",
  Peravoor: "18",
  "Kozhikode North": "27",
  Thiruvambady: "31",
  Beypur: "35",
  Ponnani: "39",
  Mankada: "43",
  Ottapalam: "50",
  Shornur: "51",
  Nenmara: "53",
  Malampuzha: "55",
  Palakkad: "56",
  Puthukkad: "59",
  Chelakkara: "60",
  Wadakkanchery: "61",
  Kunnamkulam: "62",
  Guruvayoor: "63",
  Manalur: "64",
  Ollur: "65",
  Irinjalakuda: "66",
  Thrissur: "67",
  Nattika: "68",
  Chalakkudy: "69",
  Kodungallur: "70",
  Perumbavoor: "74",
  Thripunithura: "81",
  Thrikkakara: "83",
  Kunnathunad: "84",
  Thodupuzha: "86",
  Udumbanchola: "87",
  Devikulam: "88",
  Idukki: "89",
  Peerumade: "90",
  Ettumanoor: "91",
  Pala: "93",
  Vaikom: "94",
  Kanjirappally: "100",
  Poonjar: "101",
  Changanassery: "103",
  Kottayam: "104",
  Kuttanad: "106",
  Ambalapuzha: "108",
  Chengannur: "110",
  Thiruvalla: "111",
  Aranmula: "113",
  Adoor: "115",
  Konni: "116",
  Ranni: "117",
  Harippad: "119",
  Kayamkulam: "120",
  Mavelikkara: "121",
  Cherthala: "122",
  Aroor: "123",
  Kunnathur: "123",
  Karunagappally: "124",
  Kottarakkara: "125",
  Chathannoor: "126",
  Attingal: "128",
  Vamanapuram: "129",
  Varkala: "130",
  Chirayankeezhu: "129",
  Kazhakkoottam: "132",
  Vattiyoorkavu: "133",
  Thiruvananthapuram: "134",
  Nemom: "135",
  Nedumangad: "136",
  Kattakkada: "138",
  Kovalam: "139",
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
