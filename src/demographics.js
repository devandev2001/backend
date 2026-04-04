// Mirrors demographicWeights.js + google-apps-script AC_DEMOGRAPHICS
// Source: Cast_Mapping_Split.xlsx - FINAL GENDER CASTE.csv
// Used for reverse-lookup: weight → label

export const AC_DEMOGRAPHICS = {
  Adoor:              { male:47.21, female:52.79, Muslim:6.80,  Christian:26.40, Nair:25.15, Ezhava:19.67, Others:3.15,  "SC/ST":18.84 },
  Ambalapuzha:        { male:48.78, female:51.21, Muslim:24.90, Christian:15.60, Nair:13.69, Ezhava:27.72, Others:14.33, "SC/ST":3.76  },
  Aranmula:           { male:47.95, female:52.05, Muslim:4.20,  Christian:38.70, Nair:20.89, Ezhava:16.37, Others:4.14,  "SC/ST":15.60 },
  Aroor:              { male:49.05, female:50.95, Muslim:10.80, Christian:19.40, Nair:13.24, Ezhava:37.20, Others:6.65,  "SC/ST":12.61 },
  Attingal:           { male:46.28, female:53.72, Muslim:17.30, Christian:1.70,  Nair:19.10, Ezhava:28.12, Others:16.21, "SC/ST":17.47 },
  Beypur:             { male:48.97, female:51.03, Muslim:40.00, Christian:5.00,  Nair:10.00, Ezhava:15.00, Others:20.00, "SC/ST":10.00 },
  Chalakkudy:         { male:48.87, female:51.13, Muslim:2.91,  Christian:49.09, Nair:7.70,  Ezhava:17.80, Others:10.97, "SC/ST":11.58 },
  Changanassery:      { male:48.20, female:51.80, Muslim:7.90,  Christian:45.40, Nair:12.57, Ezhava:17.34, Others:6.44,  "SC/ST":10.35 },
  Chathannoor:        { male:46.81, female:53.19, Muslim:12.10, Christian:10.30, Nair:26.85, Ezhava:29.60, Others:6.25,  "SC/ST":14.70 },
  Chelakkara:         { male:48.42, female:51.58, Muslim:26.93, Christian:6.51,  Nair:20.00, Ezhava:12.00, Others:18.71, "SC/ST":15.90 },
  Chengannur:         { male:47.64, female:52.35, Muslim:3.89,  Christian:26.81, Nair:29.92, Ezhava:15.54, Others:7.72,  "SC/ST":15.97 },
  Cherthala:          { male:48.48, female:51.52, Muslim:2.30,  Christian:21.70, Nair:11.47, Ezhava:41.95, Others:16.88, "SC/ST":5.59  },
  Chirayankeezhu:     { male:46.37, female:53.63, Muslim:17.90, Christian:15.20, Nair:14.63, Ezhava:23.56, Others:11.97, "SC/ST":16.34 },
  Devikulam:          { male:49.26, female:50.74, Muslim:5.00,  Christian:30.00, Nair:5.00,  Ezhava:10.00, Others:20.00, "SC/ST":30.00 },
  Ettumanoor:         { male:48.89, female:51.11, Muslim:5.37,  Christian:40.46, Nair:13.86, Ezhava:24.32, Others:9.82,  "SC/ST":6.17  },
  Guruvayoor:         { male:48.73, female:51.27, Muslim:20.00, Christian:20.00, Nair:12.00, Ezhava:20.00, Others:18.00, "SC/ST":10.00 },
  Harippad:           { male:47.61, female:52.39, Muslim:10.66, Christian:8.90,  Nair:21.16, Ezhava:40.40, Others:9.63,  "SC/ST":9.11  },
  Idukki:             { male:49.53, female:50.47, Muslim:3.22,  Christian:54.76, Nair:6.30,  Ezhava:17.23, Others:8.33,  "SC/ST":10.16 },
  Irinjalakuda:       { male:48.29, female:51.71, Muslim:6.49,  Christian:31.46, Nair:9.30,  Ezhava:27.90, Others:10.60, "SC/ST":14.21 },
  Irinjalakkuda:      { male:48.29, female:51.71, Muslim:6.49,  Christian:31.46, Nair:9.30,  Ezhava:27.90, Others:10.60, "SC/ST":14.21 },
  Irikkur:            { male:49.58, female:50.42, Muslim:16.26, Christian:43.57, Nair:8.84,  Ezhava:8.03,  Others:15.46, "SC/ST":7.83  },
  Kalpetta:           { male:48.76, female:51.24, Muslim:15.00, Christian:20.00, Nair:6.00,  Ezhava:15.00, Others:24.00, "SC/ST":20.00 },
  Kanhangad:          { male:48.62, female:51.37, Muslim:20.11, Christian:14.47, Nair:11.78, Ezhava:17.01, Others:26.24, "SC/ST":10.40 },
  Kanjirappally:      { male:48.55, female:51.45, Muslim:10.20, Christian:40.00, Nair:23.92, Ezhava:12.00, Others:4.21,  "SC/ST":9.66  },
  Karunagappally:     { male:48.64, female:51.35, Muslim:23.90, Christian:4.00,  Nair:16.62, Ezhava:33.78, Others:13.35, "SC/ST":8.15  },
  Kasaragod:          { male:50.00, female:50.00, Muslim:50.42, Christian:2.40,  Nair:3.30,  Ezhava:15.00, Others:22.17, "SC/ST":6.71  },
  Kattakkada:         { male:48.01, female:51.99, Muslim:6.04,  Christian:22.27, Nair:34.99, Ezhava:14.83, Others:10.07, "SC/ST":11.37 },
  Kayamkulam:         { male:47.75, female:52.25, Muslim:17.50, Christian:8.90,  Nair:24.39, Ezhava:33.06, Others:4.73,  "SC/ST":11.22 },
  Kazhakkoottam:      { male:47.82, female:52.18, Muslim:7.30,  Christian:14.50, Nair:27.98, Ezhava:28.30, Others:11.72, "SC/ST":10.20 },
  Kodungallur:        { male:48.68, female:51.32, Muslim:16.96, Christian:22.51, Nair:10.30, Ezhava:26.00, Others:13.73, "SC/ST":10.48 },
  Konni:              { male:47.57, female:52.43, Muslim:5.00,  Christian:30.70, Nair:23.45, Ezhava:17.33, Others:8.82,  "SC/ST":14.70 },
  Kottarakkara:       { male:47.39, female:52.61, Muslim:5.08,  Christian:21.17, Nair:32.94, Ezhava:15.14, Others:9.49,  "SC/ST":16.19 },
  Kottayam:           { male:48.13, female:51.87, Muslim:4.97,  Christian:43.23, Nair:16.15, Ezhava:20.06, Others:8.23,  "SC/ST":7.25  },
  Kovalam:            { male:48.88, female:51.11, Muslim:9.56,  Christian:35.91, Nair:14.71, Ezhava:14.35, Others:13.70, "SC/ST":11.66 },
  "Kozhikode North":  { male:47.41, female:52.59, Muslim:25.10, Christian:7.90,  Nair:14.07, Ezhava:32.16, Others:16.34, "SC/ST":4.43  },
  Kunnamkulam:        { male:48.56, female:51.43, Muslim:20.14, Christian:21.37, Nair:12.90, Ezhava:22.80, Others:8.95,  "SC/ST":13.84 },
  Kunnathunad:        { male:48.85, female:51.14, Muslim:19.70, Christian:35.40, Nair:11.78, Ezhava:14.57, Others:5.42,  "SC/ST":13.13 },
  Kunnathur:          { male:47.69, female:52.31, Muslim:13.70, Christian:15.10, Nair:30.78, Ezhava:13.64, Others:8.26,  "SC/ST":18.53 },
  Kuttanad:           { male:49.24, female:50.76, Muslim:1.23,  Christian:38.90, Nair:14.32, Ezhava:28.56, Others:7.34,  "SC/ST":9.64  },
  Malampuzha:         { male:48.76, female:51.24, Muslim:11.31, Christian:6.01,  Nair:10.75, Ezhava:33.89, Others:22.76, "SC/ST":15.26 },
  Manalur:            { male:48.89, female:51.11, Muslim:21.05, Christian:21.52, Nair:8.60,  Ezhava:29.90, Others:10.67, "SC/ST":8.28  },
  Manjeshwaram:       { male:50.38, female:49.62, Muslim:52.89, Christian:2.70,  Nair:0.44,  Ezhava:12.00, Others:25.60, "SC/ST":6.37  },
  Mankada:            { male:49.91, female:50.09, Muslim:45.00, Christian:3.00,  Nair:8.00,  Ezhava:10.00, Others:20.00, "SC/ST":14.00 },
  Mavelikkara:        { male:47.00, female:52.99, Muslim:9.60,  Christian:14.50, Nair:31.08, Ezhava:22.00, Others:6.10,  "SC/ST":16.42 },
  Nattika:            { male:48.09, female:51.91, Muslim:16.31, Christian:14.12, Nair:9.00,  Ezhava:34.70, Others:15.26, "SC/ST":10.45 },
  "Nattika (SC)":     { male:48.09, female:51.91, Muslim:16.31, Christian:14.12, Nair:9.00,  Ezhava:34.70, Others:15.26, "SC/ST":10.45 },
  Nedumangad:         { male:47.58, female:52.42, Muslim:20.74, Christian:9.80,  Nair:34.61, Ezhava:13.78, Others:9.90,  "SC/ST":10.91 },
  Nemom:              { male:48.30, female:51.69, Muslim:15.30, Christian:8.50,  Nair:30.88, Ezhava:13.25, Others:22.30, "SC/ST":9.82  },
  Nenmara:            { male:49.60, female:50.40, Muslim:17.06, Christian:3.28,  Nair:7.97,  Ezhava:26.28, Others:23.74, "SC/ST":21.66 },
  Ollur:              { male:48.55, female:51.45, Muslim:3.97,  Christian:40.10, Nair:8.40,  Ezhava:24.00, Others:14.51, "SC/ST":8.97  },
  Ottapalam:          { male:48.54, female:51.46, Muslim:29.06, Christian:2.31,  Nair:18.52, Ezhava:17.83, Others:18.87, "SC/ST":13.36 },
  Pala:               { male:48.71, female:51.29, Muslim:1.58,  Christian:56.26, Nair:16.41, Ezhava:13.73, Others:3.61,  "SC/ST":8.39  },
  Palakkad:           { male:48.63, female:51.37, Muslim:27.90, Christian:2.94,  Nair:9.66,  Ezhava:22.08, Others:25.37, "SC/ST":11.89 },
  Peerumade:          { male:49.32, female:50.68, Muslim:5.97,  Christian:42.98, Nair:4.08,  Ezhava:16.34, Others:5.48,  "SC/ST":25.15 },
  Peravoor:           { male:49.21, female:50.79, Muslim:15.00, Christian:30.00, Nair:8.00,  Ezhava:12.00, Others:20.00, "SC/ST":15.00 },
  Perumbavoor:        { male:49.14, female:50.85, Muslim:18.60, Christian:35.50, Nair:12.39, Ezhava:12.39, Others:11.04, "SC/ST":10.07 },
  Ponnani:            { male:49.56, female:50.44, Muslim:60.00, Christian:3.00,  Nair:5.00,  Ezhava:5.00,  Others:20.00, "SC/ST":7.00  },
  Poonjar:            { male:49.51, female:50.49, Muslim:20.39, Christian:39.26, Nair:7.30,  Ezhava:15.11, Others:6.58,  "SC/ST":11.37 },
  Puthukkad:          { male:49.08, female:50.92, Muslim:5.91,  Christian:30.80, Nair:11.40, Ezhava:25.90, Others:14.41, "SC/ST":11.53 },
  Ranni:              { male:48.67, female:51.33, Muslim:4.70,  Christian:47.00, Nair:17.27, Ezhava:14.44, Others:6.19,  "SC/ST":10.40 },
  Shornur:            { male:48.81, female:51.19, Muslim:31.77, Christian:1.27,  Nair:18.07, Ezhava:15.39, Others:18.68, "SC/ST":14.78 },
  "Sultan Bathery":   { male:48.63, female:51.37, Muslim:16.74, Christian:24.65, Nair:6.40,  Ezhava:17.46, Others:11.65, "SC/ST":22.68 },
  "Sulthan Bathery":  { male:48.63, female:51.37, Muslim:16.74, Christian:24.65, Nair:6.40,  Ezhava:17.46, Others:11.65, "SC/ST":22.68 },
  Thiruvalla:         { male:47.98, female:52.02, Muslim:2.10,  Christian:48.30, Nair:16.78, Ezhava:10.36, Others:10.41, "SC/ST":11.85 },
  Thiruvambady:       { male:49.45, female:50.55, Muslim:44.68, Christian:23.66, Nair:4.75,  Ezhava:8.86,  Others:8.04,  "SC/ST":10.01 },
  Thiruvananthapuram: { male:48.06, female:51.93, Muslim:18.00, Christian:24.00, Nair:23.21, Ezhava:8.43,  Others:17.27, "SC/ST":9.09  },
  Thodupuzha:         { male:49.37, female:50.63, Muslim:16.63, Christian:44.10, Nair:7.84,  Ezhava:15.29, Others:5.90,  "SC/ST":10.18 },
  Thrikkakara:        { male:48.06, female:51.94, Muslim:15.00, Christian:30.00, Nair:12.00, Ezhava:18.00, Others:17.00, "SC/ST":8.00  },
  Thripunithura:      { male:48.32, female:51.68, Muslim:11.82, Christian:26.31, Nair:11.08, Ezhava:21.55, Others:20.95, "SC/ST":7.99  },
  Thrissur:           { male:47.55, female:52.45, Muslim:5.20,  Christian:38.70, Nair:16.30, Ezhava:14.00, Others:17.96, "SC/ST":7.85  },
  Udumbanchola:       { male:49.42, female:50.58, Muslim:4.59,  Christian:42.68, Nair:7.38,  Ezhava:21.09, Others:13.29, "SC/ST":10.96 },
  Vaikom:             { male:48.72, female:51.28, Muslim:4.75,  Christian:17.98, Nair:15.44, Ezhava:34.18, Others:15.01, "SC/ST":12.57 },
  Vamanapuram:        { male:46.98, female:53.02, Muslim:23.06, Christian:9.58,  Nair:25.86, Ezhava:12.63, Others:14.16, "SC/ST":14.71 },
  Varkala:            { male:46.99, female:53.00, Muslim:28.70, Christian:1.10,  Nair:21.51, Ezhava:24.32, Others:8.57,  "SC/ST":15.70 },
  Vattiyoorkavu:      { male:47.56, female:52.44, Muslim:6.00,  Christian:18.00, Nair:35.23, Ezhava:10.24, Others:20.33, "SC/ST":10.20 },
  Wadakkanchery:      { male:48.29, female:51.70, Muslim:6.72,  Christian:29.45, Nair:13.40, Ezhava:21.60, Others:17.40, "SC/ST":11.25 },
};

