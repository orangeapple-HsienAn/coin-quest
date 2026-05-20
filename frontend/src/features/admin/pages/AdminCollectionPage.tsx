import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { COLLECTIONS, type FieldDef } from '../config'

/**
 * 通用 CRUD 頁面 — 根據 URL 參數 :collection 動態渲染
 */
export function AdminCollectionPage() {
  const { collection: collectionKey } = useParams<{ collection: string }>()
  const config = collectionKey ? COLLECTIONS[collectionKey] : undefined
  const queryClient = useQueryClient()

  const [editingDoc, setEditingDoc] = useState<Record<string, any> | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // collection 不存在則導回 dashboard
  if (!config || !collectionKey) return <Navigate to="/admin" replace />

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-blue-600 hover:underline">
              ← 後台
            </Link>
            <h1 className="text-xl font-bold text-gray-800">
              {config.icon} {config.label}
            </h1>
          </div>
          <button
            onClick={() => {
              setIsCreating(true)
              setEditingDoc({})
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            新增
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-6">
        <DataTable
          collectionKey={collectionKey}
          config={config}
          onEdit={(docData) => {
            setIsCreating(false)
            setEditingDoc(docData)
          }}
        />
      </main>

      {/* 新增/編輯 Modal */}
      {editingDoc !== null && (
        <FormModal
          config={config}
          isCreating={isCreating}
          initialData={editingDoc}
          onClose={() => setEditingDoc(null)}
          onSaved={() => {
            setEditingDoc(null)
            queryClient.invalidateQueries({ queryKey: ['admin', collectionKey] })
          }}
        />
      )}
    </div>
  )
}

// === 資料表格 ===

function DataTable({
  collectionKey,
  config,
  onEdit,
}: {
  collectionKey: string
  config: (typeof COLLECTIONS)[string]
  onEdit: (doc: Record<string, any>) => void
}) {
  const queryClient = useQueryClient()

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['admin', collectionKey],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, config.path))
      return snapshot.docs.map((d) => ({ _id: d.id, ...d.data() } as Record<string, any>))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      await deleteDoc(doc(db, config.path, docId))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', collectionKey] })
    },
  })

  if (isLoading) {
    return <div className="py-8 text-center text-gray-500">載入中...</div>
  }

  // 顯示欄位：取前 5 個非 textarea 欄位 + ID
  const displayFields = config.fields.filter((f) => f.type !== 'textarea').slice(0, 5)

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">ID</th>
            {displayFields.map((f) => (
              <th key={f.key} className="px-4 py-3">
                {f.label}
              </th>
            ))}
            <th className="px-4 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {docs.map((d) => (
            <tr key={d._id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-600">
                {d._id}
                {/* 課程的「管理章節」連結 */}
                {collectionKey === 'courses' && (
                  <Link
                    to={`/admin/courses/${d._id}/chapters`}
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    [章節]
                  </Link>
                )}
              </td>
              {displayFields.map((f) => (
                <td key={f.key} className="px-4 py-3">
                  {renderValue(d[f.key], f)}
                </td>
              ))}
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onEdit(d)}
                  className="mr-2 text-blue-600 hover:underline"
                >
                  編輯
                </button>
                <button
                  onClick={() => {
                    if (confirm(`確定刪除 ${d._id}？`)) {
                      deleteMutation.mutate(d._id)
                    }
                  }}
                  className="text-red-600 hover:underline"
                >
                  刪除
                </button>
              </td>
            </tr>
          ))}
          {docs.length === 0 && (
            <tr>
              <td
                colSpan={displayFields.length + 2}
                className="px-4 py-8 text-center text-gray-400"
              >
                暫無資料
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/** 顯示欄位值 */
function renderValue(value: any, field: FieldDef) {
  if (value === undefined || value === null) return '-'
  if (field.type === 'boolean') {
    return value ? '✅' : '❌'
  }
  if (field.type === 'select' && field.options) {
    const opt = field.options.find((o) => o.value === value)
    return opt?.label ?? value
  }
  return String(value)
}

// === 新增/編輯 Modal ===

function FormModal({
  config,
  isCreating,
  initialData,
  onClose,
  onSaved,
}: {
  config: (typeof COLLECTIONS)[string]
  isCreating: boolean
  initialData: Record<string, any>
  onClose: () => void
  onSaved: () => void
}) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const data: Record<string, any> = {}
    config.fields.forEach((f) => {
      if (f.key in initialData) {
        data[f.key] = initialData[f.key]
      } else {
        // 預設值
        data[f.key] = f.type === 'boolean' ? true : f.type === 'number' ? 0 : ''
      }
    })
    return data
  })
  const [docId, setDocId] = useState(initialData._id || '')
  const [error, setError] = useState('')

  const saveMutation = useMutation({
    mutationFn: async () => {
      const id = isCreating ? docId : initialData._id
      if (!id) throw new Error('請輸入文件 ID')

      // 轉換數值欄位
      const data: Record<string, any> = {}
      config.fields.forEach((f) => {
        if (f.type === 'number') {
          data[f.key] = Number(formData[f.key]) || 0
        } else if (f.type === 'boolean') {
          data[f.key] = !!formData[f.key]
        } else {
          data[f.key] = formData[f.key] ?? ''
        }
      })

      if (isCreating) {
        await setDoc(doc(db, config.path, id), data)
      } else {
        await updateDoc(doc(db, config.path, id), data)
      }
    },
    onSuccess: onSaved,
    onError: (err: Error) => setError(err.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6">
        <h2 className="mb-4 text-lg font-bold">
          {isCreating ? '新增' : '編輯'} {config.label}
        </h2>

        {/* 文件 ID（僅新增時顯示） */}
        {isCreating && config.hasIdInput && (
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              文件 ID *
            </label>
            <input
              type="text"
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="如 risk-accident-1"
            />
          </div>
        )}

        {/* 欄位表單 */}
        {config.fields.map((field) => (
          <FieldInput
            key={field.key}
            field={field}
            value={formData[field.key]}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, [field.key]: val }))
            }
          />
        ))}

        {error && (
          <div className="mb-3 text-sm text-red-600">{error}</div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  )
}

// === 表單欄位元件 ===

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: any
  onChange: (val: any) => void
}) {
  const label = `${field.label}${field.required ? ' *' : ''}`

  return (
    <div className="mb-3">
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {field.type === 'textarea' ? (
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
          rows={3}
        />
      ) : field.type === 'boolean' ? (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm text-gray-600">啟用</span>
        </label>
      ) : field.type === 'select' ? (
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        >
          <option value="">選擇...</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : field.type === 'number' ? (
        <input
          type="number"
          value={value ?? 0}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      ) : (
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      )}
    </div>
  )
}
