import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../lib/store'

export default function RewardDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { rewards, pointBalance, redeemReward, addToWishlist } = useApp()
  const reward = rewards.find((r) => r.id === id)

  const [redeemed, setRedeemed] = useState(false)
  const [pendingApproval, setPendingApproval] = useState(false)

  if (!reward) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-6">
        <span className="material-symbols-outlined text-5xl text-slate-300">error</span>
        <p className="text-slate-500 font-medium">Reward not found</p>
        <button onClick={() => navigate('/rewards')} className="bg-[#D35400] text-white px-6 py-3 rounded-full text-sm font-semibold">
          Back to Rewards
        </button>
      </div>
    )
  }

  const canAfford = pointBalance >= reward.pointCost
  const progress = Math.min((pointBalance / reward.pointCost) * 100, 100)
  const ptsToGo = Math.max(reward.pointCost - pointBalance, 0)
  const isRedeemed = reward.status === 'redeemed' || redeemed
  const isPending = reward.status === 'pending_approval' || pendingApproval

  const handleRedeem = () => {
    const result = redeemReward(reward.id)
    if (result === 'redeemed') setRedeemed(true)
    else if (result === 'pending_approval') setPendingApproval(true)
  }

  const handleWishlist = () => {
    addToWishlist(reward.id)
    navigate('/rewards')
  }

  if (isPending) {
    return (
      <div className="flex flex-col min-h-dvh bg-[#FFFAF5]">
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
          <div className="size-24 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-amber-600">hourglass_top</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 text-center">Approval Requested</h2>
          <p className="text-slate-500 text-center">
            Your request to redeem <span className="font-bold text-[#D35400]">{reward.title}</span> for {reward.pointCost.toLocaleString()} pts has been sent to your monitor for approval.
          </p>
          <div className="bg-white p-5 rounded-2xl border border-amber-200 w-full">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600">info</span>
              <span className="text-sm text-amber-800">Points will be deducted once approved</span>
            </div>
          </div>
          <button onClick={() => navigate('/rewards')}
            className="w-full bg-[#D35400] py-5 rounded-2xl text-white font-bold text-lg hover:bg-[#B84700] active:scale-[0.98] transition-all"
            style={{ boxShadow: '0 8px 24px rgba(211,84,0,0.3)' }}>
            Back to Rewards
          </button>
        </div>
      </div>
    )
  }

  if (redeemed) {
    return (
      <div className="flex flex-col min-h-dvh bg-[#FFFAF5]">
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
          <div className="size-24 rounded-full bg-green-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-green-600">celebration</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 text-center">Reward Redeemed!</h2>
          <p className="text-slate-500 text-center">
            You spent <span className="font-bold text-[#D35400]">{reward.pointCost.toLocaleString()} pts</span> on {reward.title}
          </p>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 w-full">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">New balance</span>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[#FFB800] text-sm">stars</span>
                <span className="font-bold text-slate-900">{pointBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/rewards')}
            className="w-full bg-[#D35400] py-5 rounded-2xl text-white font-bold text-lg hover:bg-[#B84700] active:scale-[0.98] transition-all"
            style={{ boxShadow: '0 8px 24px rgba(211,84,0,0.3)' }}>
            Back to Rewards
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#FFFAF5]">
      <div className="relative h-64 bg-gradient-to-br from-[#D35400]/10 to-[#FFB800]/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-7xl text-[#D35400]/30">redeem</span>
        <button onClick={() => navigate(-1)} aria-label="Go back"
          className="absolute top-6 left-6 size-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-600">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        {reward.type === 'online' && (
          <div className="absolute top-6 right-6 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">link</span>Online
          </div>
        )}
        {isRedeemed && (
          <div className="absolute top-6 right-6 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Redeemed</div>
        )}
      </div>

      <div className="flex-1 px-6 -mt-6 relative">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-slate-900">{reward.title}</h1>
            <div className="flex items-center gap-1 bg-[#FFB800]/10 px-3 py-1.5 rounded-full flex-shrink-0">
              <span className="material-symbols-outlined text-[#FFB800] text-sm">stars</span>
              <span className="font-bold text-[#FFB800]">{reward.pointCost.toLocaleString()}</span>
            </div>
          </div>

          {reward.description && <p className="text-slate-600 text-sm leading-relaxed">{reward.description}</p>}

          {reward.type === 'online' && reward.url && (
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-xl">
              <span className="material-symbols-outlined text-slate-400 text-lg">link</span>
              <span className="text-sm text-[#D35400] font-medium truncate">{reward.url}</span>
            </div>
          )}

          {reward.requiresApproval && (
            <div className="flex items-center gap-3 bg-amber-50 px-4 py-3 rounded-xl">
              <span className="material-symbols-outlined text-amber-600">lock</span>
              <span className="text-sm text-amber-800 font-medium">Requires monitor approval</span>
            </div>
          )}

          {!isRedeemed && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Your balance</span>
                <span className="font-bold text-slate-900">{pointBalance.toLocaleString()} pts</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#D35400] to-[#E87A2A] rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              {!canAfford && (
                <p className="text-xs text-slate-400 text-center">{ptsToGo.toLocaleString()} more points needed</p>
              )}
            </div>
          )}
        </div>

        {!isRedeemed && !isPending && (
          <div className="mt-6 pb-8 space-y-3">
            <button onClick={handleRedeem} disabled={!canAfford}
              className="w-full bg-[#D35400] py-5 rounded-2xl text-white font-bold text-lg disabled:opacity-40 hover:bg-[#B84700] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              style={{ boxShadow: canAfford ? '0 8px 24px rgba(211,84,0,0.3)' : 'none' }}>
              {canAfford ? (
                reward.requiresApproval ? (
                  <><span>Request Approval</span><span className="material-symbols-outlined text-xl">send</span></>
                ) : (
                  <><span>Redeem Now</span><span className="material-symbols-outlined text-xl">arrow_forward</span></>
                )
              ) : (
                <span>Not enough points</span>
              )}
            </button>
            {!canAfford && reward.status !== 'wishlist' && (
              <button onClick={handleWishlist}
                className="w-full py-4 rounded-2xl border-2 border-[#D35400]/20 text-[#D35400] font-semibold text-sm hover:bg-[#D35400]/5 transition-colors">
                Add to Wishlist
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
