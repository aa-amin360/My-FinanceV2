"use client";

import React from "react";
import { 
  Home, Bike, Car, Laptop, Plane, Heart, 
  GraduationCap, Stethoscope, Smartphone, 
  Utensils, ShoppingBag, Gift, Wallet, Target,
  Palmtree, Camera, Pizza, Watch, Gem, Baby, 
  Church, HardHat, Sofa, Dumbbell
} from "lucide-react";

type Goal = {
  id: number;
  name: string;
  target_amount: string;
  current_amount: string;
};

// ADVANCED SEMANTIC MAPPING
const getGoalIcon = (name: string) => {
  const n = name.toLowerCase();

  // 1. Tech & Gadgets (Move this up to prioritize specific tech)
  if (match(n, ["laptop", "macbook", "pc", "computer", "gaming", "ps5", "console", "gpu", "monitor", "setup"])) return Laptop;
  if (match(n, ["phone", "iphone", "samsung", "mobile", "pixel", "airpods", "tablet", "ipad"])) return Smartphone;
  if (match(n, ["camera", "dslr", "lens", "sony", "canon", "vlog", "video"])) return Camera;
  if (match(n, ["watch", "rolex", "smartwatch", "apple watch", "casio"])) return Watch;

  // 2. Shelter & Living
  // Changed "apt" to a whole-word check to prevent matching "laptop"
  if (match(n, ["home", "house", "flat", "apartment", "rent", "land", "plot", "building", "room"])) return Home;
  if (match(n, ["sofa", "bed", "furniture", "fridge", "tv", "ac", "decor", "curtain"])) return Sofa;

  // 3. Transport
  if (match(n, ["bike", "cycle", "motor", "scooter", "yamaha", "r15", "vespa", "helmet"])) return Bike;
  if (match(n, ["car", "toyota", "civic", "bmw", "tesla", "jeep", "suv", "driving"])) return Car;

  // 4. Travel & Religion
  if (match(n, ["travel", "trip", "tour", "vacation", "flight", "passport", "visa", "hotel"])) return Plane;
  if (match(n, ["beach", "island", "cox", "sajek", "bali", "thailand", "resort"])) return Palmtree;
  if (match(n, ["hajj", "umrah", "makkah", "madinah", "prayer", "eid", "qurbani", "ramadan"])) return Church;

  // 5. Life Events & People
  if (match(n, ["wedding", "marriage", "anniversary", "engagement", "love", "wife", "husband"])) return Heart;
  if (match(n, ["baby", "child", "son", "daughter", "kid", "toy", "diaper"])) return Baby;
  if (match(n, ["gift", "birthday", "present", "surprise"])) return Gift;

  // 6. Health & Self
  if (match(n, ["health", "medical", "doctor", "hospital", "surgery", "medicine", "checkup"])) return Stethoscope;
  if (match(n, ["gym", "workout", "fitness", "yoga", "sport", "football", "cricket"])) return Dumbbell;

  // 7. Education
  if (match(n, ["study", "uni", "school", "college", "course", "degree", "exam", "book", "admission"])) return GraduationCap;

  // 8. Lifestyle
  if (match(n, ["food", "eat", "restaurant", "dinner", "treat", "buffet", "cafe"])) return Utensils;
  if (match(n, ["shopping", "clothes", "mall", "shoes", "fashion", "dress"])) return ShoppingBag;
  if (match(n, ["gold", "jewelry", "diamond", "ring", "chain", "investment"])) return Gem;

  return Target; 
};

const match = (str: string, keys: string[]) => {
  return keys.some(key => {
    const regex = new RegExp(`\\b${key}\\b`, "i"); // Checks for the exact word
    return regex.test(str);
  });
};

export default function SavingsVault({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
           <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500">Savings Vault</h3>
        </div>
      </div>

      {/* ✅ PREMIUM GLASS TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {goals.map((goal) => {
          const Icon = getGoalIcon(goal.name);
          const current = Number(goal.current_amount);
          const target = Number(goal.target_amount);
          const progress = Math.min((current / target) * 100, 100);

          return (
            <div 
              key={goal.id}
              className="group relative aspect-square rounded-[40px] overflow-hidden bg-white/45 dark:bg-black/35 border border-black/[0.05] dark:border-white/[0.04] backdrop-blur-md transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-indigo-500/10"
            >
              {/* THE LIQUID FILL EFFECT */}
              <div 
                className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-indigo-500/10 to-indigo-500/30 transition-all duration-[1.5s] ease-out z-0"
                style={{ height: `${progress}%` }}
              />

              {/* Liquid Surface Glow */}
              <div 
                className="absolute left-0 w-full h-[2px] bg-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all duration-[1.5s] ease-out z-10"
                style={{ bottom: `${progress}%` }}
              />

              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-between z-20">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 group-hover:scale-110 transition-transform duration-500">
                    <Icon size={24} className="text-black dark:text-white group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-indigo-500 leading-none">{progress.toFixed(0)}%</span>
                    <div className="w-6 h-[2px] bg-indigo-500/20 mt-1 rounded-full" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-black dark:text-white truncate leading-tight">
                    {goal.name}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 tracking-wide font-mono">
                    {Math.round(current).toLocaleString()} / {Math.round(target / 1000)}k Tk
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}