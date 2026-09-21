import { useEffect, useState } from 'react'
import { supabase } from './supabase'

type Category = { id: string; name: string }
type Expense = {
  id: string
  amount: number
  note: string | null
  spent_on: string
  category_id: string | null
  category: { name: string } | null
}

const today = () => new Date().toLocaleDateString('sv-SE')

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')
  const [spentOn, setSpentOn] = useState(today())
  const [error, setError] = useState('')

  async function load() {
    const [exp, cat] = await Promise.all([
      supabase
        .from('expenses')
        .select('id, amount, note, spent_on, category_id, category:categories(name)')
        .order('spent_on', { ascending: false }),
      supabase.from('categories').select('id, name').order('name'),
    ])
    if (exp.error) return setError(exp.error.message)
    if (cat.error) return setError(cat.error.message)
    setExpenses(exp.data as unknown as Expense[])
    setCategories(cat.data)
  }

  useEffect(() => {
    load()
  }, [])

  function resetForm() {
    setEditingId(null)
    setAmount('')
    setCategoryId('')
    setNote('')
    setSpentOn(today())
  }

  function startEdit(x: Expense) {
    setEditingId(x.id)
    setAmount(String(x.amount))
    setCategoryId(x.category_id ?? '')
    setNote(x.note ?? '')
    setSpentOn(x.spent_on)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const values = {
      amount: Number(amount),
      category_id: categoryId || null,
      note: note || null,
      spent_on: spentOn,
    }
    const { error } = editingId
      ? await supabase.from('expenses').update(values).eq('id', editingId)
      : await supabase.from('expenses').insert(values)
    if (error) return setError(error.message)
    resetForm()
    load()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) return setError(error.message)
    if (editingId === id) resetForm()
    load()
  }

  return (
    <div>
      <h2>Expenses</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
        <input type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} required />
        <button type="submit">{editingId ? 'Save' : 'Add'}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
      </form>

      {error && <p>{error}</p>}

           <ul>
        {expenses.map((x) => (
          <li key={x.id}>
            {x.spent_on} · {x.category?.name ?? 'Uncategorized'} · {x.amount.toFixed(2)}
            {x.note && ` · ${x.note}`}{' '}
            <button onClick={() => startEdit(x)}>Edit</button>{' '}
            <button onClick={() => handleDelete(x.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}