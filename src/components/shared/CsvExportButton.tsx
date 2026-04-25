'use client'

import { Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ColumnDef<T> {
  header: string
  accessor: keyof T | ((row: T) => string | number | null | undefined)
}

interface CsvExportButtonProps<T> {
  data: T[]
  filename?: string
  columns: ColumnDef<T>[]
  label?: string
  disabled?: boolean
  className?: string
}

function toCsv<T>(data: T[], columns: ColumnDef<T>[]): string {
  const headers = columns.map((c) => `"${c.header}"`).join(',')
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value =
          typeof col.accessor === 'function'
            ? col.accessor(row)
            : row[col.accessor]
        const str = value == null ? '' : String(value)
        // Escape double quotes and wrap in quotes
        return `"${str.replace(/"/g, '""')}"`
      })
      .join(',')
  )
  return [headers, ...rows].join('\n')
}

export function CsvExportButton<T>({
  data,
  filename = 'export',
  columns,
  label = 'Exporter CSV',
  disabled = false,
  className,
}: CsvExportButtonProps<T>) {
  function handleExport() {
    if (!data.length) return
    const csv = toCsv(data, columns)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={disabled || !data.length}
      className={cn(
        'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors',
        'text-[#30373E] bg-white border border-[#03182F]/15 hover:bg-[#F2F8FF] hover:border-[#2764FF]/30',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        className
      )}
    >
      <Download className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}
