function escTag(v: string): string {
  return v
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/=/g, "\\=")
    .replace(/ /g, "\\ ");
}

function escMeasurement(v: string): string {
  return v.replace(/,/g, "\\,").replace(/ /g, "\\ ");
}

export function toLineProtocol(params: {
  measurement: string;
  tags: Record<string, string | undefined>;
  fields: Record<string, number>;
  timestamp?: number; // ms by default (if precision=ms)
}): string {
  const measurement = escMeasurement(params.measurement);

  const tagStr = Object.entries(params.tags)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${escTag(String(v))}`)
    .join(",");

  const fieldStr = Object.entries(params.fields)
    .map(([k, v]) => {
      const isInt = Number.isInteger(v) && k !== "passrate";
      return `${k}=${isInt ? `${v}i` : `${v}`}`;
    })
    .join(",");

  const head = tagStr ? `${measurement},${tagStr}` : measurement;
  const ts = params.timestamp !== undefined ? ` ${params.timestamp}` : "";
  return `${head} ${fieldStr}${ts}`;
}
