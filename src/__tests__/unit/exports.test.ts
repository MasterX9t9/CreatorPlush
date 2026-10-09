import { describe, it, expect } from "vitest";
import { generateCsvWithMetadata, CsvColumn, ExportMetadata } from "@/lib/export/csv";

describe("CSV Export Service Unit Tests", () => {
  interface SampleRow {
    id: string;
    title: string;
    views: number;
    multiplier: number;
  }

  const sampleData: SampleRow[] = [
    { id: "v1", title: "Video Alpha", views: 120000, multiplier: 3.5 },
    { id: "v2", title: "Video Beta, The Sequel", views: 45000, multiplier: 1.2 },
    { id: "v3", title: "=SUM(A1:A10)", views: 1000, multiplier: 0.8 }, // Formula injection test
  ];

  const columns: CsvColumn<SampleRow>[] = [
    { header: "Video ID", accessor: (r) => r.id },
    { header: "Title", accessor: (r) => r.title },
    { header: "Views", accessor: (r) => r.views },
    { header: "Outlier Multiplier", accessor: (r) => `${r.multiplier}x` },
  ];

  const metadata: ExportMetadata = {
    generatedAt: "2026-10-09T12:00:00Z",
    dataSource: "youtube_data_api",
    dateRange: "Last 30 Days",
    workspaceId: "ws_default_123",
    filters: { minViews: 10000, tier: "outliers" },
  };

  it("includes all Rule 33 required metadata headers in the output", () => {
    const csv = generateCsvWithMetadata(sampleData, columns, metadata);

    expect(csv).toContain("# CreatorPulse Export");
    expect(csv).toContain("# Generated At: 2026-10-09T12:00:00Z");
    expect(csv).toContain("# Data Source: youtube_data_api");
    expect(csv).toContain("# Date Range: Last 30 Days");
    expect(csv).toContain("# Workspace: ws_default_123");
    expect(csv).toContain("# Filters: minViews=10000; tier=outliers");
  });

  it("formats CSV table columns and rows adhering to RFC 4180", () => {
    const csv = generateCsvWithMetadata(sampleData, columns, metadata);

    // Headers
    expect(csv).toContain("Video ID,Title,Views,Outlier Multiplier");
    // Row with comma in title should be quoted
    expect(csv).toContain('"Video Beta, The Sequel"');
    // Formula starting with '=' must be escaped with single quote
    expect(csv).toContain("'=SUM(A1:A10)");
  });
});
