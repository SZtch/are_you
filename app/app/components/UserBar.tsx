'use client'

const STATUS_COLOR = {
  idle:      'rgba(152,134,112,0.4)',
  connected: 'rgba(120,180,120,0.7)',
  error:     'rgba(180,100,100,0.7)',
}

interface UserBarProps {
  displayName: string | undefined
  isGuest: boolean
  agentStatus: 'idle' | 'connected' | 'error'
  onSignOut: () => void
}

export function UserBar({ displayName, isGuest, agentStatus, onSignOut }: UserBarProps) {
  return (
    <div className="user-info">
      <span style={{
        display: 'inline-block',
        width: '5px', height: '5px',
        borderRadius: '50%',
        background: STATUS_COLOR[agentStatus],
        marginRight: '6px',
        verticalAlign: 'middle',
        transition: 'background 0.4s ease',
      }} />
      <span className="user-name">{displayName}</span>
      <span className="info-sep">·</span>
      {isGuest ? (
        <a className="ghost-btn" href="/">sign in</a>
      ) : (
        <button className="ghost-btn" onClick={onSignOut}>
          sign out
        </button>
      )}
    </div>
  )
}
