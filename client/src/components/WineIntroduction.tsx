import { motion } from "framer-motion";
import { Wine, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WineIntroductionProps {
  wine: {
    wineName: string;
    wineDescription?: string;
    wineImageUrl?: string;
    position: number;
  };
  isFirstWine?: boolean;
  onContinue: () => void;
}

export function WineIntroduction({ wine, isFirstWine, onContinue }: WineIntroductionProps) {
  return (
    <div className="min-h-[100dvh] relative overflow-auto">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-amber-900 via-orange-900 to-red-900">
        {/* Orange overlay removed for better mobile visibility */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 30% 40%, rgba(251, 191, 36, 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 70% 60%, rgba(245, 158, 11, 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 30%, rgba(251, 191, 36, 0.15) 0%, transparent 50%)",
            ]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Floating wine elements */}
      <div className="fixed inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            animate={{
              y: [-20, -120],
              opacity: [0, 0.3, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeOut",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${100 + Math.random() * 20}%`,
            }}
          >
            <Wine className="w-3 h-3 text-amber-300/30" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 min-h-[100dvh] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          className="max-w-4xl w-full text-center py-4 sm:py-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Introduction Badge */}
          <motion.div
            className="mb-4 sm:mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <div className="inline-flex items-center space-x-2 sm:space-x-3 bg-white/10 backdrop-blur-xl rounded-full px-3 sm:px-6 py-2 sm:py-3 border border-white/30">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 sm:w-6 h-5 sm:h-6 text-amber-300" />
              </motion.div>
              <span className="text-white text-sm sm:text-base font-semibold">
                {isFirstWine || wine.position === 0 ? "Welcome to Your Wine Tasting" : `Introducing Wine ${wine.position}`}
              </span>
            </div>
          </motion.div>

          {/* Wine Showcase */}
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-center mb-4 sm:mb-6">
            {/* Wine Image */}
            <motion.div
              className="order-2 lg:order-1 flex justify-center"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {wine.wineImageUrl ? (
                <div className="relative">
                  <div className="w-48 h-56 sm:w-56 sm:h-64 lg:w-72 lg:h-80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-4 sm:border-6 lg:border-8 border-white/20">
                    <img 
                      src={wine.wineImageUrl} 
                      alt={wine.wineName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -inset-8 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-3xl blur-2xl -z-10" />
                  
                  {/* Floating elements around wine */}
                  {wine.position > 0 && (
                    <motion.div
                      className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                      animate={{ y: [-5, 5, -5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <span className="text-white font-bold text-lg">{wine.position}</span>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="w-48 h-56 sm:w-56 sm:h-64 lg:w-72 lg:h-80 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-600/40 to-orange-600/40 flex items-center justify-center border-4 sm:border-6 lg:border-8 border-white/20 backdrop-blur-sm">
                    <Wine className="w-32 h-32 text-white/60" />
                  </div>
                  {wine.position > 0 && (
                    <motion.div
                      className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                      animate={{ y: [-5, 5, -5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <span className="text-white font-bold text-lg">{wine.position}</span>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Wine Details */}
            <motion.div
              className="order-1 lg:order-2 space-y-3 sm:space-y-4 text-left px-2 sm:px-0"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <div className="space-y-1 sm:space-y-2">
                <motion.p
                  className="text-amber-300 text-sm sm:text-base font-medium tracking-wide uppercase"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 0.6 }}
                >
                  {wine.position > 0 ? `Wine ${wine.position}` : "Package Introduction"}
                </motion.p>
                
                <motion.h1
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                >
                  {wine.wineName}
                </motion.h1>
              </div>
              
              {wine.wineDescription && (
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4, duration: 0.8 }}
                >
                  <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"></div>
                  <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-lg">
                    {wine.wineDescription}
                  </p>
                </motion.div>
              )}

              <motion.div
                className="pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.8 }}
              >
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <div className="px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full border border-amber-400/30">
                    <span className="text-amber-200 text-xs sm:text-sm font-medium">Wine Tasting</span>
                  </div>
                  {wine.position > 0 && (
                    <div className="px-3 sm:px-4 py-2 bg-white/10 rounded-full border border-white/30">
                      <span className="text-white/90 text-xs sm:text-sm font-medium">Position {wine.position}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Continue Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 2, duration: 0.8 }}
          >
            <Button
              onClick={onContinue}
              size="lg"
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0 shadow-2xl px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-105 min-h-[44px]"
            >
              <span>Begin Tasting</span>
              <ArrowRight className="w-5 sm:w-6 h-5 sm:h-6 ml-2 sm:ml-3" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}