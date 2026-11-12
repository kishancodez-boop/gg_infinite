import type { ReactNode } from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  emptyMessage?: string;
  caption?: string;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  emptyMessage = 'No records available yet.',
  caption,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#DCE6DF] bg-white">
      <table className="w-full text-left border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="bg-[#F5F8F5] border-b border-[#DCE6DF] text-xs font-semibold uppercase tracking-wider text-[#64736B]">
            {columns.map((col) => (
              <th key={col.key} scope="col" className={`px-4 py-3 ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#DCE6DF]">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-[#64736B]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                className="hover:bg-[#F5F8F5]/60 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-[#17231F] align-middle ${col.className ?? ''}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

