const API_BASE = ''

export interface TodoItem {
  id: number
  name: string
  done: boolean
  priority: number | null
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface TodoCreateData {
  name: string
  priority?: number | null
  due_date?: string | null
}

export interface TodoUpdateData {
  name?: string
  done?: boolean
  priority?: number | null
  due_date?: string | null
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string }
    return body.detail ?? 'An error occurred'
  } catch {
    return 'An error occurred'
  }
}

export async function listTodos(): Promise<TodoItem[]> {
  const res = await fetch(`${API_BASE}/todos`)
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<TodoItem[]>
}

export async function createTodo(data: TodoCreateData): Promise<TodoItem> {
  const res = await fetch(`${API_BASE}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<TodoItem>
}

export async function updateTodo(id: number, data: TodoUpdateData): Promise<TodoItem> {
  const res = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<TodoItem>
}

export async function deleteTodo(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(await parseError(res))
}
