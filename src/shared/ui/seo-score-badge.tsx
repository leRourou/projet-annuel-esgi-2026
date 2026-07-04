import { Badge } from "@/components/ui/badge";

export function seoScoreVariant(score: number): "success" | "warning" | "destructive" {
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "destructive";
}

interface SeoScoreBadgeProps {
  score: number;
  className?: string;
}

export function SeoScoreBadge({ score, className }: SeoScoreBadgeProps) {
  return (
    <Badge variant={seoScoreVariant(score)} className={className}>
      SEO {score}/100
    </Badge>
  );
}