export const AGE_WEIGHTS = {
  "18-19": 0.01574992977,
  "20-29": 0.16726013,
  "30-39": 0.1839168018,
  "40-49": 0.2081028821,
  "50-59": 0.19009771,
  "60-69": 0.1395625022,
  "70-79": 0.07469513213,
  "80+":   0.02061491203,
};

const CASTES = ["Nair", "Ezhava", "Muslim", "Christian", "SC/ST", "Others"];

/** Lowercase / variant spellings → CASTES key (matches Apps Script canonicalCasteKey). */
function canonicalCasteTextLabel(raw) {
  const key = String(raw || "").trim().toLowerCase().replace(/\s+/g, "").replace(/-/g, "/");
  const map = {
    nair: "Nair",
    ezhava: "Ezhava",
    muslim: "Muslim",
    christian: "Christian",
    others: "Others",
    "sc/st": "SC/ST",
    scst: "SC/ST",
    "sc-st": "SC/ST",
  };
  return map[key] || "";
}
const CANONICAL_AC_BY_KEY = Object.keys(AC_DEMOGRAPHICS).reduce((acc, ac) => {
  acc[String(ac).toLowerCase().replace(/[^a-z0-9]/g, "")] = ac;
  return acc;
}, {});
const AC_ALIASES = {
  kattakada: "Kattakkada",
  kowalam: "Kovalam",
  neyyattinkara: "Nemom",
  naimam: "Nemom",
  naiyamam: "Nemom",
  nemeom: "Nemom",
  nemam: "Nemom",
  nattika: "Nattika",
  nattikasc: "Nattika (SC)",
  thrissurac: "Thrissur",
  manalurac: "Manalur",
  perumbaavoor: "Perumbavoor",
  perumbavoor: "Perumbavoor",
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
  kasargod: "Kasaragod",
  kasaragode: "Kasaragod",
  kasragod: "Kasaragod",
  manjeshwar: "Manjeshwaram",
  manjeswaram: "Manjeshwaram",
  manjeswar: "Manjeshwaram",
};

