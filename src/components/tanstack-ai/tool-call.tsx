'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  IconCircleCheck,
  IconChevronDown,
  IconCircle,
  IconTool,
  IconCircleX,
  IconLoader2,
} from '@tabler/icons-react'
import type { ToolCall, ToolCallState } from './types'

// ============================================================================
// Tool Call Container
// ============================================================================

export interface ToolCallDisplayProps extends React.ComponentProps<
  typeof Collapsible
> {
  /** The tool call data */
  toolCall: ToolCall
}

export function ToolCallDisplay({
  toolCall,
  className,
  ...props
}: ToolCallDisplayProps) {
  return (
    <Collapsible
      className={cn('group not-prose mb-4 w-full rounded-md border', className)}
      {...props}
    >
      <ToolCallHeader name={toolCall.name} state={toolCall.state} />
      <ToolCallContent>
        <ToolCallInput input={toolCall.args} />
        {(toolCall.state === 'completed' || toolCall.state === 'error') && (
          <ToolCallOutput output={toolCall.result} error={toolCall.error} />
        )}
      </ToolCallContent>
    </Collapsible>
  )
}

// ============================================================================
// Tool Call Header
// ============================================================================

export interface ToolCallHeaderProps extends React.HTMLAttributes<HTMLButtonElement> {
  /** Tool name */
  name: string
  /** Tool state */
  state: ToolCallState
}

const getStatusBadge = (state: ToolCallState) => {
  const labels: Record<ToolCallState, string> = {
    pending: 'Pendiente',
    executing: 'Ejecutando',
    completed: 'Completado',
    error: 'Error',
    cancelled: 'Cancelado',
  }

  const icons: Record<ToolCallState, React.ReactNode> = {
    pending: <IconCircle className="size-3.5" />,
    executing: <IconLoader2 className="size-3.5 animate-spin" />,
    completed: <IconCircleCheck className="size-3.5 text-green-600" />,
    error: <IconCircleX className="size-3.5 text-red-600" />,
    cancelled: <IconCircleX className="size-3.5 text-orange-600" />,
  }

  const variants: Record<
    ToolCallState,
    'default' | 'secondary' | 'destructive'
  > = {
    pending: 'secondary',
    executing: 'secondary',
    completed: 'default',
    error: 'destructive',
    cancelled: 'secondary',
  }

  return (
    <Badge className="gap-1.5 rounded-full text-xs" variant={variants[state]}>
      {icons[state]}
      {labels[state]}
    </Badge>
  )
}

// Human-readable tool names
const toolDisplayNames: Record<string, string> = {
  createSpreadsheet: 'Crear hoja de cálculo',
  addData: 'Agregar datos',
  applyFormula: 'Aplicar fórmula',
  formatCells: 'Formatear celdas',
  sortData: 'Ordenar datos',
  filterData: 'Filtrar datos',
  createChart: 'Crear gráfico',
  insertPivotTable: 'Insertar tabla dinámica',
  calculateStats: 'Calcular estadísticas',
}

export function ToolCallHeader({
  className,
  name,
  state,
  ...props
}: ToolCallHeaderProps) {
  const displayName = toolDisplayNames[name] || name

  return (
    <CollapsibleTrigger
      className={cn(
        'flex w-full items-center justify-between gap-4 p-3',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <IconTool className="size-3.5 text-muted-foreground" />
        <span className="font-medium text-sm">{displayName}</span>
        {getStatusBadge(state)}
      </div>
      <IconChevronDown className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
  )
}

// ============================================================================
// Tool Call Content
// ============================================================================

export interface ToolCallContentProps extends React.ComponentProps<
  typeof CollapsibleContent
> {}

export function ToolCallContent({ className, ...props }: ToolCallContentProps) {
  return (
    <CollapsibleContent
      className={cn(
        'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
        className,
      )}
      {...props}
    />
  )
}

// ============================================================================
// Tool Call Input
// ============================================================================

export interface ToolCallInputProps extends React.HTMLAttributes<HTMLDivElement> {
  input: unknown
}

export function ToolCallInput({
  className,
  input,
  ...props
}: ToolCallInputProps) {
  return (
    <div className={cn('space-y-2 overflow-hidden p-4', className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Parámetros
      </h4>
      <div className="rounded-md bg-muted/50 p-3">
        <pre className="text-xs overflow-x-auto">
          {JSON.stringify(input, null, 2)}
        </pre>
      </div>
    </div>
  )
}

// ============================================================================
// Tool Call Output
// ============================================================================

export interface ToolCallOutputProps extends React.HTMLAttributes<HTMLDivElement> {
  output?: unknown
  error?: string
}

export function ToolCallOutput({
  className,
  output,
  error,
  ...props
}: ToolCallOutputProps) {
  if (!output && !error) {
    return null
  }

  return (
    <div className={cn('space-y-2 p-4 pt-0', className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {error ? 'Error' : 'Resultado'}
      </h4>
      <div
        className={cn(
          'overflow-x-auto rounded-md p-3 text-xs',
          error
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted/50 text-foreground',
        )}
      >
        {error ? (
          <p>{error}</p>
        ) : (
          <pre>
            {typeof output === 'string'
              ? output
              : JSON.stringify(output, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Tool Call List (for multiple tool calls)
// ============================================================================

export interface ToolCallListProps extends React.HTMLAttributes<HTMLDivElement> {
  toolCalls: ToolCall[]
}

export function ToolCallList({
  toolCalls,
  className,
  ...props
}: ToolCallListProps) {
  if (!toolCalls || toolCalls.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)} {...props}>
      {toolCalls.map((toolCall) => (
        <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
      ))}
    </div>
  )
}
