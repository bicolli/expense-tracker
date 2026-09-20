import { useEffect, useState } from 'react'
import { supabase } from './supabase'

type Category = { id: string; name: string }
type Expense = {
  id: string
  amount: number
  note: string | null
  spent_on: string
  category: { name: string } | null
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')
  const [spentOn, setSpentOn] = useState(new Date().toLocaleDateString('sv-SE'))
  const [error, setError] = useState('')

  async function load() {
    const [exp, cat] = await Promise.all([
      supabase
        .from('expenses')
        .select('id, amount, note, spent_on, category:categories(name)')
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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('expenses').insert({
      amount: Number(amount),
      category_id: categoryId || null,
      note: note || null,
      spent_on: spentOn,
    })
    if (error) return setError(error.message)
    setAmount('')
    setNote('')
    load()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) return setError(error.message)
    load()
  }

  return (
    <div>
      <form onSubmit={handleAdd}>
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
        <input
          placeholder="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <input
          type="date"
          value={spentOn}
          onChange={(e) => setSpentOn(e.target.value)}
          required
        />
        <button type="submit">Add</button>
      </form>

      {error && <p>{error}</p>}

      <ul>
        {expenses.map((x) => (
          <li key={x.id}>
            {x.spent_on} · {x.category?.name ?? 'Uncategorized'} · {x.amount.toFixed(2)}
            {x.note && ` · ${x.note}`}{' '}
            <button onClick={() => handleDelete(x.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}