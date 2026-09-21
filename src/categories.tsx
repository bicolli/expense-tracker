import { useEffect, useState } from 'react'
import { supabase } from './supabase'

type Category = { id: string; name: string; color: string }

export default function Categories({ onChange }: { onChange: () => void }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3498db')
  const [error, setError] = useState('')

  async function load() {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, color')
      .order('name')
    if (error) return setError(error.message)
    setCategories(data)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('categories').insert({ name: name.trim(), color })
    if (error) return setError(error.message)
    setName('')
    await load()
    onChange()
  }

  async function handleRename(c: Category) {
    const newName = window.prompt('New name:', c.name)?.trim()
    if (!newName || newName === c.name) return
    const { error } = await supabase.from('categories').update({ name: newName }).eq('id', c.id)
    if (error) return setError(error.message)
    await load()
    onChange()
  }

  async function handleDelete(c: Category) {
    const ok = window.confirm(
      `Delete "${c.name}"? Its expenses become Uncategorized and its budget is removed.`
    )
    if (!ok) return
    const { error } = await supabase.from('categories').delete().eq('id', c.id)
    if (error) return setError(error.message)
    await load()
    onChange()
  }

  return (
    <div>
      <h2>Categories</h2>
      <form onSubmit={handleAdd}>
        <input
          placeholder="New category"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <button type="submit">Add</button>
      </form>

      {error && <p>{error}</p>}

      <ul>
        {categories.map((c) => (
          <li key={c.id}>
            <span style={{ color: c.color }}>●</span> {c.name}{' '}
            <button onClick={() => handleRename(c)}>Rename</button>{' '}
            <button onClick={() => handleDelete(c)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}