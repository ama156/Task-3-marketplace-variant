import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { title: '', description: '', price: 0, category: 'other', condition: 'used', status: 'active' }

export default function ListingForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setForm(defaults)
    setError('')
    setLoadFailed(false)
    setLoading(Boolean(id))
    if (!id) return

    async function loadListing() {
      try {
        const res = await api.get('/listings/' + id)
        const listing = res.data.listing
        if (!cancelled) {
          setForm({
            title: listing.title,
            description: listing.description ?? '',
            price: listing.price,
            category: listing.category,
            condition: listing.condition,
            status: listing.status
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Could not load listing')
          setLoadFailed(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadListing()
    return () => { cancelled = true }
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'price' ? Number(value) : value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (loading || saving || loadFailed) return
    setError('')
    setSaving(true)
    try {
      if (id) await api.patch('/listings/' + id, form)
      else await api.post('/listings', form)
      nav('/listings')
    } catch (err) {
      setError(err?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'New'} Listing</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <fieldset disabled={loading || saving || loadFailed} className="space-y-3">
          <input className="input" name="title" aria-label="Title" placeholder="Title" required minLength={2} value={form.title} onChange={onChange} />
          <input className="input" name="price" aria-label="Price" type="number" min="0" step="any" required value={form.price} onChange={onChange} />
          <select className="input" name="category" aria-label="Category" value={form.category} onChange={onChange}>
            <option value="textbooks">Textbooks</option>
            <option value="electronics">Electronics</option>
            <option value="furniture">Furniture</option>
            <option value="clothing">Clothing</option>
            <option value="other">Other</option>
          </select>
          <select className="input" name="condition" aria-label="Condition" value={form.condition} onChange={onChange}>
            <option value="new">New</option>
            <option value="like-new">Like new</option>
            <option value="used">Used</option>
            <option value="worn">Worn</option>
          </select>
          {id && (
            <select className="input" name="status" aria-label="Status" value={form.status} onChange={onChange}>
              <option value="active">Active</option>
              <option value="sold">Sold</option>
            </select>
          )}
          <textarea className="input" name="description" aria-label="Description" placeholder="Description (optional)" rows={3} value={form.description} onChange={onChange} />
          <button className="btn" type="submit">{saving ? 'Saving…' : 'Save'}</button>
        </fieldset>
        {loading && <p className="text-sm text-zinc-600" role="status">Loading listing…</p>}
        {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
      </form>
    </div>
  )
}
