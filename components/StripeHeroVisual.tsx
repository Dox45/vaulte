// app/StripeHeroVisual.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ShieldCheck, Terminal, UserCheck, DollarSign, AlertCircle } from "lucide-react";

interface LogItem {
  id: string;
  type: string;
  message: string;
  detail?: string;
  status: string;
  time: string;
  icon: any;
}

// Realistic logs that match Benchmark's actual flows
const INITIAL_LOGS: LogItem[] = [
  {
    id: "log-1",
    type: "escrow",
    message: "Escrow funded via Squad VA",
    detail: "₦45,000.00",
    status: "secured",
    time: "Just now",
    icon: CheckCircle2,
  },
  {
    id: "log-2",
    type: "api",
    message: "POST /escrow/create",
    status: "201 Created",
    time: "2s ago",
    icon: Terminal,
  },
  {
    id: "log-3",
    type: "verify",
    message: "Vendor verification passed",
    detail: "Face liveness + NIN match",
    status: "Trust Score: 82",
    time: "5s ago",
    icon: ShieldCheck,
  },
];

const ROTATING_EVENTS = [
  {
    type: "escrow",
    message: "Funds released to vendor",
    detail: "₦12,450.00",
    status: "transfer.success",
    icon: DollarSign,
  },
  {
    type: "webhook",
    message: "Squad webhook received",
    detail: "charge.successful",
    status: "200 OK",
    icon: Terminal,
  },
  {
    type: "verify",
    message: "AI liveness verification",
    detail: "Blink + head turn detected",
    status: "confidence: 0.94",
    icon: UserCheck,
  },
  {
    type: "dispute",
    message: "Dispute auto-resolved",
    detail: "distilBERT confidence: 91%",
    status: "refund_triggered",
    icon: AlertCircle,
  },
  {
    type: "escrow",
    message: "New escrow created",
    detail: "₦28,500.00",
    status: "pending",
    icon: CheckCircle2,
  },
  {
    type: "webhook",
    message: "transfer.success",
    detail: "Vendor account credited",
    status: "completed",
    icon: ShieldCheck,
  },
];

export function StripeHeroVisual() {
  const [logs, setLogs] = useState<LogItem[]>(INITIAL_LOGS);
  const [totalProtected, setTotalProtected] = useState(285420);

  useEffect(() => {
    let counter = 0;
    const interval = setInterval(() => {
      const template = ROTATING_EVENTS[counter % ROTATING_EVENTS.length];
      counter++;

      const newLog: LogItem = {
        id: `event-${Date.now()}`,
        type: template.type,
        message: template.message,
        detail: template.detail,
        status: template.status,
        time: "Just now",
        icon: template.icon,
      };

      setLogs((prev) => {
        const updated = prev.map((item) => ({
          ...item,
          time: item.time === "Just now" ? "2s ago" : item.time === "2s ago" ? "5s ago" : "10s ago",
        }));
        return [newLog, ...updated.slice(0, 3)];
      });

      if (template.detail && template.detail.startsWith("₦")) {
        const numeric = parseInt(template.detail.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(numeric)) {
          setTotalProtected((prev) => prev + numeric);
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-sm sm:max-w-md mx-auto lg:max-w-none">
      {/* Glowing background effect */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-[#635bff]/30 via-[#635bff]/10 to-purple-500/20 rounded-3xl blur-xl opacity-60 animate-pulse -z-10" />

      <div className="relative grid grid-cols-1 gap-3 sm:gap-4">
        {/* Code Window */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-[#0D1117] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
        >
          {/* Mac Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border-b border-white/[0.05]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono text-zinc-400 font-medium truncate px-2">squadbenchjs → Benchmark</span>
            <div className="w-6 sm:w-10" />
          </div>

          {/* Code */}
          <div className="p-3 sm:p-4 font-mono text-[10px] sm:text-[11px] leading-relaxed overflow-x-auto">
            <pre className="text-zinc-300 whitespace-pre-wrap">
{`const Benchmark = require('squadbenchjs');

const benchmark = new Benchmark({
  apiKey: process.env.BENCHMARK_API_KEY
});

// Create escrow with Squad VA
const escrow = await benchmark.escrow.create({
  vendor_id: 'vendor_abc123',
  amount: 45000,
  item_description: 'Smartphone',
  buyer_phone: '+2348012345678'
});

console.log(escrow.checkout_url);
// → https://checkout.squadco.com/pay/...`}
            </pre>
          </div>
        </motion.div>

        {/* Live Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-3 sm:p-4 shadow-xl -mt-8 sm:-mt-10 mx-2 sm:mx-3"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800 gap-2">
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Escrow Protected</p>
              <motion.p className="text-lg sm:text-xl font-bold text-[#151d1e]">
                ₦{totalProtected.toLocaleString()}
              </motion.p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-full text-emerald-600 text-[10px] sm:text-[11px] font-medium self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Squad API Connected
            </div>
          </div>

          {/* Log Feed */}
          <div className="space-y-2 h-[140px] sm:h-[152px] overflow-hidden">
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
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800/80 gap-1 sm:gap-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#635bff]/10 flex items-center justify-center text-[#635bff] shrink-0">
                        <IconComponent className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-[11px] font-semibold text-zinc-900 truncate">
                          {log.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                          <span className="text-[8px] sm:text-[9px] text-zinc-400">{log.time}</span>
                          {log.detail && (
                            <>
                              <span className="text-[8px] sm:text-[9px] text-zinc-300">•</span>
                              <span className="text-[8px] sm:text-[9px] font-mono text-[#635bff]">{log.detail}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-8 sm:ml-0">
                      <span className="text-[9px] sm:text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {log.status}
                      </span>
                    </div>
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