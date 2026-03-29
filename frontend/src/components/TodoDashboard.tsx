import { useEffect, useState } from 'react'
import type { Theme } from '../App'
import {
  createTodo,
  deleteTodo,
  listTodos,
  updateTodo,
  type TodoItem,
} from '../api/todos'

type SortField = 'created_at' | 'due_date' | 'priority'
type SortDir = 'asc' | 'desc'

const DATE_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const DATETIME_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

function formatDate(iso: string) {
  return DATE_FMT.format(new Date(iso + 'T00:00:00'))
}

function daysUntil(iso: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(iso + 'T00:00:00')
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'today'
  if (diff === 1) return '1 day'
  if (diff === -1) return '1 day ago'
  if (diff < 0) return `${Math.abs(diff)} days ago`
  return `${diff} days`
}

function formatDateTime(iso: string) {
  return DATETIME_FMT.format(new Date(iso))
}

const PRIORITY_CONFIG: Record<number, { label: string; className: string }> = {
  0: { label: 'Urgent', className: 'has-background-danger-light' },
  1: { label: 'High', className: 'has-background-warning-light' },
  2: { label: 'Medium', className: 'has-background-info-light' },
  3: { label: 'Low', className: 'has-background-success-light' },
}

function PriorityTag({ priority }: { priority: number | null }) {
  if (priority === null) return <span className="has-text-grey-light">—</span>
  const cfg = PRIORITY_CONFIG[priority]
  return <span className={`tag ${cfg.className}`}>{cfg.label}</span>
}

interface EditingCell {
  id: number
  field: 'name' | 'due_date' | 'priority'
}

