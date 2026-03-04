/**
 * Convert a number to Hindi words
 */
export function convertToHindi(num: number): string {
  if (num === 0 || Number.isNaN(num)) return "शून्य";

  const units = ["", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ"];
  const teens = [
    "दस",
    "ग्यारह",
    "बारह",
    "तेरह",
    "चौदह",
    "पंद्रह",
    "सोलह",
    "सत्रह",
    "अठारह",
    "उन्नीस",
  ];
  const tens = [
    "",
    "",
    "बीस",
    "तीस",
    "चालीस",
    "पचास",
    "साठ",
    "सत्तर",
    "अस्सी",
    "नब्बे",
  ];

  function toWords(n: number): string {
    if (n === 0) return "";
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return `${tens[ten]}${unit > 0 ? ` ${units[unit]}` : ""}`;
  }

  let remaining = num;
  let str = "";

  if (remaining >= 10000000) {
    str += `${toWords(Math.floor(remaining / 10000000))} करोड़ `;
    remaining %= 10000000;
  }
  if (remaining >= 100000) {
    str += `${toWords(Math.floor(remaining / 100000))} लाख `;
    remaining %= 100000;
  }
  if (remaining >= 1000) {
    str += `${toWords(Math.floor(remaining / 1000))} हजार `;
    remaining %= 1000;
  }
  if (remaining >= 100) {
    str += `${toWords(Math.floor(remaining / 100))} सौ `;
    remaining %= 100;
  }
  if (remaining > 0) {
    str += toWords(remaining);
  }

  return str.trim();
}
