import { cache } from 'react'
import { createClient } from './server'

/**
 * Cached per-request auth + profile helpers.
 * React cache() deduplicates calls within the same server render,
 * so layout + page share one DB round-trip instead of each making their own.
 */

export const getAuthUser = cache(async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ?? null
})

export const getUserProfile = cache(async () => {
  const user = await getAuthUser()
  if (!user) return null
  const supabase = createClient()
  const { data } = await supabase
    .from('users')
    .select('*, practices(*)')
    .eq('id', user.id)
    .single()
  return data ?? null
})
