import {
  Plus,
  Zap,
  BarChart3,
  Clock,
  TrendingUp,
  ArrowRight,
  Loader2,
  FileText,
  Target,
  AlertCircle,
  LayoutGrid
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: analyses, isLoading: analysesLoading } = trpc.analysis.list.useQuery(
    undefined,
    { enabled: true }
  );

  // Auth checks removed
  // useEffect(() => { ... });
  // if (authLoading) { ... }

  const recentAnalyses = analyses?.slice(0, 5) || [];
  const completedCount = analyses?.filter(a => a.status === "completed").length || 0;
  const pendingCount = analyses?.filter(a => a.status === "pending" || a.status === "collecting" || a.status === "analyzing").length || 0;

  return (
    <div className="min-h-screen premium-gradient font-sans text-foreground">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-[url('/grid-pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="fixed inset-0 low-poly-gradient pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border/50 backdrop-blur-sm sticky top-0">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/history")}>
              History
            </Button>
            <Button onClick={() => setLocation("/new-analysis")}>
              <Plus className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 py-8">
        <div className="container">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-muted-foreground">
              Monitor your competitive landscape and track your market position.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Analyses</p>
                    <p className="text-3xl font-bold">{analyses?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-primary stroke-[1.5]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-3xl font-bold">{completedCount}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-500 stroke-[1.5]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-3xl font-bold">{pendingCount}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-500 stroke-[1.5]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Competitors Found</p>
                    <p className="text-3xl font-bold">{completedCount * 5}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-accent stroke-[1.5]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Analyses */}
            <div className="lg:col-span-2">
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Analyses</CardTitle>
                    <CardDescription>Your latest competitive intelligence reports</CardDescription>
                  </div>
                  {recentAnalyses.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setLocation("/history")}>
                      View All
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {analysesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : recentAnalyses.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No analyses yet</p>
                      <Button onClick={() => setLocation("/new-analysis")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Analysis
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentAnalyses.map((analysis) => (
                        <div
                          key={analysis.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                          onClick={() => setLocation(`/analysis/${analysis.id}`)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`status-dot ${analysis.status === "completed" ? "active" :
                              analysis.status === "failed" ? "error" : "pending"
                              }`} />
                            <div>
                              <p className="font-medium">{analysis.businessName}</p>
                              <p className="text-sm text-muted-foreground">{analysis.businessLocation}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm capitalize">{analysis.status}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(analysis.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    onClick={() => setLocation("/new-analysis")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Competitive Analysis
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setLocation("/history")}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    View Analysis History
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle>Pro Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">
                        Include your website URL for more accurate SEO comparisons with competitors.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">
                        Be specific with your location to find the most relevant local competitors.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">
                        Run analyses periodically to track changes in your competitive landscape.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
