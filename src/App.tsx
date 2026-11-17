import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Login from './Login'
import Garden from './mock/garden'

type Me = 'tony' | 'nele'

function meOf(session: Session | null): Me | null {
  const prefix = session?.user.email?.split('@')[0]
  return prefix === 'tony' || prefix === 'nele' ? prefix : null
}

export default function App() {
  // undefined until the first session check returns, so a signed-in user never sees the login flash.
  const [session, setSession] = useState<Session | null>()
  const [notice, setNotice] = useState<string>()

  useEffect(() => {
    function apply(s: Session | null) {
      if (s && !meOf(s)) {
        setNotice("That account isn't Tony or Nele.")
        // Deferred: supabase calls made inside an auth callback can deadlock on its lock.
        setTimeout(() => supabase.auth.signOut())
        s = null
      }
      setSession(s)
    }
    supabase.auth.getSession().then(({ data }) => apply(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, s) => apply(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const me = meOf(session ?? null)

  return (
    <div className="phone">
      {session === undefined ? (
        <div className="login" />
      ) : me ? (
        <Garden me={me} signOut={() => supabase.auth.signOut()} />
      ) : (
        <Login notice={notice} />
      )}
    </div>
  )
}
