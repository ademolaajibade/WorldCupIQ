"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const premiumFeatures = [
  "10 questions per Quick Play (vs 5 free)",
  "Choose difficulty: Easy, Medium, or Hard",
  "Choose category: Players, History, Stats, Venues, Rules & more",
  "Streak shields — miss a day without losing your streak",
  "Country & friends leaderboard",
  "All trivia packs unlocked",
  "Detailed performance analytics",
  "Priority support",
];

const tournamentFeatures = [
  "Everything in Premium",
  "One-time payment — no subscription",
  "Valid for the full 2026 tournament",
  "Exclusive tournament-only challenges",
  "World Cup 2026 prediction game",
  "Special badge & achievement",
];

interface PlanCardProps {
  title: string;
  price: { ng: string; intl: string };
  period: string;
  features: string[];
  badge?: string;
  isPopular?: boolean;
  plan: "premium" | "tournament_pass";
  currentPlan: string;
  onSelect: (plan: "premium" | "tournament_pass") => void;
  loading: boolean;
  isNigerian: boolean;
}

function PlanCard({
  title,
  price,
  period,
  features,
  badge,
  isPopular,
  plan,
  currentPlan,
  onSelect,
  loading,
  isNigerian,
}: PlanCardProps) {
  const isActive = currentPlan === plan;
  return (
    <Card
      className={cn(
        "relative border-border bg-card transition-all",
        isPopular && "border-primary shadow-lg shadow-primary/10",
      )}
    >
      {isPopular && (
        <div className="absolute left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3">
            Most popular
          </Badge>
        </div>
      )}
      {badge && (
        <div className="absolute left-1/2 -translate-x-1/2">
          <Badge className="bg-accent text-accent-foreground px-3">
            {badge}
          </Badge>
        </div>
      )}
      <CardHeader className="pt-8 pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="mt-3">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold">
              {isNigerian ? `₦${price.ng}` : price.intl}
            </span>
            <span className="text-muted-foreground text-sm">/ {period}</span>
          </div>
          {/* <p className="text-xs text-muted-foreground mt-1">
            {isNigerian ? price.intl : `₦${price.ng}`} for{" "}
            {isNigerian ? "international" : "Nigerian"} users
          </p> */}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm">
              <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
        <Button
          className={cn(
            "w-full",
            isPopular && "bg-primary",
            badge && "bg-accent text-accent-foreground hover:bg-accent/90",
          )}
          onClick={() => onSelect(plan)}
          disabled={isActive || loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isActive ? "Current plan" : `Get ${title}`}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function UpgradePage() {
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<
    "premium" | "tournament_pass" | null
  >(null);

  const payMutation = useMutation({
    mutationFn: (plan: "premium" | "tournament_pass") =>
      api.post("/payments/initialize", { plan }),
    onSuccess: (res) => {
      const url = res.data.redirectUrl ?? res.data.paymentUrl;
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Payment URL not received");
      }
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message ?? "Payment initialization failed",
      );
      setSelectedPlan(null);
    },
  });

  function handleSelect(plan: "premium" | "tournament_pass") {
    setSelectedPlan(plan);
    payMutation.mutate(plan);
  }

  const currentPlan = user?.subscription?.plan ?? "free";
  const isNigerian = user?.country === "NG";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-10 text-center">
        <Badge className="mb-3 bg-accent/20 text-accent">Upgrade</Badge>
        <h1 className="text-3xl font-extrabold">
          Unlock the full WorldCupIQ experience
        </h1>
        <p className="mt-3 text-muted-foreground">
          Difficulty selection, streak shields, category filters, country
          leaderboards, and more.
        </p>
        {user?.country && (
          <p className="mt-1 text-xs text-muted-foreground">
            Payments for {user.country === "NG" ? "Nigeria" : "your region"}{" "}
            processed by{" "}
            <strong>
              {user.country === "NG" ? "Paystack" : "Flutterwave"}
            </strong>
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <PlanCard
          title="Premium"
          price={{ ng: "2,500/mo", intl: "$1.99" }}
          period="month"
          features={premiumFeatures}
          isPopular
          plan="premium"
          currentPlan={currentPlan}
          onSelect={handleSelect}
          loading={payMutation.isPending && selectedPlan === "premium"}
          isNigerian={isNigerian}
        />
        <PlanCard
          title="Tournament Pass"
          price={{ ng: "7,000", intl: "$5.49" }}
          period="one-time"
          features={tournamentFeatures}
          badge="Best value"
          plan="tournament_pass"
          currentPlan={currentPlan}
          onSelect={handleSelect}
          loading={payMutation.isPending && selectedPlan === "tournament_pass"}
          isNigerian={isNigerian}
        />
      </div>

      <Separator className="my-10" />

      {/* Free vs premium comparison */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold">Free vs Premium</h2>
      </div>
      <Card className="border-border bg-card overflow-hidden">
        <div className="grid grid-cols-3 text-sm">
          <div className="col-span-1 p-4 font-medium">Feature</div>
          <div className="p-4 text-center font-medium text-muted-foreground border-l border-border">
            Free
          </div>
          <div className="p-4 text-center font-medium text-primary border-l border-border">
            Premium
          </div>
        </div>
        <Separator />
        {[
          ["Daily Challenge (10 Qs)", true, true],
          ["Quick Play", "5 Qs", "10 Qs"],
          ["Answer explanations", true, true],
          ["Global Leaderboard", true, true],
          ["Difficulty selection", false, true],
          ["Category selection", false, true],
          ["Streak shields", false, true],
          ["Country Leaderboard", false, true],
          ["Friends Leaderboard", false, true],
          ["Trivia Packs (50+)", false, true],
          ["Performance Analytics", false, true],
        ].map(([feature, free, premium], i) => (
          <div
            key={i}
            className={cn(
              "grid grid-cols-3 text-sm",
              i % 2 === 0 && "bg-muted/30",
            )}
          >
            <div className="col-span-1 p-4">{feature}</div>
            <div className="p-4 text-center border-l border-border text-muted-foreground">
              {free === true ? (
                <Check className="h-4 w-4 text-primary mx-auto" />
              ) : free === false ? (
                "—"
              ) : (
                free
              )}
            </div>
            <div className="p-4 text-center border-l border-border">
              {premium === true ? (
                <Check className="h-4 w-4 text-primary mx-auto" />
              ) : premium === false ? (
                "—"
              ) : (
                premium
              )}
            </div>
          </div>
        ))}
      </Card>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Secure payment processing. Cancel anytime. Questions?{" "}
        <a
          href="mailto:support@worldcupiq.com"
          className="text-primary hover:underline"
        >
          Contact support
        </a>
      </p>
    </div>
  );
}
