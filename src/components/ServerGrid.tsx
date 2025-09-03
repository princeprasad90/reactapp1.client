import React from 'react';
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { apiFetch } from '../services/api';

interface Item {
  id: number;
  name: string;
}

const ServerGrid: React.FC = () => {
  const [data, setData] = React.useState<Item[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  const columns = React.useMemo<ColumnDef<Item>[]>(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Name' },
    ],
    []
  );

  React.useEffect(() => {
    apiFetch(`/api/items?page=${page}&pageSize=5`)
      .then(res => {
        setData(res.data.items);
        setTotal(res.data.totalCount);
      });
  }, [page]);

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div>
      <table>
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(header => (
                <th key={header.id}>{header.column.columnDef.header as string}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>{cell.getValue() as any}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
        Prev
      </button>
      <button disabled={page * 5 >= total} onClick={() => setPage(p => p + 1)}>
        Next
      </button>
    </div>
  );
};

export default ServerGrid;
