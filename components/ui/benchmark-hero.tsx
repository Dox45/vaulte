"use client";

import * as React from "react";
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Lock,
  Menu,
  Zap,
  Cpu,
  RefreshCcw,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion, useAnimation, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { title: "PRODUCTS", href: "#" },
  { title: "SOLUTIONS", href: "#" },
  { title: "DEVELOPERS", href: "#" },
  { title: "PRICING", href: "#" },
];

const labels = [
  { icon: Cpu, label: "AI Liveness Verification" },
  { icon: ShieldCheck, label: "Dynamic Trust Scoring" },
  { icon: Lock, label: "Automated Escrow" },
];

const features = [
  {
    icon: Cpu,
    label: "AI Vendor Verification",
    description: "Enterprise-grade KYC/AML using multimodal vision AI to verify identity in seconds.",
  },
  {
    icon: ShieldCheck,
    label: "Dynamic Trust Score",
    description: "Real-time reputation engine that evaluates transaction history and verification status.",
  },
  {
    icon: RefreshCcw,
    label: "Automated Escrow",
    description: "Programmatic fund locking and release via Squad API, ensuring buyer and seller protection.",
  },
];

export function BenchmarkHero() {
  const controls = useAnimation();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  React.useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  const titleWords = [
    "FINANCIAL",
    "INFRASTRUCTURE", 
    "FOR",
    "THE",
    "ECONOMY",
    "OF",
    "TRUST",
  ];

  return (
    <div className="relative overflow-hidden bg-background text-foreground font-sans">
      {/* Stripe-style Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-[radial-gradient(circle,rgba(34,88,195,0.08)_0%,transparent_70%)] blur-[100px]" />
        <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] bg-[radial-gradient(circle,rgba(34,88,195,0.05)_0%,transparent_70%)] blur-[80px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 min-h-screen flex flex-col">
        <header>
          <div className="flex h-20 items-center justify-between">
            <a href="#" className="flex items-center gap-2">
              <div className="flex items-center space-x-2">
                <div className="bg-primary p-1.5 rounded-lg">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold tracking-tight">Benchmark</span>
              </div>
            </a>

            <nav className="hidden md:flex items-center space-x-10">
              {navigationItems.map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  className="text-[13px] font-medium text-foreground/70 hover:text-primary transition-colors tracking-wide"
                >
                  {item.title}
                </a>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <Button
                variant="default"
                className="rounded-full hidden md:inline-flex px-6 bg-primary hover:bg-primary/90 text-[13px] font-semibold"
              >
                Get started <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <nav className="flex flex-col gap-6 mt-10">
                    {navigationItems.map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {item.title}
                      </a>
                    ))}
                    <Button className="rounded-full bg-primary hover:bg-primary/90">
                      Get started <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          <section className="pt-32 pb-24">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-[12px] font-bold tracking-widest uppercase"
              >
                <Zap className="h-3 w-3 fill-primary" /> Building the Intelligent Economy
              </motion.div>

              <motion.h1
                initial={{ filter: "blur(10px)", opacity: 0, y: 30 }}
                animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="font-sans text-5xl font-extrabold sm:text-6xl md:text-7xl lg:text-8xl max-w-5xl mx-auto leading-[0.9] tracking-[-0.04em] text-foreground"
              >
                {titleWords.map((text, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: index * 0.08, 
                      duration: 0.7,
                      ease: "easeOut"
                    }}
                    className="inline-block mx-1 md:mx-2"
                  >
                    {text}&nbsp;
                  </motion.span>
                ))}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="mx-auto mt-12 max-w-2xl text-xl text-foreground/60 font-medium leading-relaxed"
              >
                The API-first infrastructure that handles identity, trust, and secure payments so you can focus on building.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.8 }}
                className="mt-16 flex flex-wrap justify-center gap-12"
              >
                {labels.map((feature, index) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 1.4 + (index * 0.1), 
                      duration: 0.6
                    }}
                    className="flex items-center gap-3"
                  >
                    <div className="p-1 rounded bg-primary/10">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-[13px] font-bold text-foreground/80 tracking-tight uppercase">{feature.label}</span>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 2, 
                  duration: 0.8
                }}
                className="mt-16 flex items-center gap-4"
              >
                <Button
                  size="lg"
                  className="rounded-full px-8 bg-primary hover:bg-primary/90 text-sm font-bold shadow-xl shadow-primary/20"
                >
                  Start Integrating <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="rounded-full px-8 text-sm font-bold hover:bg-primary/5"
                >
                  Contact Sales
                </Button>
              </motion.div>
            </div>
          </section>

          <section className="pb-32" ref={ref}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 1 }}
              className="grid md:grid-cols-3 gap-0 border border-foreground/5 rounded-3xl overflow-hidden bg-white shadow-2xl shadow-black/[0.03]"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ 
                    delay: 0.3 + (index * 0.15), 
                    duration: 0.8
                  }}
                  className={`flex flex-col items-start p-10 bg-white ${index !== 2 ? 'md:border-r border-foreground/5' : ''}`}
                >
                  <div className="mb-8 rounded-xl bg-primary/5 p-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-4 text-xl font-bold tracking-tight">
                    {feature.label}
                  </h3>
                  <p className="text-foreground/50 text-[15px] leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </section>
        </main>
      </div>
    </div>
  );
}