function normalizeAcName(ac) {
  const raw = String(ac || "").trim();
  if (!raw) return "";
  const key = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  return AC_ALIASES[key] || CANONICAL_AC_BY_KEY[key] || raw;
}

export function getCasteLabel(ac, casteWeight) {
  const raw = String(casteWeight ?? "").trim();
  const fromText = canonicalCasteTextLabel(raw);
  if (fromText) return fromText;
  if (CASTES.includes(raw)) return raw;
  const acData = AC_DEMOGRAPHICS[normalizeAcName(ac)];
  if (!acData) return "Unknown";
  const w = parseFloat(casteWeight);
  if (!Number.isFinite(w) || w === 0) return "Unknown";
  let bestLabel = "Others";
  let bestDiff = Infinity;
  for (const c of CASTES) {
    const diff = Math.abs((acData[c] || 0) / 100 - w);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestLabel = c;
    }
  }
  return bestLabel;
}

export function getGenderLabel(ac, genderWeight, genderLabelFromSheet) {
  const fromSheet = String(genderLabelFromSheet ?? "").trim();
  const s = fromSheet.toLowerCase();
  if (s === "male" || s === "female") {
    return s === "male" ? "Male" : "Female";
  }

  const raw = String(genderWeight ?? "").trim();
  if (raw === "Male" || raw === "Female") return raw;
  const low = raw.toLowerCase();
  if (low === "male" || low === "female") {
    return low === "male" ? "Male" : "Female";
  }
  const acData = AC_DEMOGRAPHICS[normalizeAcName(ac)];
  if (!acData) return "Unknown";
  const w = parseFloat(genderWeight);
  if (!Number.isFinite(w) || w === 0) return "Unknown";
  const maleW = acData.male / 100;
  const femaleW = acData.female / 100;
  const md = Math.abs(maleW - w);
  const fd = Math.abs(femaleW - w);
  // Use strict < so ties (e.g. 50/50 AC, or float rounding) do not always become Male.
  if (md < fd) return "Male";
  if (fd < md) return "Female";
  // Kasaragod (and any AC with equal male/female %): same weight for both — cannot infer from weight alone.
  if (Math.abs(maleW - femaleW) < 1e-9) return "Unknown";
  return femaleW >= maleW ? "Female" : "Male";
}

export function getAgeLabel(ageWeight) {
  const raw = String(ageWeight ?? "").trim();
  if (Object.prototype.hasOwnProperty.call(AGE_WEIGHTS, raw)) return raw;
  const w = parseFloat(ageWeight);
  if (!w) return "Unknown";
  // Find closest match — sheet storage may round last few decimals
  let bestLabel = "Unknown";
  let bestDiff = Infinity;
  for (const [label, val] of Object.entries(AGE_WEIGHTS)) {
    const diff = Math.abs(val - w);
    if (diff < bestDiff) { bestDiff = diff; bestLabel = label; }
  }
  // Accept if within 0.001 (smallest gap between age weights is ~0.015)
  return bestDiff < 0.001 ? bestLabel : "Unknown";
}
