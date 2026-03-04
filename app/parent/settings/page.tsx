'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFamily } from '@/context/FamilyContext'
import { useLocale } from '@/context/LocaleContext'
import { clearStore } from '@/lib/store'
import type { Category } from '@/types'

export default function SettingsPage() {
  const router = useRouter()
  const {
    store,
    updateFamilyName,
    addCategory,
    removeCategory,
  } = useFamily()
  const { locale, setLocale, t } = useLocale()

  const [editingName, setEditingName] = useState(false)
  const [familyNameDraft, setFamilyNameDraft] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('📚')
  const [newCatName, setNewCatName] = useState('')
  const [showAddCat, setShowAddCat] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    if (!store.family) router.replace('/')
  }, [store.family, router])

  if (!store.family) return null

  function startEditName() {
    setFamilyNameDraft(store.family!.name)
    setEditingName(true)
  }

  function saveFamilyName() {
    if (familyNameDraft.trim()) updateFamilyName(familyNameDraft.trim())
    setEditingName(false)
  }

  function handleAddCategory() {
    if (!newCatName.trim()) return
    addCategory({ name: newCatName.trim(), icon: newCatEmoji })
    setNewCatName('')
    setNewCatEmoji('📚')
    setShowAddCat(false)
  }

  function handleDeleteCategory(cat: Category) {
    const usedByAction = store.actions.some(a => a.categoryId === cat.id)
    if (usedByAction) {
      alert(`"${cat.name}" is used by one or more actions. Archive those actions first before removing this category.`)
      return
    }
    if (confirm(`Remove category "${cat.name}"?`)) {
      removeCategory(cat.id)
    }
  }

  function handleReset() {
    clearStore()
    window.location.href = '/setup'
  }

  return (
    <main className="p-5 max-w-lg mx-auto pb-28">
      <header className="pt-4 mb-6">
        <h1 className="text-2xl font-bold text-ink-primary">Settings</h1>
      </header>

      {/* Family name */}
      <section className="bg-white rounded-2xl p-5 shadow-card mb-5">
        <h2 className="text-sm font-semibold text-brand uppercase tracking-wide mb-3">Family</h2>
        {editingName ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={familyNameDraft}
              onChange={e => setFamilyNameDraft(e.target.value)}
              className="flex-1 rounded-xl border-2 border-line px-3 py-2 text-ink-primary outline-none focus:border-brand"
              onKeyDown={e => { if (e.key === 'Enter') saveFamilyName() }}
            />
            <button
              onClick={saveFamilyName}
              className="px-4 py-2 rounded-xl bg-brand text-white font-bold hover:bg-brand-hover transition-colors text-sm"
            >
              Save
            </button>
            <button
              onClick={() => setEditingName(false)}
              className="px-3 py-2 rounded-xl text-ink-muted text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-ink-primary font-bold text-lg">{store.family.name}</p>
            <button
              onClick={startEditName}
              className="text-sm text-ink-muted hover:text-ink-secondary transition-colors"
            >
              Edit
            </button>
          </div>
        )}
      </section>

      {/* Language */}
      <section className="bg-white rounded-2xl p-5 shadow-card mb-5">
        <h2 className="text-sm font-semibold text-brand uppercase tracking-wide mb-3">{t('settings.language')}</h2>
        <div className="flex rounded-xl overflow-hidden border-2 border-line-subtle">
          <button
            onClick={() => setLocale('en')}
            className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
              locale === 'en' ? 'bg-brand text-white' : 'text-brand hover:bg-page'
            }`}
          >
            {t('settings.lang.en')}
          </button>
          <button
            onClick={() => setLocale('zh')}
            className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
              locale === 'zh' ? 'bg-brand text-white' : 'text-brand hover:bg-page'
            }`}
          >
            {t('settings.lang.zh')}
          </button>
        </div>
      </section>

      {/* Manage Categories */}
      <section className="bg-white rounded-2xl p-5 shadow-card mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-brand uppercase tracking-wide">Categories</h2>
          <button
            onClick={() => setShowAddCat(v => !v)}
            className="text-sm text-brand hover:text-ink-secondary font-medium transition-colors"
          >
            {showAddCat ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {showAddCat && (
          <div className="flex gap-2 mb-4">
            <input
              value={newCatEmoji}
              onChange={e => setNewCatEmoji(e.target.value)}
              maxLength={2}
              className="w-14 text-center rounded-xl border-2 border-line px-2 py-2 text-xl outline-none focus:border-brand"
            />
            <input
              autoFocus
              placeholder="Category name"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddCategory() }}
              className="flex-1 rounded-xl border-2 border-line px-3 py-2 text-ink-primary outline-none focus:border-brand"
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCatName.trim()}
              className="px-4 py-2 rounded-xl bg-brand disabled:opacity-40 text-white font-bold hover:bg-brand-hover transition-colors text-sm"
            >
              Add
            </button>
          </div>
        )}

        {store.categories.length === 0 ? (
          <p className="text-ink-muted text-sm text-center py-4">No categories yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {store.categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 py-2 border-b border-line-subtle last:border-0">
                <span className="text-xl">{cat.icon}</span>
                <span className="flex-1 text-ink-primary font-medium">{cat.name}</span>
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  className="text-red-300 hover:text-red-500 text-sm transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Danger zone */}
      <section className="bg-red-50 rounded-2xl p-5 shadow-card border border-red-100">
        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3">Danger Zone</h2>
        <p className="text-red-600 text-sm mb-4">
          This will permanently delete all family data including kids, actions, rewards, and history. This cannot be undone.
        </p>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-3 rounded-2xl bg-red-100 hover:bg-red-200 text-red-600 font-bold transition-colors"
          >
            Reset all data
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-red-700 font-bold text-center">Are you absolutely sure?</p>
            <button
              onClick={handleReset}
              className="w-full py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors"
            >
              Yes, delete everything
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="text-center text-red-400 text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
