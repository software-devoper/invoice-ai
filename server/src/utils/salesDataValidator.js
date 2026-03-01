const REQUIRED_ERROR_MESSAGE = "Provide only customer sales data to generate invoices.";

const FIELD_ALIASES = {
  name: ["customername", "name", "customer", "clientname", "buyername"],
  email: ["customeremail", "email", "clientemail", "buyeremail"],
  product: ["productname", "product", "item", "description", "service"],
  quantity: ["quantity", "qty", "units", "count"],
  price: ["price", "unitprice", "amount", "rate", "cost"],
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const findBestHeader = (headers, aliases) => {
  for (const header of headers) {
    const normalizedHeader = normalizeText(header);
    for (const alias of aliases) {
      if (
        normalizedHeader === alias ||
        normalizedHeader.includes(alias) ||
        alias.includes(normalizedHeader)
      ) {
        return header;
      }
    }
  }
  return null;
};

const toNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  const cleaned = String(value || "").replace(/[^0-9.-]/g, "");
  return Number(cleaned);
};

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim().toLowerCase());

const analyzeSalesData = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { valid: false, message: REQUIRED_ERROR_MESSAGE };
  }

  const headers = Object.keys(rows[0] || {});
  if (!headers.length) {
    return { valid: false, message: REQUIRED_ERROR_MESSAGE };
  }

  const columnMap = {
    name: findBestHeader(headers, FIELD_ALIASES.name),
    email: findBestHeader(headers, FIELD_ALIASES.email),
    product: findBestHeader(headers, FIELD_ALIASES.product),
    quantity: findBestHeader(headers, FIELD_ALIASES.quantity),
    price: findBestHeader(headers, FIELD_ALIASES.price),
  };

  const missingColumns = Object.entries(columnMap)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingColumns.length > 0) {
    return {
      valid: false,
      message: REQUIRED_ERROR_MESSAGE,
      missingColumns,
    };
  }

  const cleanedRows = [];
  const invalidRows = [];

  rows.forEach((row, index) => {
    const name = String(row[columnMap.name] || "").trim();
    const email = String(row[columnMap.email] || "")
      .trim()
      .toLowerCase();
    const product = String(row[columnMap.product] || "").trim();
    const quantity = toNumber(row[columnMap.quantity]);
    const price = toNumber(row[columnMap.price]);

    const validRow =
      Boolean(name) &&
      isValidEmail(email) &&
      Boolean(product) &&
      Number.isFinite(quantity) &&
      quantity > 0 &&
      Number.isFinite(price) &&
      price >= 0;

    if (!validRow) {
      invalidRows.push(index + 2); // +2 because header row is line 1
      return;
    }

    cleanedRows.push({
      name,
      email,
      product,
      quantity,
      price,
    });
  });

  const validRatio = cleanedRows.length / rows.length;
  const qualityThreshold = 0.6;

  if (cleanedRows.length === 0 || validRatio < qualityThreshold) {
    return {
      valid: false,
      message: REQUIRED_ERROR_MESSAGE,
      invalidRows,
    };
  }

  return {
    valid: true,
    cleanedRows,
    invalidRows,
    validRatio,
  };
};

module.exports = { analyzeSalesData, REQUIRED_ERROR_MESSAGE };

