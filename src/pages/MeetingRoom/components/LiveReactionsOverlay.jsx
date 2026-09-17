import React from 'react'
import { getAppleEmojiUrl } from '../data/stickerData'

export default function LiveReactionsOverlay({ activeReactions = [] }) {
  if (!activeReactions || activeReactions.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none">
      {/* Floating Emojis Container at bottom-left */}
      <div className="absolute bottom-24 sm:bottom-28 left-8 sm:left-14 pointer-events-none">
        {activeReactions.map((reaction) => {
          const emojiUrl = reaction.emojiCode ? getAppleEmojiUrl(reaction.emojiCode) : null
          const dx = reaction.driftX || 25
          const altDx = -Math.round(dx * 0.7)

          return (
            <div
              key={reaction.id}
              className="absolute bottom-0 left-0 animate-reaction-float pointer-events-none select-none flex items-center justify-center"
              style={{
                '--drift-x': `${dx}px`,
                '--drift-alt': `${altDx}px`,
                animationDuration: `${reaction.duration || 1.8}s`,
              }}
            >
              {emojiUrl ? (
                <img
                  src={emojiUrl}
                  alt={reaction.emoji}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-xl select-none pointer-events-none shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'inline-block'
                    }
                  }}
                />
              ) : null}
              <span
                style={{ display: emojiUrl ? 'none' : 'inline-block' }}
                className="text-4xl sm:text-5xl filter drop-shadow-xl select-none leading-none shrink-0"
              >
                {reaction.emoji}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
