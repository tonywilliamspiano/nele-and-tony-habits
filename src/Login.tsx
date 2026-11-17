import '@fontsource/jersey-10/400.css'
import { type FormEvent, useState } from 'react'
import { isAuthRetryableFetchError } from '@supabase/supabase-js'
import { signIn } from './lib/supabase'
import './login.css'

const WRONG = "That name and password don't match."
const OFFLINE = "Can't reach the garden. Check your connection."

export default function Login({ notice }: { notice?: string }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(undefined)
    try {
      const { error } = await signIn(name, password)
      if (error) setError(isAuthRetryableFetchError(error) ? OFFLINE : WRONG)
    } catch {
      setError(OFFLINE)
    }
    setPassword('')
    setBusy(false)
  }

  const message = error ?? (busy ? undefined : notice)

  return (
    <div className="login">
      <div className="lg-sky">
        <i className="lg-sun" />
        <div className="lg-hang">
          <div className="lg-sign">
            <h1>Good Life Tracker</h1>
            <p>Tony &amp; Nele</p>
          </div>
        </div>
      </div>
      <form className="lg-card" onSubmit={submit}>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            spellCheck={false}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {message && (
          <p className="lg-error" role="alert">
            {message}
          </p>
        )}
        <button className="lg-go" disabled={busy}>
          {busy ? 'Opening…' : 'Open the gate'}
        </button>
      </form>
    </div>
  )
}
