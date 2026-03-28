// Mirrors demographicWeights.js + google-apps-script AC_DEMOGRAPHICS
// Source: Cast_Mapping_Split.xlsx - FINAL GENDER CASTE.csv
// Used for reverse-lookup: weight → label

export const AC_DEMOGRAPHICS = {
  Kattakkada:         { male:48.01, female:51.99, Muslim:6.04,  Christian:22.27, Nair:34.99, Ezhava:14.83, Others:10.07, "SC/ST":11.37 },
  Kovalam:            { male:48.88, female:51.11, Muslim:9.56,  Christian:35.91, Nair:14.71, Ezhava:14.35, Others:13.70, "SC/ST":11.66 },
  Kazhakkoottam:      { male:47.82, female:52.18, Muslim:7.30,  Christian:14.50, Nair:27.98, Ezhava:28.30, Others:11.72, "SC/ST":10.20 },
  Vattiyoorkavu:      { male:47.56, female:52.44, Muslim:6.00,  Christian:18.00, Nair:35.23, Ezhava:10.24, Others:20.33, "SC/ST":10.20 },
  Thiruvananthapuram: { male:48.06, female:51.93, Muslim:18.00, Christian:24.00, Nair:23.21, Ezhava:8.43,  Others:17.27, "SC/ST":9.09  },
  Nemom:              { male:48.30, female:51.69, Muslim:15.30, Christian:8.50,  Nair:30.88, Ezhava:13.25, Others:22.30, "SC/ST":9.82  },
  Attingal:           { male:46.28, female:53.72, Muslim:17.30, Christian:1.70,  Nair:19.10, Ezhava:28.12, Others:16.21, "SC/ST":17.47 },
  Chathannoor:        { male:46.81, female:53.19, Muslim:12.10, Christian:10.30, Nair:26.85, Ezhava:29.60, Others:6.25,  "SC/ST":14.70 },
  Aranmula:           { male:47.95, female:52.05, Muslim:4.20,  Christian:38.70, Nair:20.89, Ezhava:16.37, Others:4.14,  "SC/ST":15.60 },
  Thiruvalla:         { male:47.98, female:52.02, Muslim:2.10,  Christian:48.30, Nair:16.78, Ezhava:10.36, Others:10.41, "SC/ST":11.85 },
  Chengannur:         { male:47.64, female:52.35, Muslim:3.89,  Christian:26.81, Nair:29.92, Ezhava:15.54, Others:7.72,  "SC/ST":15.97 },
  Adoor:              { male:47.21, female:52.79, Muslim:6.80,  Christian:26.40, Nair:25.15, Ezhava:19.67, Others:3.15,  "SC/ST":18.84 },
  Poonjar:            { male:49.51, female:50.49, Muslim:20.39, Christian:39.26, Nair:7.30,  Ezhava:15.11, Others:6.58,  "SC/ST":11.37 },
  Kanjirappally:      { male:48.55, female:51.45, Muslim:10.20, Christian:40.00, Nair:23.92, Ezhava:12.00, Others:4.21,  "SC/ST":9.66  },
  Pala:               { male:48.71, female:51.29, Muslim:1.58,  Christian:56.26, Nair:16.41, Ezhava:13.73, Others:3.61,  "SC/ST":8.39  },
  Thrissur:           { male:47.55, female:52.45, Muslim:5.20,  Christian:38.70, Nair:16.30, Ezhava:14.00, Others:17.96, "SC/ST":7.85  },
  Kunnathunad:        { male:48.85, female:51.14, Muslim:19.70, Christian:35.40, Nair:11.78, Ezhava:14.57, Others:5.42,  "SC/ST":13.13 },
  Palakkad:           { male:48.63, female:51.37, Muslim:27.90, Christian:2.94,  Nair:9.66,  Ezhava:22.08, Others:25.37, "SC/ST":11.89 },
  "Kozhikode North":  { male:47.41, female:52.59, Muslim:25.10, Christian:7.90,  Nair:14.07, Ezhava:32.16, Others:16.34, "SC/ST":4.43  },
  Kasaragod:          { male:50.00, female:50.00, Muslim:50.42, Christian:2.40,  Nair:3.30,  Ezhava:15.00, Others:22.17, "SC/ST":6.71  },
  Manjeshwaram:       { male:50.38, female:49.62, Muslim:52.89, Christian:2.70,  Nair:0.44,  Ezhava:12.00, Others:25.60, "SC/ST":6.37  },
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
  const key = String(raw || "").trim().toLowerCase().replace(/\s+/g, "");
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

export function getGenderLabel(ac, genderWeight) {
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
