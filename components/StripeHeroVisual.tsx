"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowUpRight, ShieldCheck, Terminal } from "lucide-react";

interface LogItem {
  id: string;
  type: string;
  message: string;
  amount?: string;
  status: string;
  time: string;
  icon: any;
}

const INITIAL_LOGS: LogItem[] = [
  {
    id: "log-1",
    type: "payment",
    message: "Escrow funded: Project Alpha",
    amount: "+$25,000.00",
    status: "200 OK",
    time: "Just now",
    icon: CheckCircle2,
  },
  {
    id: "log-2",
    type: "api",
    message: "POST /v1/escrow/release",
    status: "succeeded",
    time: "2s ago",
    icon: Terminal,
  },
  {
    id: "log-3",
    type: "verify",
    message: "Identity Verification: Tier 3",
    status: "verified",
    time: "5s ago",
    icon: ShieldCheck,
  },
];

const ROTATING_EVENTS = [
  {
    type: "payout",
    message: "Payout routed to dest_8829",
    amount: "+$12,450.00",
    status: "completed",
    icon: ArrowUpRight,
  },
  {
    type: "payment",
    message: "Escrow deposit: Contract #402",
    amount: "+$8,900.00",
    status: "secured",
    icon: CheckCircle2,
  },
  {
    type: "api",
    message: "GET /v1/trust/contracts",
    status: "200 OK",
    icon: Terminal,
  },
  {
    type: "verify",
    message: "Smart Contract Automated Audit",
    status: "passed",
    icon: ShieldCheck,
  },
];

export function StripeHeroVisual() {
  const [logs, setLogs] = useState<LogItem[]>(INITIAL_LOGS);
  const [balance, setBalance] = useState(42850210);

  useEffect(() => {
    let counter = 0;
    const interval = setInterval(() => {
      // Pick next event
      const template = ROTATING_EVENTS[counter % ROTATING_EVENTS.length];
      counter++;

      const newLog: LogItem = {
        id: `event-${Date.now()}`,
        type: template.type,
        message: template.message,
        amount: template.amount,
        status: template.status,
        time: "Just now",
        icon: template.icon,
      };

      // Add new log at top, keep max 4 items
      setLogs((prev) => {
        const updated = prev.map((item) => ({
          ...item,
          time: item.time === "Just now" ? "2s ago" : item.time === "2s ago" ? "5s ago" : "10s ago",
        }));
        return [newLog, ...updated.slice(0, 3)];
      });

      // Increment balance slightly to simulate live volume
      if (template.amount) {
        const numeric = parseFloat(template.amount.replace(/[^0-9.]/g, ""));
        if (!isNaN(numeric)) {
          setBalance((b) => b + numeric);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto lg:max-w-none perspective-1000 lg:w-[90%]">
      {/* Spectacular Glowing Gradients Backdrop */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-primary/30 via-secondary-container/20 to-purple-500/20 rounded-3xl blur-xl opacity-60 animate-pulse -z-10" />

      {/* Overlapping Container Layout */}
      <div className="relative grid grid-cols-1 gap-4">
        
        {/* Top Code Window (Stripe IDE Style) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-[#0D1117] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative z-20"
        >
          {/* Mac Header Bar */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-white/[0.02] border-b border-white/[0.05]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
            </div>
            <span className="text-[11px] font-mono text-zinc-400 font-medium">create_escrow.js</span>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Syntax Highlighted Code Snippet */}
          <div className="p-4 font-mono text-[11px] leading-relaxed overflow-x-auto select-none">
            <div className="text-zinc-300">
              <span className="text-purple-400">const</span> benchmark = <span className="text-blue-400">require</span>(<span className="text-emerald-400">&apos;@benchmark/sdk&apos;</span>);
            </div>
            <div className="text-zinc-500 mt-2">// Create a new secure transaction</div>
            <div className="text-zinc-300 mt-0.5">
              <span className="text-purple-400">const</span> response = <span className="text-purple-400">await</span> benchmark.transactions.<span className="text-amber-400">create</span>({"({"});
            </div>
            <div className="text-zinc-300 pl-3">
              amount: <span className="text-orange-400">15000</span>,
            </div>
            <div className="text-zinc-300 pl-3">
              currency: <span className="text-emerald-400">&apos;USD&apos;</span>,
            </div>
            <div className="text-zinc-300 pl-3">
              verify_identity: <span className="text-purple-400">true</span>,
            </div>
            <div className="text-zinc-300 pl-3">
              metadata: {"{"} order_id: <span className="text-emerald-400">&apos;BC-9173&apos;</span> {"}"}
            </div>
            <div className="text-zinc-300">{"});"}</div>
            <div className="text-zinc-500 mt-2">// Output response</div>
            <div className="text-zinc-300 mt-0.5">
              <span className="text-blue-400">console</span>.<span className="text-amber-400">log</span>(response.status); <span className="text-zinc-500">// =&gt; &apos;confirmed&apos;</span>
            </div>
          </div>
        </motion.div>

        {/* Bottom Interactive API / Terminal Log Stream */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-xl relative z-10 -mt-12 ml-3 mr-[-8px]"
        >
          {/* Header Stats */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-geist">Live Trust Volume</p>
              <motion.p className="text-xl font-bold font-geist text-primary mt-0.5">
                ${balance.toLocaleString()}
                <span className="text-[11px] text-zinc-400 font-normal ml-0.5">.00</span>
              </motion.p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              API Connected
            </div>
          </div>

          {/* Animated Log Feed */}
          <div className="space-y-2 h-[152px] overflow-hidden select-none">
            <AnimatePresence initial={false}>
              {logs.map((log) => {
                const IconComponent = log.icon;
                return (
                  <motion.div
                    key={log.id}
                    layout
                    initial={{ opacity: 0, y: -16, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.35, type: "spring", bounce: 0.1 }}
                    className="flex items-center justify-between p-2 px-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800/80"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary shrink-0">
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 truncate font-geist leading-tight">
                          {log.message}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-zinc-400">{log.time}</span>
                          <span className="text-[9px] text-zinc-300 dark:text-zinc-600">•</span>
                          <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 font-medium">
                            {log.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {log.amount && (
                      <span className="text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400 shrink-0 ml-1.5">
                        {log.amount}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
