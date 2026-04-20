import { Workbook } from '@node-projects/excelforge';

/** Hard cap to prevent browser OOM and Excel row limits (xlsx max is ~1M). */
export const EXPORT_MAX_ROWS = 50_000;
/** Page size used when paginating through API for full export. */
export const EXPORT_PAGE_SIZE = 500;

export interface ExportColumn {
  key: string;
  header: string;
  transform?: (value: any, row: any) => string | number;
}

/** Synchronously export the supplied (already-loaded) array. */
export async function exportToExcel(
  data: Record<string, any>[],
  columns: ExportColumn[],
  filename: string,
): Promise<void> {
  if (data.length > EXPORT_MAX_ROWS) {
    throw new Error(`Refusing to export ${data.length.toLocaleString()} rows (max ${EXPORT_MAX_ROWS.toLocaleString()}).`);
  }

  const wb = new Workbook();
  const ws = wb.addSheet('Data');

  // Set Headers
  columns.forEach((col, colIndex) => {
    ws.setValue(1, colIndex + 1, col.header);
    // Rough column width calculation
    ws.setColumnWidth(colIndex + 1, Math.max(col.header.length + 2, 15));
  });

  // Set Data
  data.forEach((row, rowIndex) => {
    columns.forEach((col, colIndex) => {
      const value = col.key.split('.').reduce((obj, k) => obj?.[k], row);
      const rawValue = col.transform ? col.transform(value, row) : (value ?? '-');
      
      // Ensure the value is a valid CellValue (string, number, boolean, Date, null, undefined)
      let cellValue: any = rawValue;
      if (typeof rawValue === 'object' && !(rawValue instanceof Date) && rawValue !== null) {
        cellValue = JSON.stringify(rawValue);
      }
      
      ws.setValue(rowIndex + 2, colIndex + 1, cellValue);
    });
  });

  // Generate and download directly using ExcelForge's browser method
  await wb.download(`${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Fetch ALL pages from the server, then export. Use this for tables with pagination
 * so the user gets the full dataset, not just the visible page.
 *
 * @param fetchPage  function that takes (page, limit) and returns a Promise resolving to
 *                   `{ items: any[], meta: { total, totalPages } }` (or the same shape under .data.data)
 */
export async function exportAllPages(
  fetchPage: (page: number, limit: number) => Promise<any>,
  columns: ExportColumn[],
  filename: string,
  baseFilters: Record<string, any> = {},
): Promise<void> {
  const all: any[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    if (all.length >= EXPORT_MAX_ROWS) {
      throw new Error(
        `Dataset exceeds export limit (${EXPORT_MAX_ROWS.toLocaleString()} rows). Apply filters and try again.`,
      );
    }

    const res = await fetchPage(page, EXPORT_PAGE_SIZE);
    // Normalize various API envelope shapes (axios → backend wrapper)
    const payload = res?.data?.data ?? res?.data ?? res;
    const items: any[] = payload?.items ?? payload ?? [];
    const meta = payload?.meta ?? {};

    all.push(...items);
    totalPages = Number(meta.totalPages) || 1;
    page += 1;

    // Safety: break if API returns empty page unexpectedly
    if (items.length === 0) break;
  }

  if (all.length === 0) {
    throw new Error('No data to export.');
  }

  await exportToExcel(all, columns, filename);
  // baseFilters is documented for the caller's convenience; passed through fetchPage closure
  void baseFilters;
}
