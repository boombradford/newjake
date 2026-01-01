import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  Zap,
  ArrowLeft,
  Loader2,
  Building2,
  Globe,
  MapPin,
  Briefcase,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

export default function NewAnalysis() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    businessName: "",
    businessUrl: "",
    businessLocation: "",
    industry: ""
  });

  const createAnalysis = trpc.analysis.create.useMutation({
    onSuccess: (data) => {
      toast.success("Analysis started! We're analyzing your competitive landscape.");
      setLocation(`/analysis/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start analysis");
    }
  });

  // Authentication check removed for public access
  // if (authLoading) { ... }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName.trim()) {
      toast.error("Please enter your business name");
      return;
    }
    if (!formData.businessLocation.trim()) {
      toast.error("Please enter your business location");
      return;
    }

    let businessUrl = formData.businessUrl.trim();
    if (businessUrl && !/^https?:\/\//i.test(businessUrl)) {
      businessUrl = "https://" + businessUrl;
    }

    createAnalysis.mutate({
      businessName: formData.businessName.trim(),
      businessUrl: businessUrl || undefined,
      businessLocation: formData.businessLocation.trim(),
      industry: formData.industry.trim() || undefined
    });
  };

  const analysisSteps = [
    "Discover top 5 local competitors",
    "Analyze SEO metrics and keywords",
    "Review online presence and ratings",
    "Generate AI-powered insights",
    "Create optimized content"
  ];

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
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 py-12">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <span className="text-sm text-primary font-medium">New Analysis</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Start Competitive Analysis</h1>
            <p className="text-muted-foreground">
              Enter your business details to discover and analyze your local competitors.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Form */}
            <Card className="lg:col-span-3 bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  Provide details about your business to start the analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      Business Name *
                    </Label>
                    <Input
                      id="businessName"
                      placeholder="e.g., Joe's Coffee Shop"
                      value={formData.businessName}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                      className="bg-input/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessUrl" className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      Website URL
                    </Label>
                    <Input
                      id="businessUrl"
                      type="text"
                      placeholder="example.com"
                      value={formData.businessUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessUrl: e.target.value }))}
                      className="bg-input/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional, but recommended for SEO analysis
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessLocation" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      Location *
                    </Label>
                    <Input
                      id="businessLocation"
                      placeholder="e.g., 123 Main St, Austin, TX 78701"
                      value={formData.businessLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessLocation: e.target.value }))}
                      className="bg-input/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Full address or city for local competitor discovery
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry" className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      Industry / Business Type
                    </Label>
                    <Input
                      id="industry"
                      placeholder="e.g., Coffee Shop, Restaurant, Dental Clinic"
                      value={formData.industry}
                      onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                      className="bg-input/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Helps find more relevant competitors
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full glow-primary"
                    size="lg"
                    disabled={createAnalysis.isPending}
                  >
                    {createAnalysis.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting Analysis...
                      </>
                    ) : (
                      <>
                        Start Competitive Analysis
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* What to Expect */}
            <Card className="lg:col-span-2 bg-card/50 border-border/50 h-fit">
              <CardHeader>
                <CardTitle className="text-lg">What We'll Analyze</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{step}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-border/50">
                  <p className="text-sm text-muted-foreground">
                    Analysis typically takes 2-5 minutes depending on the number of competitors found.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
