import { supabase } from './supabase'

export async function softDeleteList(listId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('shopping_lists')
    .update({ deleted_at: new Date().toISOString(), deleted_by: userId })
    .eq('id', listId)
  if (error) throw error
}

export async function restoreList(listId: string): Promise<void> {
  const { error } = await supabase
    .from('shopping_lists')
    .update({ deleted_at: null, deleted_by: null })
    .eq('id', listId)
  if (error) throw error
}

export async function purgeList(listId: string): Promise<void> {
  const { error } = await supabase.from('shopping_lists').delete().eq('id', listId)
  if (error) throw error
}

export async function leaveList(listId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('list_members')
    .delete()
    .eq('list_id', listId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function countCollaborators(listId: string): Promise<number> {
  const { count, error } = await supabase
    .from('list_members')
    .select('id', { count: 'exact', head: true })
    .eq('list_id', listId)
  if (error) throw error
  return count ?? 0
}
