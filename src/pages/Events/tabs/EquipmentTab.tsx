import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2, Check, Package } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { equipmentSummary } from '@/lib/eventHelpers'
import type { EventEquipment, HostInventoryItem } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemType = 'chair' | 'table' | 'plate' | 'bowl' | 'cold_glass' | 'hot_cup' | 'other'

interface Props {
  eventId: string
  isOwner: boolean
}

// ─── Add Equipment Sheet ──────────────────────────────────────────────────────

interface AddSheetProps {
  eventId: string
  onClose: () => void
}

function AddEquipmentSheet({ eventId, onClose }: AddSheetProps) {
  const { t } = useTranslation('events')
  const queryClient = useQueryClient()
  const [itemType, setItemType] = useState<ItemType>('chair')
  const [label, setLabel] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('event_equipment').insert({
        event_id: eventId,
        item_type: itemType,
        label: label.trim() || null,
        quantity_needed: quantity,
        notes: notes.trim() || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-equipment', eventId] })
      onClose()
    },
    onError: () => toast.error(t('equipment.addError')),
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-t-2xl bg-white pb-8 shadow-xl dark:bg-gray-900">
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        <div className="space-y-4 px-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('equipment.addItem')}
          </h3>

          {/* Type */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t('equipment.type')}
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                ['chair', 'table', 'plate', 'bowl', 'cold_glass', 'hot_cup', 'other'] as ItemType[]
              ).map(type => (
                <button
                  key={type}
                  onClick={() => setItemType(type)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    itemType === type
                      ? 'border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-600 dark:text-gray-400'
                  }`}
                >
                  {t(`checklist.types.${type}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t('equipment.label')}
            </label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={t('equipment.labelPlaceholder')}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t('equipment.quantity')}
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-semibold text-gray-800 dark:text-gray-100">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                +
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t('equipment.notes')}
            </label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('equipment.notesPlaceholder')}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
          </div>

          <button
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('equipment.add')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── EquipmentTab ─────────────────────────────────────────────────────────────

export default function EquipmentTab({ eventId, isOwner }: Props) {
  const { t } = useTranslation('events')
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)

  const { data: items = [], isLoading } = useQuery<EventEquipment[]>({
    queryKey: ['event-equipment', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_equipment')
        .select('*')
        .eq('event_id', eventId)
        .order('item_type')
      if (error) throw error
      return data
    },
  })

  const { data: hostInventory = [] } = useQuery<HostInventoryItem[]>({
    queryKey: ['host-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase.from('host_inventory').select('*')
      if (error) throw error
      return data
    },
  })

  const toggleArrangedMutation = useMutation({
    mutationFn: async ({ id, is_arranged }: { id: string; is_arranged: boolean }) => {
      const { error } = await supabase.from('event_equipment').update({ is_arranged }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-equipment', eventId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('event_equipment').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-equipment', eventId] }),
    onError: () => toast.error(t('equipment.deleteError')),
  })

  const { arranged, byType } = equipmentSummary(items)

  // Build host inventory map
  const inventoryMap = Object.fromEntries(
    hostInventory.map(item => [item.item_type, item.quantity_owned])
  )

  // Build per-type summary (needed - owned)
  const typeSummary = items.reduce(
    (acc, item) => {
      const owned = inventoryMap[item.item_type] ?? 0
      if (!acc[item.item_type]) {
        acc[item.item_type] = { needed: 0, owned }
      }
      acc[item.item_type].needed += item.quantity_needed
      return acc
    },
    {} as Record<string, { needed: number; owned: number }>
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Host inventory summary */}
      {Object.entries(typeSummary).length > 0 && (
        <div className="space-y-2 rounded-2xl bg-blue-50 p-3 dark:bg-blue-900/20">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
            {t('equipment.hostInventory')}
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(typeSummary).map(([type, { needed, owned }]) => {
              const stillNeed = Math.max(0, needed - owned)
              return (
                <span
                  key={type}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    stillNeed > 0
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}
                >
                  {t(`checklist.types.${type}`)}: need {needed} | have {owned}
                  {stillNeed > 0 && ` | still need ${stillNeed}`}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        {items.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {t('equipment.arrangedCount', { count: arranged, total: items.length })}
            </span>
            {Object.entries(byType).map(([type, qty]) => (
              <span
                key={type}
                className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              >
                {t(`checklist.types.${type}`)}: {qty}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('equipment.empty')}</p>
        )}

        {isOwner && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            {t('equipment.add')}
          </button>
        )}
      </div>

      {/* Item list */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm transition dark:bg-gray-900 ${
                item.is_arranged ? 'opacity-60' : ''
              }`}
            >
              {/* Arranged checkbox */}
              <button
                onClick={() =>
                  toggleArrangedMutation.mutate({ id: item.id, is_arranged: !item.is_arranged })
                }
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${
                  item.is_arranged
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 hover:border-green-400 dark:border-gray-600'
                }`}
              >
                {item.is_arranged && <Check className="h-3.5 w-3.5" />}
              </button>

              {/* Item info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-sm font-medium ${
                      item.is_arranged
                        ? 'text-gray-400 line-through dark:text-gray-500'
                        : 'text-gray-800 dark:text-gray-100'
                    }`}
                  >
                    {item.label || t(`checklist.types.${item.item_type}`)}
                  </span>
                  {item.label && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {t(`checklist.types.${item.item_type}`)}
                    </span>
                  )}
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                    ×{item.quantity_needed}
                  </span>
                  {inventoryMap[item.item_type] !== undefined &&
                    inventoryMap[item.item_type]! > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                        {t('equipment.owned')} {inventoryMap[item.item_type]}
                      </span>
                    )}
                </div>
                {item.notes && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.notes}</p>
                )}
              </div>

              {/* Delete */}
              {isOwner && (
                <button
                  onClick={() => deleteMutation.mutate(item.id)}
                  disabled={deleteMutation.isPending}
                  className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && isOwner && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          {t('equipment.emptyHint')}
        </p>
      )}

      {/* Package icon for empty state visual */}
      {items.length === 0 && (
        <div className="flex justify-center py-6">
          <Package className="h-10 w-10 text-gray-200 dark:text-gray-700" />
        </div>
      )}

      {showAdd && <AddEquipmentSheet eventId={eventId} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
