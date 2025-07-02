import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModernSlider } from "@/components/ui/modern-slider";
import { Label } from "@/components/ui/label";
import { ModernButton } from "@/components/ui/modern-button";
import { DynamicTextRenderer, extractRelevantTerms } from "@/components/ui/DynamicTextRenderer";
import { TooltipInfoPanel } from "@/components/ui/TooltipInfoPanel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Info, BookOpen, TrendingUp } from "lucide-react";
import { modernCardVariants, springTransition } from "@/lib/modern-animations";
import { useHaptics } from "@/hooks/useHaptics";
import { useGlossary } from "@/contexts/GlossaryContext";

interface ScaleQuestionProps {
  question: {
    title: string;
    description: string;
    category: string;
    scale_min: number;
    scale_max: number;
    scale_labels: [string, string];
  };
  value: number;
  onChange: (value: number) => void;
}

export function ScaleQuestion({ question, value, onChange }: ScaleQuestionProps) {
  const { triggerHaptic } = useHaptics();
  const { terms } = useGlossary();
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);

  // Extract all relevant glossary terms from the current slide content
  const relevantTerms = useMemo(() => {
    const allText = [
      question.title,
      question.description,
      ...(Array.isArray(question.scale_labels) ? question.scale_labels : [])
    ].join(' ');
    
    return extractRelevantTerms(allText, terms);
  }, [question, terms]);

  // Calculate dynamic label styling based on slider position
  const progressPercent = (value - question.scale_min) / (question.scale_max - question.scale_min);
  
  // Opacity: Make labels fade but never disappear completely (min opacity of 0.5)
  const rightLabelOpacity = 0.5 + (progressPercent * 0.5);
  const leftLabelOpacity = 0.5 + ((1 - progressPercent) * 0.5);
  
  // Scale: Make the active label slightly larger
  const rightLabelScale = 1 + (progressPercent * 0.05);
  const leftLabelScale = 1 + ((1 - progressPercent) * 0.05);

  // Dynamic feedback text based on slider value
  const feedbackText = useMemo(() => {
    const range = question.scale_max - question.scale_min;
    const normalizedValue = (value - question.scale_min) / range;
    
    if (normalizedValue <= 0.1) return "Barely noticeable";
    if (normalizedValue <= 0.3) return "Subtle";
    if (normalizedValue <= 0.5) return "Moderate";
    if (normalizedValue <= 0.7) return "Strong";
    if (normalizedValue <= 0.9) return "Intense";
    return "Overwhelming";
  }, [value, question.scale_min, question.scale_max]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-card backdrop-blur-xl rounded-3xl p-4 sm:p-6 border border-white/20 shadow-2xl h-full flex flex-col justify-center"
    >
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="px-2 py-1 bg-blue-600/30 rounded-full text-blue-200 text-xs sm:text-sm font-medium">
            {question.category}
          </span>
          {relevantTerms.length > 0 && (
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={() => {
                triggerHaptic('selection');
                setIsInfoPanelOpen(!isInfoPanelOpen);
              }}
              className="text-blue-300 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all duration-200"
            >
              <Info size={16} />
            </ModernButton>
          )}
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
          <DynamicTextRenderer text={question.title} />
        </h3>
        <p className="text-white/70 text-sm sm:text-base leading-relaxed">
          <DynamicTextRenderer text={question.description} />
        </p>
      </div>

      {/* Inline Tooltip Info Panel */}
      <TooltipInfoPanel
        relevantTerms={relevantTerms}
        isOpen={isInfoPanelOpen}
        onOpenChange={setIsInfoPanelOpen}
        themeColor="blue"
      />

      <div className="space-y-6">
        {/* Dynamic Feedback Text */}
        <div className="h-8 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={feedbackText}
              className="text-lg font-semibold text-purple-300"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {feedbackText}
            </motion.p>
          </AnimatePresence>
        </div>

        <ModernSlider
          value={value}
          min={question.scale_min}
          max={question.scale_max}
          step={1}
          onChange={onChange}
          progressPercent={progressPercent}
        />
        
        {/* Single Set of Dynamic Visual Label Feedback */}
        {Array.isArray(question.scale_labels) && question.scale_labels.length >= 2 && (
          <div className="flex justify-between text-sm font-medium">
            <motion.span 
              className="text-white"
              animate={{ opacity: leftLabelOpacity, scale: leftLabelScale }}
              transition={{ duration: 0.2 }}
            >
              {question.scale_labels[0]}
            </motion.span>
            <motion.span 
              className="text-white"
              animate={{ opacity: rightLabelOpacity, scale: rightLabelScale }}
              transition={{ duration: 0.2 }}
            >
              {question.scale_labels[1]}
            </motion.span>
          </div>
        )}
      </div>

    </motion.div>
  );
}
