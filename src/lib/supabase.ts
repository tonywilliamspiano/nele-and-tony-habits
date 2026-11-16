import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../config'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

// .invalid is reserved (RFC 2606/6761) so these addresses can never receive mail. Supabase Auth
// only rejects reserved domains when sending email, which this app never does.
const EMAIL_DOMAIN = 'habits.invalid'

export function signIn(name: string, password: string) {
  const email = `${name.trim().toLowerCase()}@${EMAIL_DOMAIN}`
  return supabase.auth.signInWithPassword({ email, password })
}
