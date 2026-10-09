import clsx from 'clsx';

interface BadgeProps {
  label: string;
  className?: string;
}

export function Badge({ label, className }: BadgeProps) {
  return (
    <span className={clsx('badge', className)}>
      {label}
    </span>
  );
}
