import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    MapPin,
    Globe,
    Phone,
    Star,
    Users,
    Code,
    Target,
    ExternalLink,
    MessageSquare,
    BarChart3,
    CheckCircle2,
    AlertTriangle,
} from "lucide-react";

interface Competitor {
    id: number;
    name: string;
    url: string | null;
    address: string | null;
    phone: string | null;
    googleRating: string | null;
    googleReviewCount: number | null;
    seoScore: number | null;
    employeeCount: string | null;
    techStack: unknown;
    topKeywords: unknown;
    competitiveScore: number | null;
    threatLevel: "low" | "medium" | "high" | null;
}

interface CompetitorDetailDialogProps {
    competitor: Competitor | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CompetitorDetailDialog({
    competitor,
    open,
    onOpenChange,
}: CompetitorDetailDialogProps) {
    if (!competitor) return null;

    const techStack = Array.isArray(competitor.techStack)
        ? (competitor.techStack as string[])
        : [];
    const topKeywords = Array.isArray(competitor.topKeywords)
        ? (competitor.topKeywords as string[])
        : [];

    const getThreatColor = (level: string | null) => {
        switch (level) {
            case "high": return "text-red-500";
            case "medium": return "text-yellow-500";
            case "low": return "text-green-500";
            default: return "text-muted-foreground";
        }
    };

    const getThreatBadge = (level: string | null) => {
        switch (level) {
            case "high": return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">High Threat</Badge>;
            case "medium": return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20">Medium Threat</Badge>;
            case "low": return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">Low Threat</Badge>;
            default: return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-start justify-between mr-8">
                        <div>
                            <DialogTitle className="text-2xl font-bold mb-2">{competitor.name}</DialogTitle>
                            <DialogDescription className="flex items-center gap-2">
                                {competitor.address && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {competitor.address}
                                    </span>
                                )}
                            </DialogDescription>
                        </div>
                        {getThreatBadge(competitor.threatLevel)}
                    </div>
                </DialogHeader>

                <ScrollArea className="h-full max-h-[calc(90vh-120px)] pr-4">
                    <div className="space-y-6 pb-6">
                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="p-4 rounded-lg bg-secondary/20 border border-border/50">
                                <p className="text-xs text-muted-foreground mb-1">Competitive Score</p>
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-primary" />
                                    <span className="text-2xl font-bold">{competitor.competitiveScore || "N/A"}</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-secondary/20 border border-border/50">
                                <p className="text-xs text-muted-foreground mb-1">SEO Score</p>
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-primary" />
                                    <span className="text-2xl font-bold">{competitor.seoScore || "N/A"}</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-secondary/20 border border-border/50">
                                <p className="text-xs text-muted-foreground mb-1">Rating</p>
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span className="text-2xl font-bold">{competitor.googleRating || "N/A"}</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-secondary/20 border border-border/50">
                                <p className="text-xs text-muted-foreground mb-1">Reviews</p>
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-blue-500" />
                                    <span className="text-2xl font-bold">{competitor.googleReviewCount || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Contact & Detail Info */}
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                    Contact Details
                                </h4>
                                <div className="space-y-3 text-sm">
                                    {competitor.url && (
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-4 h-4 text-muted-foreground" />
                                            <a
                                                href={competitor.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline flex items-center gap-1"
                                            >
                                                Visit Website
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    )}
                                    {competitor.phone && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-4 h-4 text-muted-foreground" />
                                            <span>{competitor.phone}</span>
                                        </div>
                                    )}
                                    {competitor.employeeCount && (
                                        <div className="flex items-center gap-3">
                                            <Users className="w-4 h-4 text-muted-foreground" />
                                            <span>{competitor.employeeCount} Employees</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tech Stack */}
                            {techStack.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <Code className="w-5 h-5 text-primary" />
                                        Technology Stack
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {techStack.map((tech, i) => (
                                            <Badge key={i} variant="secondary" className="font-normal">
                                                {tech}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Keywords */}
                        {topKeywords.length > 0 && (
                            <div className="space-y-4 pt-4 border-t border-border/50">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary" />
                                    Top Keywords
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {topKeywords.map((kw, i) => (
                                        <Badge key={i} variant="outline" className="text-sm py-1">
                                            {kw}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Analysis Note */}
                        <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="font-medium text-sm">Competitive Analysis</p>
                                    <p className="text-sm text-muted-foreground">
                                        This competitor poses a {competitor.threatLevel || "unknown"} threat level based on their market presence, SEO performance, and customer satisfaction ratings.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
