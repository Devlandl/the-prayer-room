import Link from "next/link";

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export default function EmptyState({
  emoji,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{emoji}</span>
      <h3 className="text-lg font-semibold text-brand-white mb-2">{title}</h3>
      <p className="text-brand-muted text-sm max-w-xs mb-4">{description}</p>
      {action && action.href && (
        <Link
          href={action.href}
          className="bg-brand-gold text-brand-black px-4 py-2 rounded-lg font-medium hover:bg-brand-gold-light transition-colors"
        >
          {action.label}
        </Link>
      )}
      {action && action.onClick && (
        <button
          onClick={action.onClick}
          className="bg-brand-gold text-brand-black px-4 py-2 rounded-lg font-medium hover:bg-brand-gold-light transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
