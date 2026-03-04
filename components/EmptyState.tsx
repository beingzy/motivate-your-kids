interface EmptyStateProps {
  emoji: string
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="text-6xl mb-4">{emoji}</div>
      <p className="font-bold text-ink-primary text-lg mb-1">{title}</p>
      {description && <p className="text-ink-secondary text-sm mb-5">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
