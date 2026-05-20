import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CHAPTER_FIELDS } from '../config'

/**
 * 課程章節管理頁面 — 管理 courses/{courseId}/chapters 子集合
 */
export function AdminChaptersPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const queryClient = useQueryClient()
  const [editingDoc, setEditingDoc] = useState<Record<string, any> | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // 取得課程名稱
  const { data: course } = useQuery({
    queryKey: ['admin', 'course', courseId],
    queryFn: async () => {
      if (!courseId) return null
      const d = await getDoc(doc(db, 'courses', courseId))
      return d.exists() ? { id: d.id, ...d.data() } : null
    },
    enabled: !!courseId,
  })

  // 取得章節列表
  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ['admin', 'chapters', courseId],
    queryFn: async () => {
      if (!courseId) return []
      const ref = collection(db, 'courses', courseId, 'chapters')
      const q = query(ref, orderBy('order', 'asc'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((d) => ({ _id: d.id, ...d.data() }))
    },
    enabled: !!courseId,
  })

  // 刪除章節
  const deleteMutation = useMutation({
    mutationFn: async (chapterId: string) => {
      if (!courseId) return
      await deleteDoc(doc(db, 'courses', courseId, 'chapters', chapterId))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'chapters', courseId] })
    },
  })

  // 儲存章節
  const saveMutation = useMutation({
    mutationFn: async ({
      chapterId,
      data,
      creating,
    }: {
      chapterId: string
      data: Record<string, any>
      creating: boolean
    }) => {
      if (!courseId || !chapterId) throw new Error('缺少 ID')
      const ref = doc(db, 'courses', courseId, 'chapters', chapterId)
      if (creating) {
        await setDoc(ref, data)
      } else {
        await updateDoc(ref, data)
      }
    },
    onSuccess: () => {
      setEditingDoc(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'chapters', courseId] })
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/courses" className="text-blue-600 hover:underline">
              ← 課程列表
            </Link>
            <h1 className="text-xl font-bold text-gray-800">
              📘 {(course as any)?.name ?? courseId} — 章節管理
            </h1>
          </div>
          <button
            onClick={() => {
              setIsCreating(true)
              setEditingDoc({})
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            新增章節
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-6">
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">載入中...</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">排序</th>
                  <th className="px-4 py-3">類型</th>
                  <th className="px-4 py-3">標題</th>
                  <th className="px-4 py-3">經驗</th>
                  <th className="px-4 py-3">金幣</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {chapters.map((ch: any) => (
                  <tr key={ch._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {ch._id}
                    </td>
                    <td className="px-4 py-3">{ch.order}</td>
                    <td className="px-4 py-3">{ch.type}</td>
                    <td className="px-4 py-3">{ch.title}</td>
                    <td className="px-4 py-3">{ch.experienceReward}</td>
                    <td className="px-4 py-3">{ch.coinReward ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setIsCreating(false)
                          // content 轉為 JSON 字串供編輯
                          const data = { ...ch }
                          if (data.content && typeof data.content === 'object') {
                            data.content = JSON.stringify(data.content, null, 2)
                          }
                          setEditingDoc(data)
                        }}
                        className="mr-2 text-blue-600 hover:underline"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`確定刪除章節 ${ch._id}？`)) {
                            deleteMutation.mutate(ch._id)
                          }
                        }}
                        className="text-red-600 hover:underline"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
                {chapters.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      尚無章節
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* 新增/編輯 Modal */}
      {editingDoc !== null && (
        <ChapterFormModal
          isCreating={isCreating}
          initialData={editingDoc}
          onClose={() => setEditingDoc(null)}
          onSave={(chapterId, data) =>
            saveMutation.mutate({ chapterId, data, creating: isCreating })
          }
          isPending={saveMutation.isPending}
          error={saveMutation.error?.message ?? ''}
        />
      )}
    </div>
  )
}

// === 章節表單 Modal ===

function ChapterFormModal({
  isCreating,
  initialData,
  onClose,
  onSave,
  isPending,
  error,
}: {
  isCreating: boolean
  initialData: Record<string, any>
  onClose: () => void
  onSave: (chapterId: string, data: Record<string, any>) => void
  isPending: boolean
  error: string
}) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const data: Record<string, any> = {}
    CHAPTER_FIELDS.forEach((f) => {
      if (f.key in initialData) {
        data[f.key] = initialData[f.key]
      } else {
        data[f.key] = f.type === 'number' ? 0 : ''
      }
    })
    return data
  })
  const [docId, setDocId] = useState(initialData._id || '')

  const handleSave = () => {
    const data: Record<string, any> = {}
    CHAPTER_FIELDS.forEach((f) => {
      if (f.key === 'content') {
        // 嘗試解析 JSON
        try {
          data[f.key] = formData[f.key] ? JSON.parse(formData[f.key]) : {}
        } catch {
          data[f.key] = {}
        }
      } else if (f.type === 'number') {
        data[f.key] = Number(formData[f.key]) || 0
      } else {
        data[f.key] = formData[f.key] ?? ''
      }
    })
    onSave(docId, data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6">
        <h2 className="mb-4 text-lg font-bold">
          {isCreating ? '新增' : '編輯'}章節
        </h2>

        {isCreating && (
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              章節 ID *
            </label>
            <input
              type="text"
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="如 ch-f101-1"
            />
          </div>
        )}

        {CHAPTER_FIELDS.map((field) => (
          <div key={field.key} className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {field.label}{field.required ? ' *' : ''}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={formData[field.key] ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                className="w-full rounded border px-3 py-2 font-mono text-sm"
                rows={field.key === 'content' ? 10 : 3}
                placeholder={field.key === 'content' ? '{"videoUrl": "", ...}' : ''}
              />
            ) : field.type === 'select' ? (
              <select
                value={formData[field.key] ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
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
                value={formData[field.key] ?? 0}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                className="w-full rounded border px-3 py-2 text-sm"
              />
            ) : (
              <input
                type="text"
                value={formData[field.key] ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                className="w-full rounded border px-3 py-2 text-sm"
              />
            )}
          </div>
        ))}

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  )
}
