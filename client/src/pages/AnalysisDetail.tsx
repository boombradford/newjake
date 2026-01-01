import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useEffect } from "react";
import { Streamdown } from "streamdown";
import {
  Zap,
  ArrowLeft,
  Loader2,
  Building2,
  Globe,
  MapPin,
  Star,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  FileText,
  Copy,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Users,
  Code,
  Newspaper,
  Twitter,
  Activity
} from "lucide-react";
import { toast } from "sonner";

import { useState } from "react";

export default function AnalysisDetail() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const analysisId = parseInt(params.id || "0");
  const [expandedCompetitorId, setExpandedCompetitorId] = useState<number | null>(null);

  const { data: analysis, isLoading, error, refetch } = trpc.analysis.get.useQuery(
    { id: analysisId },
    {
      enabled: analysisId > 0,
      refetchInterval: (query) => {
        // Keep polling while analysis is in progress
        const data = query.state.data;
        if (data?.status === "pending" || data?.status === "collecting" || data?.status === "analyzing") {
          return 5000;
        }
        return false;
      }
    }
  );

  const regenerateContent = trpc.analysis.regenerateContent.useMutation({
    onSuccess: () => {
      toast.success("Content regenerated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to regenerate content");
    }
  });

  const toggleCompetitor = (id: number) => {
    setExpandedCompetitorId(expandedCompetitorId === id ? null : id);
  };

  // Auth checks removed
  // useEffect(() => { ... });
  // if (authLoading) { ... }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Analysis not found</p>
          <Button onClick={() => setLocation("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isInProgress = ["pending", "collecting", "analyzing"].includes(analysis.status);
  const competitors = (analysis.competitors || []) as Array<{
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
  }>;
  const strengths = (analysis.strengths as string[]) || [];
  const weaknesses = (analysis.weaknesses as string[]) || [];
  const opportunities = (analysis.opportunities as string[]) || [];
  const recommendations = (analysis.recommendations as string[]) || [];
  const adCopy = (analysis.generatedAdCopy as Array<{ headline: string; description: string; callToAction: string; platform: string }>) || [];

  const getStatusIcon = () => {
    switch (analysis.status) {
      case "completed": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "failed": return <XCircle className="w-5 h-5 text-destructive" />;
      default: return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (analysis.status) {
      case "pending": return "Initializing analysis...";
      case "collecting": return "Collecting competitor data...";
      case "analyzing": return "Generating AI insights...";
      case "completed": return "Analysis complete";
      case "failed": return "Analysis failed";
      default: return analysis.status;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getThreatBadge = (level: string | null) => {
    switch (level) {
      case "high": return <Badge className="threat-high">High Threat</Badge>;
      case "medium": return <Badge className="threat-medium">Medium Threat</Badge>;
      case "low": return <Badge className="threat-low">Low Threat</Badge>;
      default: return null;
    }
  };

  if (error) return <div className="text-center p-8 text-red-500">Error loading analysis: {error.message}</div>;

  return (
    <div className="min-h-screen premium-gradient font-sans">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-[url('/grid-pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="fixed inset-0 low-poly-gradient pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border/50 backdrop-blur-sm sticky top-0">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-5 h-5 stroke-[1.5]" />
            </Button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm">{getStatusText()}</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 py-8">
        <div className="container">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{analysis.businessName}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 stroke-[1.5]" />
                    {analysis.businessLocation}
                  </span>
                  {analysis.businessUrl && (
                    <a
                      href={analysis.businessUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Globe className="w-4 h-4 stroke-[1.5]" />
                      Website
                      <ExternalLink className="w-3 h-3 stroke-[1.5]" />
                    </a>
                  )}
                  {analysis.industry && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4 stroke-[1.5]" />
                      {analysis.industry}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress indicator for in-progress analyses */}
            {isInProgress && (
              <Card className="bg-card/50 border-border/50 mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <div>
                      <p className="font-medium">{getStatusText()}</p>
                      <p className="text-sm text-muted-foreground">
                        This may take a few minutes. The page will update automatically.
                      </p>
                    </div>
                  </div>
                  <Progress
                    value={
                      analysis.status === "pending" ? 10 :
                        analysis.status === "collecting" ? 40 :
                          analysis.status === "analyzing" ? 70 : 100
                    }
                    className="h-2"
                  />
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            {analysis.status === "completed" && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">SEO Score</p>
                        <p className={`text-3xl font-bold ${(analysis.seoScore || 0) >= 70 ? "score-high" :
                          (analysis.seoScore || 0) >= 40 ? "score-medium" : "score-low"
                          }`}>
                          {analysis.seoScore || "N/A"}
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-muted-foreground/50 stroke-[1.5]" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Google Rating</p>
                        <div className="flex items-center gap-2">
                          <p className="text-3xl font-bold">{analysis.googleRating || "N/A"}</p>
                          {analysis.googleRating && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                        </div>
                      </div>
                      <Star className="w-8 h-8 text-muted-foreground/50 stroke-[1.5]" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Reviews</p>
                        <p className="text-3xl font-bold">{analysis.googleReviewCount || 0}</p>
                      </div>
                      <MessageSquare className="w-8 h-8 text-muted-foreground/50 stroke-[1.5]" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Competitors</p>
                        <p className="text-3xl font-bold">{competitors.length}</p>
                      </div>
                      <Target className="w-8 h-8 text-muted-foreground/50 stroke-[1.5]" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Main Content Sections */}
          {analysis.status === "completed" && (
            <div className="space-y-12">

              {/* Overview Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-primary stroke-[1.5]" />
                  <h2 className="text-2xl font-semibold">AI Analysis & Insights</h2>
                </div>

                {/* AI Analysis */}
                {analysis.overallAnalysis && (
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle>Executive Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-invert max-w-none">
                        <Streamdown>{analysis.overallAnalysis as string}</Streamdown>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* SWOT Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-500">
                        <TrendingUp className="w-5 h-5 stroke-[1.5]" />
                        Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Accordion type="single" collapsible className="w-full">
                        {strengths.map((item: any, i) => (
                          <AccordionItem key={i} value={`strength-${i}`} className="border-b border-border/50 last:border-0 px-6">
                            <AccordionTrigger className="hover:no-underline py-4">
                              <div className="flex items-start text-left gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-1" />
                                <span className="font-medium text-sm text-foreground">
                                  {typeof item === 'string' ? item : item.title}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-6 pb-4 text-muted-foreground text-sm leading-relaxed">
                              {typeof item === 'string' ? "Expand for details." : item.explanation}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>

                  {/* Weaknesses */}
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-500">
                        <TrendingDown className="w-5 h-5 stroke-[1.5]" />
                        Weaknesses
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Accordion type="single" collapsible className="w-full">
                        {weaknesses.map((item: any, i) => (
                          <AccordionItem key={i} value={`weakness-${i}`} className="border-b border-border/50 last:border-0 px-6">
                            <AccordionTrigger className="hover:no-underline py-4">
                              <div className="flex items-start text-left gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                                <span className="font-medium text-sm text-foreground">
                                  {typeof item === 'string' ? item : item.title}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-6 pb-4 text-muted-foreground text-sm leading-relaxed">
                              {typeof item === 'string' ? "Expand for details." : item.explanation}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>

                  {/* Opportunities */}
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-500">
                        <Target className="w-5 h-5 stroke-[1.5]" />
                        Opportunities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Accordion type="single" collapsible className="w-full">
                        {opportunities.map((item: any, i) => (
                          <AccordionItem key={i} value={`opportunity-${i}`} className="border-b border-border/50 last:border-0 px-6">
                            <AccordionTrigger className="hover:no-underline py-4">
                              <div className="flex items-start text-left gap-2">
                                <Lightbulb className="w-4 h-4 text-blue-500 shrink-0 mt-1" />
                                <span className="font-medium text-sm text-foreground">
                                  {typeof item === 'string' ? item : item.title}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-6 pb-4 text-muted-foreground text-sm leading-relaxed">
                              {typeof item === 'string' ? "Expand for details." : item.explanation}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-primary">
                        <Zap className="w-5 h-5 stroke-[1.5]" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Accordion type="single" collapsible className="w-full">
                        {recommendations.map((rec: any, i) => (
                          <AccordionItem key={i} value={`item-${i}`} className="border-b border-border/50 last:border-0 px-6">
                            <AccordionTrigger className="hover:no-underline py-4">
                              <div className="flex items-center gap-3 text-left">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                                  {i + 1}
                                </span>
                                <div className="flex flex-col gap-1">
                                  <span className="font-semibold text-base">{typeof rec === 'string' ? rec : rec.title}</span>
                                  {typeof rec !== 'string' && (
                                    <Badge variant="outline" className={`w-fit text-[10px] px-2 py-0 h-5 ${rec.impact === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                      rec.impact === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                      }`}>
                                      {rec.impact} Impact
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-9 pb-4">
                              {typeof rec === 'string' ? (
                                <p className="text-muted-foreground">{rec}</p>
                              ) : (
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="text-sm font-medium mb-1 text-foreground">Why it matters</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {rec.description}
                                    </p>
                                  </div>
                                  <div className="bg-secondary/30 p-4 rounded-lg border border-border/50">
                                    <h4 className="text-sm font-medium mb-2 text-primary flex items-center gap-2">
                                      <Zap className="w-3 h-3" /> Action Plan
                                    </h4>
                                    <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                                      {rec.action_plan}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Competitors Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary stroke-[1.5]" />
                  <h2 className="text-2xl font-semibold">Competitors</h2>
                </div>

                {competitors.length === 0 ? (
                  <Card className="bg-card/50 border-border/50">
                    <CardContent className="py-12 text-center">
                      <Target className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No competitors found in this area</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {competitors.map((comp, i) => (
                      <Card
                        key={comp.id}
                        className={`bg-card/50 border-border/50 transition-all cursor-pointer ${expandedCompetitorId === comp.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:bg-secondary/10"
                          }`}
                        onClick={() => toggleCompetitor(comp.id)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {i + 1}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{comp.name}</h3>
                                {comp.address && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3 stroke-[1.5]" />
                                    {comp.address}
                                  </p>
                                )}
                              </div>
                            </div>
                            {getThreatBadge(comp.threatLevel)}
                          </div>

                          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="p-3 rounded-lg bg-secondary/30">
                              <p className="text-xs text-muted-foreground mb-1">SEO Score</p>
                              <p className={`text-xl font-bold ${(comp.seoScore || 0) >= 70 ? "score-high" :
                                (comp.seoScore || 0) >= 40 ? "score-medium" : "score-low"
                                }`}>
                                {comp.seoScore || "N/A"}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-secondary/30">
                              <p className="text-xs text-muted-foreground mb-1">Rating</p>
                              <div className="flex items-center gap-1">
                                <p className="text-xl font-bold">{comp.googleRating || "N/A"}</p>
                                {comp.googleRating && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                              </div>
                            </div>
                            <div className="p-3 rounded-lg bg-secondary/30">
                              <p className="text-xs text-muted-foreground mb-1">Reviews</p>
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(comp.name + " " + (comp.address || "") + " reviews")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xl font-bold hover:text-primary hover:underline transition-colors block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {comp.googleReviewCount || 0}
                              </a>
                            </div>
                            <div className="p-3 rounded-lg bg-secondary/30">
                              <p className="text-xs text-muted-foreground mb-1">Competitive Score</p>
                              <p className="text-xl font-bold">{comp.competitiveScore || "N/A"}</p>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {expandedCompetitorId === comp.id ? (
                            <div className="pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-200">
                              <div className="grid md:grid-cols-2 gap-6 mb-4">
                                <div>
                                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-primary stroke-[1.5]" />
                                    Company Details
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    {comp.url && (
                                      <div className="flex items-center justify-between p-2 rounded bg-secondary/20">
                                        <span className="text-muted-foreground">Website</span>
                                        <a
                                          href={comp.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary hover:underline flex items-center gap-1"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          Visit Site <ExternalLink className="w-3 h-3 stroke-[1.5]" />
                                        </a>
                                      </div>
                                    )}
                                    {comp.phone && (
                                      <div className="flex items-center justify-between p-2 rounded bg-secondary/20">
                                        <span className="text-muted-foreground">Phone</span>
                                        <span className="font-medium">{comp.phone}</span>
                                      </div>
                                    )}
                                    {comp.employeeCount && (
                                      <div className="flex items-center justify-between p-2 rounded bg-secondary/20">
                                        <span className="text-muted-foreground">Employees</span>
                                        <span className="font-medium">{comp.employeeCount}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Code className="w-4 h-4 text-primary stroke-[1.5]" />
                                    Tech Stack
                                  </h4>
                                  {Array.isArray(comp.techStack) && comp.techStack.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {(comp.techStack as string[]).map((tech, i) => (
                                        <Badge key={i} variant="outline" className="bg-secondary/20 border-border/50">
                                          {tech}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground italic">No tech stack data available</p>
                                  )}
                                </div>
                              </div>

                              {Array.isArray(comp.topKeywords) && comp.topKeywords.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-primary stroke-[1.5]" />
                                    Top Keywords
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {(comp.topKeywords as string[]).map((kw, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {kw}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="mt-4 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCompetitor(comp.id);
                                  }}
                                >
                                  Show Less
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="text-sm text-primary font-medium">Click to view details</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>

              {/* Social Media Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-6 h-6 text-primary stroke-[1.5]" />
                  <h2 className="text-2xl font-semibold">Social Media Monitoring</h2>
                </div>

                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle>Competitor Tracking</CardTitle>
                    <CardDescription>
                      Track competitors' social media activities in real-time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Twitter className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        Monitor your competitors' social media presence, engagement metrics, and content strategy.
                      </p>
                      <Button onClick={() => setLocation(`/social-media/${analysisId}`)}>
                        <Activity className="w-4 h-4 mr-2 stroke-[1.5]" />
                        Open Social Media Monitor
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Content Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary stroke-[1.5]" />
                  <h2 className="text-2xl font-semibold">Generated Content</h2>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Blog Post */}
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-semibold">SEO Blog Post</CardTitle>
                        <CardDescription>AI-generated content optimized for keywords</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(analysis.generatedBlogPost || "")}
                          disabled={!analysis.generatedBlogPost}
                        >
                          <Copy className="w-4 h-4 stroke-[1.5]" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => regenerateContent.mutate({ id: analysisId, type: "blog" })}
                          disabled={regenerateContent.isPending}
                        >
                          <RefreshCw className={`w-4 h-4 ${regenerateContent.isPending ? "animate-spin" : ""} stroke-[1.5]`} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {analysis.generatedBlogPost ? (
                        <ScrollArea className="h-[400px] rounded-md border border-border/50 p-4 bg-card/30">
                          <div className="rich-text max-w-none">
                            <Streamdown>{analysis.generatedBlogPost as string}</Streamdown>
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No blog post generated yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Ad Copy */}
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-semibold">Ad Copy Variations</CardTitle>
                        <CardDescription>Multi-platform ad content</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => regenerateContent.mutate({ id: analysisId, type: "adCopy" })}
                        disabled={regenerateContent.isPending}
                      >
                        <RefreshCw className={`w-4 h-4 ${regenerateContent.isPending ? "animate-spin" : ""} stroke-[1.5]`} />
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {adCopy.length > 0 ? (
                        <ScrollArea className="h-[400px] pr-4">
                          <div className="space-y-4">
                            {adCopy.map((ad, i) => (
                              <div key={i} className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {ad.platform}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(`${ad.headline}\n\n${ad.description}\n\nCTA: ${ad.callToAction}`)}
                                  >
                                    <Copy className="w-3 h-3 stroke-[1.5]" />
                                  </Button>
                                </div>
                                <h4 className="font-semibold text-sm mb-1">{ad.headline}</h4>
                                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{ad.description}</p>
                                <Button size="sm" variant="secondary" className="w-full text-xs h-7">
                                  {ad.callToAction}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No ad copy generated yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
