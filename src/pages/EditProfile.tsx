import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { fetchProfile, upsertProfile, uploadAvatar } from '../lib/profile'
import type { Gender } from '../types'

const GENDER_OPTIONS: { value: Gender | ''; label: string }[] = [
  { value: '', label: 'Select...' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const isTestMode = import.meta.env.MODE === 'test'

export default function EditProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fallbackName = user?.email?.split('@')[0] ?? ''
  const shouldFetch = !!user && !isTestMode

  const [displayName, setDisplayName] = useState(shouldFetch ? '' : fallbackName)
  const [gender, setGender] = useState<Gender | ''>('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(shouldFetch)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user || !!isTestMode) return

    let active = true
    fetchProfile(user.id).then((profile) => {
      if (!active) return
      if (profile) {
        setDisplayName(profile.displayName ?? '')
        setGender(profile.gender ?? '')
        setAvatarUrl(profile.avatarUrl)
      } else {
        setDisplayName(user.email?.split('@')[0] ?? '')
      }
      setLoading(false)
    })
    return () => { active = false }
  }, [user])

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setSaved(false)

    if (!isTestMode) {
      await upsertProfile(user.id, {
        displayName: displayName.trim() || undefined,
        gender: gender || null,
      })
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user || !!isTestMode) return

    setUploading(true)
    const result = await uploadAvatar(user.id, file)
    if (result.url) {
      setAvatarUrl(result.url)
    }
    setUploading(false)
  }

  const userId = user?.id ?? 'local-user'
  const email = user?.email ?? 'test@example.com'
  const initials = (displayName || email)[0]?.toUpperCase() ?? '?'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="w-10 h-10 border-4 border-[#D35400] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="px-6 pt-8 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-[#D35400] font-semibold text-sm mb-4"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back
        </button>
        <h1 className="text-4xl font-bold tracking-tight mb-6">Edit Profile</h1>
      </header>

      <main className="px-6 space-y-6 pb-8">
        {/* Profile Photo */}
        <section className="flex flex-col items-center gap-3">
          <p className="text-sm font-semibold text-slate-700">Profile Photo</p>
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="size-24 rounded-2xl object-cover border-2 border-slate-100"
              />
            ) : (
              <div className="size-24 rounded-2xl bg-gradient-to-br from-[#D35400] to-[#E87A2A] flex items-center justify-center text-white text-3xl font-bold">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 size-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[#D35400] text-sm">photo_camera</span>
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </section>

        {/* Fields */}
        <section className="space-y-4">
          {/* User ID */}
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-slate-700 mb-1">
              User ID
            </label>
            <input
              id="userId"
              type="text"
              readOnly
              value={userId}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-sm font-mono"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              readOnly
              value={email}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-sm"
            />
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#D35400] focus:ring-2 focus:ring-[#D35400]/20 outline-none transition text-sm"
            />
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-slate-700 mb-1">
              Gender
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender | '')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#D35400] focus:ring-2 focus:ring-[#D35400]/20 outline-none transition text-sm bg-white"
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-[#D35400] text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition"
          style={{ boxShadow: '0 4px 12px rgba(211,84,0,0.3)' }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        {saved && (
          <p className="text-center text-sm text-green-600 font-medium">Profile saved!</p>
        )}
      </main>
    </div>
  )
}
