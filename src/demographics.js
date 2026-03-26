// Mirrors demographicWeights.js / Cast_Mapping_Split.xlsx - Data Caste (1).csv
// Used for reverse-lookup: weight → label

export const AC_DEMOGRAPHICS = {
  Kattakkada:         { male:48.01, female:51.99, Nair:34.99, Ezhava:14.83, Muslim:6.04,  Christian:22.27, "SC/ST":11.37, Others:10.5  },
  Kovalam:            { male:48.88, female:51.11, Nair:14.71, Ezhava:14.35, Muslim:9.56,  Christian:35.91, "SC/ST":11.66, Others:13.81 },
  Vattiyoorkavu:      { male:47.56, female:52.44, Nair:35.23, Ezhava:10.24, Muslim:6.00,  Christian:18.00, "SC/ST":10.20, Others:20.33 },
  Thiruvananthapuram: { male:48.06, female:51.93, Nair:23.21, Ezhava:8.43,  Muslim:18.00, Christian:24.00, "SC/ST":9.09,  Others:17.27 },
  Nemom:              { male:48.30, female:51.69, Nair:30.88, Ezhava:13.25, Muslim:15.30, Christian:8.50,  "SC/ST":9.41,  Others:22.66 },
  Attingal:           { male:46.28, female:53.72, Nair:19.10, Ezhava:28.12, Muslim:17.30, Christian:1.70,  "SC/ST":17.47, Others:16.31 },
  Chathannoor:        { male:46.81, female:53.19, Nair:26.85, Ezhava:29.60, Muslim:12.10, Christian:10.30, "SC/ST":14.70, Others:6.45  },
  Aranmula:           { male:47.95, female:52.05, Nair:20.89, Ezhava:20.89, Muslim:4.20,  Christian:38.70, "SC/ST":15.60, Others:0.00  },
  Thiruvalla:         { male:47.98, female:52.02, Nair:16.78, Ezhava:10.36, Muslim:2.10,  Christian:48.30, "SC/ST":11.93, Others:10.53 },
  Chengannur:         { male:47.64, female:52.35, Nair:29.92, Ezhava:15.54, Muslim:3.89,  Christian:26.81, "SC/ST":15.97, Others:7.87  },
  Adoor:              { male:47.21, female:52.79, Nair:25.15, Ezhava:19.69, Muslim:6.80,  Christian:26.40, "SC/ST":18.84, Others:3.12  },
  Poonjar:            { male:49.51, female:50.49, Nair:7.30,  Ezhava:15.11, Muslim:20.39, Christian:39.26, "SC/ST":11.37, Others:6.57  },
  Kanjirappally:      { male:48.55, female:51.45, Nair:23.92, Ezhava:12.00, Muslim:10.20, Christian:40.00, "SC/ST":9.66,  Others:4.22  },
  Pala:               { male:48.71, female:51.29, Nair:16.41, Ezhava:13.73, Muslim:1.58,  Christian:56.26, "SC/ST":8.39,  Others:3.63  },
  Thrissur:           { male:47.55, female:52.45, Nair:18.03, Ezhava:17.11, Muslim:5.20,  Christian:38.70, "SC/ST":7.85,  Others:13.11 },
  Kunnathunad:        { male:48.85, female:51.14, Nair:11.78, Ezhava:14.57, Muslim:19.70, Christian:35.40, "SC/ST":13.13, Others:5.42  },
  Palakkad:           { male:48.63, female:51.37, Nair:9.66,  Ezhava:22.08, Muslim:27.84, Christian:2.94,  "SC/ST":11.88, Others:25.60 },
  "Kozhikode North":  { male:47.41, female:52.59, Nair:14.07, Ezhava:33.16, Muslim:25.10, Christian:7.90,  "SC/ST":4.42,  Others:15.35 },
  Kasaragod:          { male:50.00, female:50.00, Nair:3.30,  Ezhava:15.00, Muslim:50.42, Christian:2.40,  "SC/ST":6.70,  Others:22.18 },
  Manjeshwaram:       { male:50.38, female:49.62, Nair:0.44,  Ezhava:12.00, Muslim:52.89, Christian:2.70,  "SC/ST":6.36,  Others:25.61 },
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

export function getCasteLabel(ac, casteWeight) {
  const acData = AC_DEMOGRAPHICS[ac];
  if (!acData) return "Others";
  const w = parseFloat(casteWeight);
  if (!w) return "Others";
  let bestLabel = "Others";
  let bestDiff = Infinity;
  for (const c of CASTES) {
    const diff = Math.abs((acData[c] || 0) / 100 - w);
    if (diff < bestDiff) { bestDiff = diff; bestLabel = c; }
  }
  return bestLabel;
}

export function getGenderLabel(ac, genderWeight) {
  const acData = AC_DEMOGRAPHICS[ac];
  if (!acData) return "Male";
  const w = parseFloat(genderWeight);
  const maleW = acData.male / 100;
  const femaleW = acData.female / 100;
  return Math.abs(maleW - w) <= Math.abs(femaleW - w) ? "Male" : "Female";
}

export function getAgeLabel(ageWeight) {
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
