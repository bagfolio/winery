import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MultipleChoiceQuestion } from "@/components/questions/MultipleChoiceQuestion";
import { ScaleQuestion } from "@/components/questions/ScaleQuestion";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import { useHaptics } from "@/hooks/useHaptics";
import { apiRequest } from "@/lib/queryClient";
import { Menu, Users, BadgeCheck, CloudOff, ArrowLeft, ArrowRight, X, CheckCircle, Clock, Pause } from "lucide-react";
import type { Slide, Participant, Session } from "@shared/schema";

export default function TastingSession() {
  const { sessionId, participantId } = useParams();
  const [, setLocation] = useLocation();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completedSlides, setCompletedSlides] = useState<number[]>([]);
  const { saveResponse, syncStatus, initializeForSession, endSession } = useSessionPersistence();
  const { triggerHaptic } = useHaptics();
  const queryClient = useQueryClient();

  // Initialize session storage when component mounts
  useEffect(() => {
    if (sessionId && participantId) {
      initializeForSession(sessionId, participantId);
    }
  }, [sessionId, participantId, initializeForSession]);

  // Get session details including status
  const { data: currentSession, isLoading: sessionDetailsLoading } = useQuery<Session & { packageCode?: string }>({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
    refetchInterval: 3000, // Refetch every 3 seconds to check status
  });

  // Get participant data
  const { data: participant } = useQuery<Participant>({
    queryKey: [`/api/participants/${participantId}`],
    enabled: !!participantId
  });

  // Get session slides - use dynamic package code from session
  const { data: slidesData, isLoading } = useQuery<{ slides: Slide[]; totalCount: number }>({
    queryKey: [`/api/packages/${currentSession?.packageCode}/slides`, participantId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/packages/${currentSession?.packageCode}/slides?participantId=${participantId}`, null);
      return response.json();
    },
    enabled: !!currentSession?.packageCode && !!participantId
  });

  // Get participant responses
  const { data: responses } = useQuery({
    queryKey: [`/api/participants/${participantId}/responses`],
    enabled: !!participantId
  });

  // Save response mutation
  const saveResponseMutation = useMutation({
    mutationFn: async ({ slideId, answerJson }: { slideId: string; answerJson: any }) => {
      await saveResponse(participantId!, slideId, answerJson);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/participants/${participantId}/responses`] });
    }
  });

  const slides = slidesData?.slides || [];
  const currentSlide = slides[currentSlideIndex];
  const progress = slides.length > 0 ? ((currentSlideIndex + 1) / slides.length) * 100 : 0;

  const handleAnswerChange = (slideId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [slideId]: answer }));
    // Auto-save response
    saveResponseMutation.mutate({ slideId, answerJson: answer });
  };

  const handleNext = () => {
    // Mark current slide as completed
    if (!completedSlides.includes(currentSlideIndex)) {
      setCompletedSlides(prev => [...prev, currentSlideIndex]);
    }
    
    if (currentSlideIndex < slides.length - 1) {
      triggerHaptic('navigation');
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      // Session completed
      triggerHaptic('success');
      completeSession();
    }
  };

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      triggerHaptic('navigation');
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const completeSession = () => {
    // Mark final slide as completed
    if (!completedSlides.includes(currentSlideIndex)) {
      setCompletedSlides(prev => [...prev, currentSlideIndex]);
    }

    // Calculate final progress and session data
    const finalProgress = Math.round(((completedSlides.length + 1) / slides.length) * 100);
    
    // Save session to user profile if user is authenticated
    // For now, redirect to a completion summary
    setLocation(`/completion/${sessionId}/${participantId}?progress=${finalProgress}`);
  };

  const renderQuestion = (slide: Slide) => {
    const payload = slide.payloadJson as any;
    const answer = answers[slide.id] || {};

    switch (payload.question_type) {
      case 'multiple_choice':
        return (
          <MultipleChoiceQuestion
            question={payload}
            value={{ selected: answer.selected || [], notes: answer.notes }}
            onChange={(value) => handleAnswerChange(slide.id, value)}
          />
        );
      case 'scale':
        return (
          <ScaleQuestion
            question={payload}
            value={answer.value || payload.scale_min}
            onChange={(value) => handleAnswerChange(slide.id, { value })}
          />
        );
      default:
        return null;
    }
  };

  const renderSlideContent = (slide: Slide) => {
    const payload = slide.payloadJson as any;

    if (slide.type === 'interlude') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          {/* Wine Image */}
          {payload.wine_image && (
            <div className="mb-8">
              <img
                src={payload.wine_image}
                alt={payload.wine_name || "Wine"}
                className="w-48 h-72 mx-auto rounded-2xl shadow-2xl object-cover"
              />
            </div>
          )}

          <div className="bg-gradient-card backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-4">{payload.title}</h2>
            {payload.wine_name && (
              <h3 className="text-xl text-purple-200 mb-4">{payload.wine_name}</h3>
            )}
            <p className="text-white/70 text-lg">{payload.description}</p>
          </div>
        </motion.div>
      );
    }

    if (slide.type === 'question') {
      return renderQuestion(slide);
    }

    // Handle video messages from sommeliers
    if (slide.type === 'video_message') {
      if (!payload.video_url) {
        return <div className="text-white text-center p-4">Video URL missing for this slide.</div>;
      }
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 bg-gradient-card backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-xl"
        >
          {payload.title && <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">{payload.title}</h2>}
          {payload.description && <p className="text-white/70 text-center mb-4">{payload.description}</p>}
          <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg mx-auto max-w-2xl">
            <video
              src={payload.video_url}
              controls={payload.show_controls !== undefined ? payload.show_controls : true}
              autoPlay={payload.autoplay || false}
              poster={payload.poster_url}
              className="w-full h-full object-contain"
              playsInline
            />
          </div>
        </motion.div>
      );
    }

    // Handle audio messages from sommeliers
    if (slide.type === 'audio_message') {
      if (!payload.audio_url) {
        return <div className="text-white text-center p-4">Audio URL missing for this slide.</div>;
      }
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 bg-gradient-card backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-xl"
        >
          {payload.title && <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">{payload.title}</h2>}
          {payload.description && <p className="text-white/70 text-center mb-4">{payload.description}</p>}
          <div className="flex justify-center">
            <audio
              src={payload.audio_url}
              controls={payload.show_controls !== undefined ? payload.show_controls : true}
              autoPlay={payload.autoplay || false}
              className="w-full max-w-md rounded-lg"
            />
          </div>
        </motion.div>
      );
    }

    // Handle media slides (images)
    if (slide.type === 'media' && payload.image_url) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-gradient-card backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-xl"
        >
          {payload.title && <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{payload.title}</h2>}
          <img 
            src={payload.image_url} 
            alt={payload.alt_text || 'Media content'} 
            className="w-full max-w-md mx-auto rounded-lg shadow-lg"
          />
        </motion.div>
      );
    }

    console.warn("Unsupported slide type or missing media URL for slide:", slide);
    return <div className="text-white text-center p-4">Unsupported slide type: {slide.type} or missing media content.</div>;
  };

  if (isLoading || sessionDetailsLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-white">Loading session...</div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gradient-primary flex flex-col items-center justify-center text-white p-8">
        <X size={48} className="mb-4 text-red-300" />
        <h2 className="text-2xl font-semibold mb-2">Session Not Found</h2>
        <p className="text-purple-200 text-center">This session does not exist or has been removed.</p>
      </div>
    );
  }

  // Check session status and display appropriate messages for non-active states
  if (currentSession.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-primary flex flex-col items-center justify-center text-white p-8">
        <Clock size={48} className="mb-4 text-purple-300" />
        <h2 className="text-2xl font-semibold mb-2">Session Starting Soon</h2>
        <p className="text-purple-200 text-center">Please wait for the host to begin the tasting.</p>
      </div>
    );
  }

  if (currentSession.status === 'paused') {
    return (
      <div className="min-h-screen bg-gradient-primary flex flex-col items-center justify-center text-white p-8">
        <Pause size={48} className="mb-4 text-yellow-300" />
        <h2 className="text-2xl font-semibold mb-2">Session Paused</h2>
        <p className="text-purple-200 text-center">The host has currently paused the tasting. Please wait.</p>
      </div>
    );
  }

  if (currentSession.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-primary flex flex-col items-center justify-center text-white p-8">
        <CheckCircle size={48} className="mb-4 text-green-300" />
        <h2 className="text-2xl font-semibold mb-2">Session Completed</h2>
        <p className="text-purple-200 text-center">This tasting session has ended. Thank you!</p>
      </div>
    );
  }

  if (currentSession.status !== 'active') {
    return (
      <div className="min-h-screen bg-gradient-primary flex flex-col items-center justify-center text-white p-8">
        <Clock size={48} className="mb-4 text-purple-300" />
        <h2 className="text-2xl font-semibold mb-2">Waiting for Session</h2>
        <p className="text-purple-200 text-center">Waiting for session to become active...</p>
      </div>
    );
  }

  // Only render tasting content if session is active
  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Progress Header */}
      <div className="sticky top-0 z-50 bg-gradient-primary/90 backdrop-blur-xl border-b border-white/10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 hover:bg-white/10 text-white"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu size={20} />
              </Button>
              <div>
                <h2 className="text-white font-semibold">
                  {currentSlide?.type === 'interlude' 
                    ? (currentSlide.payloadJson as any).wine_name || "Wine Tasting"
                    : `Question ${currentSlideIndex + 1}`
                  }
                </h2>
                <p className="text-white/60 text-sm">
                  {currentSlideIndex + 1} of {slides.length}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Sync Status */}
              <div className="flex items-center space-x-1 text-white/60 text-sm">
                {syncStatus === 'synced' ? (
                  <>
                    <BadgeCheck className="text-green-400" size={16} />
                    <span>Synced</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="text-yellow-400" size={16} />
                    <span>Syncing...</span>
                  </>
                )}
              </div>
              {/* Participants Count */}
              <div className="flex items-center space-x-1 text-white/60 text-sm">
                <Users size={16} />
                <span>1</span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <Progress value={progress} className="h-2 bg-white/20" />
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-gradient-primary/95 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 z-40 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold text-lg">Progress Overview</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-white/10 text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={16} />
            </Button>
          </div>

          <div className="space-y-3">
            {slides.map((slide, index) => {
              const isCompleted = completedSlides.includes(index);
              const isCurrent = index === currentSlideIndex;
              const isAccessible = index <= currentSlideIndex || isCompleted;
              
              return (
                <div
                  key={slide.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isCurrent 
                      ? 'bg-white/20 border-white/30 text-white' 
                      : isCompleted
                        ? 'bg-green-500/20 border-green-400/30 text-green-200 hover:bg-green-500/30'
                        : isAccessible
                          ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                          : 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (isAccessible) {
                      setCurrentSlideIndex(index);
                      setSidebarOpen(false);
                      triggerHaptic('navigation');
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        isCompleted ? 'bg-green-500 text-white' : 'bg-white/20 text-white'
                      }`}>
                        {isCompleted ? <CheckCircle size={14} /> : index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {slide.type === 'interlude' ? 'Introduction' : `Question ${index}`}
                        </p>
                        <p className="text-xs opacity-75 truncate">
                          {(slide.payloadJson as any).title || 'Wine Information'}
                        </p>
                      </div>
                    </div>
                    {isCurrent && <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white">
                <span>Completed:</span>
                <span className="font-semibold">{completedSlides.length}/{slides.length}</span>
              </div>
              <div className="flex justify-between text-white">
                <span>Progress:</span>
                <span className="font-semibold">{Math.round((completedSlides.length / slides.length) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Question Content */}
      <div className="p-6 pb-32">
        <div className="max-w-md mx-auto">
          {currentSlide && renderSlideContent(currentSlide)}
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-primary/95 backdrop-blur-xl border-t border-white/10 p-6">
        <div className="max-w-md mx-auto flex space-x-4">
          <Button
            onClick={handlePrevious}
            disabled={currentSlideIndex === 0}
            variant="outline"
            className="flex-1 py-4 px-6 bg-white/20 border-white/20 text-white hover:bg-white/30 disabled:opacity-50"
          >
            <ArrowLeft className="mr-2" size={16} />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 py-4 px-6 bg-gradient-button text-white font-semibold shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
          >
            {currentSlideIndex === slides.length - 1 ? 'Finish' : 'Next'}
            <ArrowRight className="ml-2" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