export default function TodoDashboard({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [showDone, setShowDone] = useState(false)
  const [sortBy, setSortBy] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [fadingIds, setFadingIds] = useState<Set<number>>(new Set())
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())

  const [newName, setNewName] = useState('')
  const [newPriority, setNewPriority] = useState<number | null>(null)
  const [newDueDate, setNewDueDate] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [addLoading, setAddLoading] = useState(false)

  useEffect(() => {
    listTodos().then(setTodos).catch(() => undefined)
  }, [])

  const sorted = [...todos].sort((a, b) => {
    const valA = a[sortBy] ?? ''
    const valB = b[sortBy] ?? ''
    const cmp = valA < valB ? -1 : valA > valB ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })
  const activeTodos = sorted.filter((t) => !t.done)
  const doneTodos = sorted.filter((t) => t.done)

  const handleSortClick = (col: SortField) => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAddError(null)
    setAddLoading(true)
    try {
      const todo = await createTodo({
        name: newName,
        priority: newPriority,
        due_date: newDueDate || null,
      })
      setTodos((prev) => [todo, ...prev])
      setNewName('')
      setNewPriority(null)
      setNewDueDate('')
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add todo')
    } finally {
      setAddLoading(false)
    }
  }

  const handleToggleDone = async (todo: TodoItem) => {
    const updated = await updateTodo(todo.id, { done: !todo.done })
    if (updated.done) {
      setCheckedIds((prev) => new Set(prev).add(todo.id))
      setTimeout(() => {
        setFadingIds((prev) => new Set(prev).add(todo.id))
        setTimeout(() => {
          setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)))
          setCheckedIds((prev) => { const s = new Set(prev); s.delete(todo.id); return s })
          setFadingIds((prev) => { const s = new Set(prev); s.delete(todo.id); return s })
        }, 400)
      }, 200)
    } else {
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)))
    }
  }

  const handleDelete = async (id: number) => {
    await deleteTodo(id)
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const handleCellClick = (id: number, field: 'name' | 'due_date' | 'priority') => {
    setEditingCell({ id, field })
  }

  const handlePriorityChange = async (todo: TodoItem, value: string) => {
    setEditingCell(null)
    const priority = value === '' ? null : Number(value)
    if (priority === todo.priority) return
    const updated = await updateTodo(todo.id, { priority })
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)))
  }

  const handleCellSave = async (
    todo: TodoItem,
    field: 'name' | 'due_date',
    value: string,
  ) => {
    setEditingCell(null)
    if (field === 'name' && value.trim() === todo.name) return
    if (field === 'due_date' && value === (todo.due_date ?? '')) return
    const updated = await updateTodo(todo.id, { [field]: value || null })
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)))
  }

  const SortHeader = ({ col, label }: { col: SortField; label: string }) => (
    <th style={{ cursor: 'pointer' }} onClick={() => handleSortClick(col)}>
      {label} {sortBy === col ? (sortDir === 'asc' ? '▲' : '▼') : ''}
    </th>
  )

  const TodoRow = ({ todo, dimmed }: { todo: TodoItem; dimmed?: boolean }) => (
    <tr
style={{
        opacity: fadingIds.has(todo.id) ? 0 : 1,
        transition: 'opacity 0.4s',
        color: dimmed === true ? 'inherit' : undefined,
      }}
    >
      <td style={{ verticalAlign: 'middle', width: '1%' }}>
        <input
          type="checkbox"
          className="todo-check"
          checked={todo.done || checkedIds.has(todo.id)}
          onChange={() => void handleToggleDone(todo)}
        />
      </td>
      <td style={{ verticalAlign: 'middle' }}>
        {editingCell?.id === todo.id && editingCell.field === 'name' ? (
          <input
            className="input is-small"
            defaultValue={todo.name}
            autoFocus
            onBlur={(e) => void handleCellSave(todo, 'name', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') setEditingCell(null)
            }}
          />
        ) : (
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => handleCellClick(todo.id, 'name')}
          >
            {todo.name}
          </span>
        )}
      </td>
      <td style={{ verticalAlign: 'middle' }}>
        {editingCell?.id === todo.id && editingCell.field === 'priority' ? (
          <div className="select is-small">
            <select
              defaultValue={todo.priority ?? ''}
              autoFocus
              onChange={(e) => void handlePriorityChange(todo, e.target.value)}
              onBlur={() => setEditingCell(null)}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditingCell(null) }}
            >
              <option value="">None</option>
              <option value="0">0 — Urgent</option>
              <option value="1">1 — High</option>
              <option value="2">2 — Medium</option>
              <option value="3">3 — Low</option>
            </select>
          </div>
        ) : (
          <span style={{ cursor: 'pointer' }} onClick={() => handleCellClick(todo.id, 'priority')}>
            <PriorityTag priority={todo.priority} />
          </span>
        )}
      </td>
      <td style={{ verticalAlign: 'middle' }}>
        {editingCell?.id === todo.id && editingCell.field === 'due_date' ? (
          <input
            className="input is-small"
            type="date"
            defaultValue={todo.due_date ?? ''}
            autoFocus
            onBlur={(e) => void handleCellSave(todo, 'due_date', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') setEditingCell(null)
            }}
          />
        ) : (
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => handleCellClick(todo.id, 'due_date')}
          >
            {todo.due_date
              ? `${formatDate(todo.due_date)} (${daysUntil(todo.due_date)})`
              : <span className="has-text-grey-light">—</span>}
          </span>
        )}
      </td>
      <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
        {formatDateTime(todo.created_at)}
      </td>
      <td style={{ verticalAlign: 'middle' }}>
        <button
          className="delete"
          onClick={() => void handleDelete(todo.id)}
          title="Delete"
        />
      </td>
    </tr>
  )

  const tableHead = (
    <thead>
      <tr>
        <th></th>
        <th>Name</th>
        <SortHeader col="priority" label="Priority" />
        <SortHeader col="due_date" label="Due Date" />
        <SortHeader col="created_at" label="Created" />
        <th></th>
      </tr>
    </thead>
  )

  return (
    <section className="section">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="mb-4">
          <h1 className="title mb-0">Todo List</h1>
          <button className="button is-small is-light" onClick={onToggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>

        {/* Add form */}
        <form onSubmit={(e) => void handleAdd(e)} className="mb-5">
          <div className="field is-grouped is-grouped-multiline">
            <div className="control is-expanded">
              <input
                className="input"
                type="text"
                placeholder="What needs to be done?"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="control">
              <div className="select">
                <select
                  value={newPriority ?? ''}
                  onChange={(e) =>
                    setNewPriority(e.target.value === '' ? null : Number(e.target.value))
                  }
                >
                  <option value="">Priority</option>
                  <option value="0">0 — Urgent</option>
                  <option value="1">1 — High</option>
                  <option value="2">2 — Medium</option>
                  <option value="3">3 — Low</option>
                </select>
              </div>
            </div>
            <div className="control">
              <input
                className="input"
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
            </div>
            <div className="control">
              <button
                className={`button is-primary${addLoading ? ' is-loading' : ''}`}
                type="submit"
                disabled={addLoading}
              >
                Add
              </button>
            </div>
          </div>
          {addError !== null && (
            <p className="help is-danger">{addError}</p>
          )}
        </form>

        {/* Active todos table */}
        {activeTodos.length === 0 ? (
          <p className="has-text-grey">No active todos.</p>
        ) : (
          <div className="table-container">
            <table className="table is-fullwidth is-hoverable">
              {tableHead}
              <tbody>
                {activeTodos.map((todo) => (
                  <TodoRow key={todo.id} todo={todo} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Show/hide done */}
        <button
          className="button is-small is-light mt-4"
          onClick={() => setShowDone((s) => !s)}
        >
          {showDone ? 'Hide' : 'Show'} completed ({doneTodos.length})
        </button>

        {showDone && doneTodos.length > 0 && (
          <div className="mt-4">
            <h2 className="subtitle has-text-grey">Completed</h2>
            <div className="table-container">
              <table className="table is-fullwidth has-text-grey-light">
                {tableHead}
                <tbody>
                  {doneTodos.map((todo) => (
                    <TodoRow key={todo.id} todo={todo} dimmed />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
