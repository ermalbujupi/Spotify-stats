import { type ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Section } from "@/lib/spotify/dashboard-data";

/**
 * A dashboard card bound to a data {@link Section}. Renders the children
 * (render-prop) on success, an empty state when the predicate matches, or a
 * compact inline error — so each panel degrades independently.
 */
export function SectionCard<T>({
  title,
  subtitle,
  action,
  section,
  isEmpty,
  emptyMessage = "Nothing to show yet.",
  className = "",
  bodyClassName = "",
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  section: Section<T>;
  isEmpty?: (data: T) => boolean;
  emptyMessage?: string;
  className?: string;
  bodyClassName?: string;
  children: (data: T) => ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} action={action} />
      <CardBody className={bodyClassName}>
        {section.ok ? (
          isEmpty?.(section.data) ? (
            <EmptyState message={emptyMessage} />
          ) : (
            children(section.data)
          )
        ) : (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {section.error}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
