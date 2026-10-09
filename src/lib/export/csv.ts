export interface ExportMetadata {
  generatedAt: string;
  dataSource: string;
  dateRange?: string;
  workspaceId?: string;
  filters?: Record<string, string | number | boolean>;
}

export interface CsvColumn<T> {
  header: string;
  accessor: (item: T) => string | number | boolean | null | undefined;
}

/**
 * Sanitizes a cell string to prevent spreadsheet formula injection attacks (CSV injection).
 */
function sanitizeCell(value: any): string {
  if (value === null || value === undefined) return "";
  let str = String(value);

  // If cell starts with formula trigger characters, prefix with single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape internal double quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generates an RFC 4180 compliant CSV string with a standardized metadata header block
 * conforming strictly to Rule 33 of AGENTS.md.
 */
export function generateCsvWithMetadata<T>(
  data: T[],
  columns: CsvColumn<T>[],
  metadata: ExportMetadata
): string {
  const lines: string[] = [];

  // 1. Standard Metadata Block (Rule 33)
  lines.push(`# CreatorPulse Export`);
  lines.push(`# Generated At: ${metadata.generatedAt}`);
  lines.push(`# Data Source: ${metadata.dataSource}`);
  lines.push(`# Date Range: ${metadata.dateRange || "All Available"}`);
  lines.push(`# Workspace: ${metadata.workspaceId || "Default Workspace"}`);
  if (metadata.filters && Object.keys(metadata.filters).length > 0) {
    const filterStr = Object.entries(metadata.filters)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    lines.push(`# Filters: ${filterStr}`);
  }
  lines.push(""); // Empty line separating metadata from data table

  // 2. Table Column Headers
  lines.push(columns.map((c) => sanitizeCell(c.header)).join(","));

  // 3. Table Rows
  data.forEach((item) => {
    const row = columns.map((c) => sanitizeCell(c.accessor(item)));
    lines.push(row.join(","));
  });

  return lines.join("\r\n");
}
