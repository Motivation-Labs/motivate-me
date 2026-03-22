import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/store'

type Tab = 'available' | 'wishlist' | 'redeemed'

export default function Rewards() {
  const { rewards, pointBalance } = useApp()
  const [tab, setTab] = useState<Tab>('available')

  const filtered = rewards.filter((r) => {
    if (tab === 'available') return r.status === 'available' || r.status === 'pending_approval'
    return r.status === tab
  })

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-10 bg-[#FFFAF5]/90 backdrop-blur-md px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#D35400]/10 p-2 rounded-lg">
              <span className="material-symbols-outlined text-[#D35400]">redeem</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight">Motivate Me</h2>
          </div>
          <Link
            to="/rewards/new"
            className="bg-[#D35400] text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-1"
            style={{ boxShadow: '0 4px 12px rgba(211,84,0,0.3)' }}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Reward
          </Link>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">Rewards</h1>

        <div className="flex items-center gap-2 mb-5 bg-white px-4 py-2.5 rounded-full border border-slate-100 w-fit">
          <span className="material-symbols-outlined text-[#FFB800] text-lg">stars</span>
          <span className="font-bold text-slate-900">{pointBalance.toLocaleString()}</span>
          <span className="text-slate-400 text-sm">pts available</span>
        </div>

        <div className="flex p-1 bg-slate-200/50 rounded-xl">
          {(['available', 'wishlist', 'redeemed'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                tab === t ? 'bg-white shadow-sm text-[#D35400]' : 'text-slate-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 mt-4 pb-4 flex-1">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="material-symbols-outlined text-5xl text-slate-300">
              {tab === 'available' ? 'redeem' : tab === 'wishlist' ? 'favorite' : 'history'}
            </span>
            <p className="text-slate-400 font-medium text-center">
              {tab === 'available' && 'No rewards yet. Create one to get started!'}
              {tab === 'wishlist' && 'Add rewards to your wishlist to track progress.'}
              {tab === 'redeemed' && 'No redeemed rewards yet. Keep earning!'}
            </p>
            {tab === 'available' && (
              <Link to="/rewards/new" className="bg-[#D35400] text-white px-6 py-3 rounded-full text-sm font-semibold">
                Create your first reward
              </Link>
            )}
          </div>
        )}

        {tab === 'wishlist' ? (
          <div className="space-y-4">
            {filtered.map((reward) => {
              const progress = Math.min((pointBalance / reward.pointCost) * 100, 100)
              const ptsToGo = Math.max(reward.pointCost - pointBalance, 0)
              const canRedeem = ptsToGo === 0
              return (
                <Link
                  to={`/rewards/${reward.id}`}
                  key={reward.id}
                  className={`block bg-white p-5 rounded-2xl border transition-all ${
                    canRedeem ? 'border-[#D35400] shadow-[0_0_0_1px_rgba(211,84,0,0.2)]' : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="size-14 rounded-2xl bg-gradient-to-br from-[#D35400]/10 to-[#FFB800]/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[#D35400] text-2xl">redeem</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{reward.title}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{reward.description}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="material-symbols-outlined text-[#FFB800] text-sm">stars</span>
                      <span className="text-sm font-bold text-slate-900">{reward.pointCost.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D35400] to-[#E87A2A] rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      {canRedeem ? (
                        <span className="text-sm font-bold text-[#D35400]">Ready to redeem!</span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">{ptsToGo.toLocaleString()} pts to go</span>
                      )}
                      <span className="text-xs text-slate-400">{pointBalance.toLocaleString()} / {reward.pointCost.toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map((reward) => {
              const canAfford = pointBalance >= reward.pointCost
              const isRedeemed = reward.status === 'redeemed'
              const isPending = reward.status === 'pending_approval'
              return (
                <Link
                  to={`/rewards/${reward.id}`}
                  key={reward.id}
                  className={`bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all block ${isRedeemed ? 'opacity-70' : ''}`}
                >
                  <div className="h-28 bg-gradient-to-br from-[#D35400]/5 to-[#FFB800]/5 flex items-center justify-center relative">
                    <span className="material-symbols-outlined text-4xl text-[#D35400]/40">redeem</span>
                    {reward.requiresApproval && !isPending && (
                      <div className="absolute top-2 right-2 size-6 rounded-full bg-amber-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-600 text-sm">lock</span>
                      </div>
                    )}
                    {isPending && (
                      <div className="absolute inset-0 bg-amber-50/60 flex items-center justify-center">
                        <span className="text-xs font-bold text-amber-700 bg-amber-100/90 px-3 py-1 rounded-full">Pending Approval</span>
                      </div>
                    )}
                    {isRedeemed && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-500 bg-white/90 px-3 py-1 rounded-full">Redeemed</span>
                      </div>
                    )}
                    {reward.type === 'online' && !isRedeemed && !isPending && (
                      <div className="absolute top-2 left-2 size-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-blue-600 text-sm">link</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-slate-900 truncate">{reward.title}</h3>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="material-symbols-outlined text-[#FFB800] text-sm">stars</span>
                      <span className="text-sm font-bold text-slate-700">{reward.pointCost.toLocaleString()}</span>
                    </div>
                    {!isRedeemed && !isPending && (
                      <div
                        className={`w-full mt-3 py-2 rounded-xl text-sm font-semibold transition-all text-center ${
                          canAfford ? 'bg-[#D35400] text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {canAfford ? 'Redeem' : 'Wishlist'}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
