import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  Zap,
  ArrowLeft,
  Loader2,
  Plus,
  MapPin,
  Globe,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  ArrowRight,
  FileText,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function History() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: analyses, isLoading, refetch } = trpc.analysis.list.useQuery(
    undefined,
    { enabled: true }
  );

  const deleteAnalysis = trpc.analysis.delete.useMutation({
    onSuccess: () => {
      toast.success("Analysis deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete analysis");
    }
  });

  // Auth checks removed
  // useEffect(() => { ... });
  // if (authLoading) { ... }

  const filteredAnalyses = analyses?.filter(a =>
    a.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.businessLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.industry && a.industry.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      case "pending":
      case "collecting":
      case "analyzing":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 geometric-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 low-poly-gradient pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border/50 backdrop-blur-sm sticky top-0">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
            </div>
          </div>

          <Button onClick={() => setLocation("/new-analysis")}>
            <Plus className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 py-8">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Analysis History</h1>
            <p className="text-muted-foreground">
              View and manage all your competitive intelligence reports.
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by business name, location, or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input/50"
              />
            </div>
          </div>

          {/* Analyses List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                {searchQuery ? (
                  <>
                    <p className="text-lg font-medium mb-2">No matching analyses</p>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search query
                    </p>
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">No analyses yet</p>
                    <p className="text-muted-foreground mb-4">
                      Start your first competitive analysis to see it here
                    </p>
                    <Button onClick={() => setLocation("/new-analysis")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Analysis
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAnalyses.map((analysis) => (
                <Card
                  key={analysis.id}
                  className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/analysis/${analysis.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          {getStatusIcon(analysis.status)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{analysis.businessName}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {analysis.businessLocation}
                            </span>
                            {analysis.businessUrl && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                Has Website
                              </span>
                            )}
                            {analysis.industry && (
                              <Badge variant="secondary" className="text-xs">
                                {analysis.industry}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            {analysis.status === "completed" && (
                              <>
                                {analysis.seoScore && (
                                  <span className={`${analysis.seoScore >= 70 ? "score-high" :
                                    analysis.seoScore >= 40 ? "score-medium" : "score-low"
                                    }`}>
                                    SEO: {analysis.seoScore}
                                  </span>
                                )}
                                {analysis.googleRating && (
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    {analysis.googleRating}
                                  </span>
                                )}
                              </>
                            )}
                            <span className="text-muted-foreground">
                              {new Date(analysis.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {getStatusBadge(analysis.status)}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the analysis for "{analysis.businessName}"?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteAnalysis.mutate({ id: analysis.id })}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Summary */}
          {filteredAnalyses.length > 0 && (
            <div className="mt-6 text-sm text-muted-foreground text-center">
              Showing {filteredAnalyses.length} of {analyses?.length || 0} analyses
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
