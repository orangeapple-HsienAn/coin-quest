import { Link } from 'react-router'
import { formatCoin } from '@/lib/utils'
import { CoinIcon } from '@/components/icons/CoinIcon'

interface Task {
  id: string
  name: string
  reward: number
  completed: boolean
  /** 點擊後跳轉的路徑 */
  linkTo: string
}

interface DailyTasksProps {
  tasks: Task[]
}

/**
 * 今日任務區塊
 * 未完成：顯示圓圈，可點擊跳轉
 * 已完成：顯示打勾綠框，不可點擊
 */
export function DailyTasks({ tasks }: DailyTasksProps) {
  return (
    <div className="rounded-[16px] border-[3px] border-cream-yellow bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <h2 className="mb-4 text-center text-lg font-semibold text-text-primary">
        今日任務
      </h2>

      <div className="space-y-3">
        {tasks.map((task) => {
          const content = (
            <div
              className={`flex items-center justify-between rounded-[12px] border-2 px-4 py-3 ${
                task.completed
                  ? 'border-teal bg-teal/5'
                  : 'border-[#F0E6D8] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🎯</span>
                <span className="text-sm text-text-primary">{task.name}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-sm text-text-secondary">
                  + <CoinIcon size={14} /> {formatCoin(task.reward)}
                </span>
                {/* 未完成：空心圓圈 / 已完成：綠色打勾 */}
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    task.completed
                      ? 'border-teal bg-teal text-white'
                      : 'border-gray-300'
                  }`}
                >
                  {task.completed && <span className="text-xs">✓</span>}
                </div>
              </div>
            </div>
          )

          // 未完成：可點擊跳轉；已完成：不可點擊
          return task.completed ? (
            <div key={task.id}>{content}</div>
          ) : (
            <Link key={task.id} to={task.linkTo}>
              {content}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
