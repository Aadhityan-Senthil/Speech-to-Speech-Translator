import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Play, Pause, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AudioRecorderProps {
  selectedModel: string;
  selectedLanguage: string;
  onTranscriptionReceived?: (transcript: string, audioUrl: string, latency: number) => void;
}

export const AudioRecorder = ({ selectedModel, selectedLanguage, onTranscriptionReceived }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please check microphone permissions.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    const startTime = Date.now();

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('model', selectedModel);
      formData.append('language', selectedLanguage);

      const { data, error } = await supabase.functions.invoke('speech-to-speech', {
        body: formData
      });

      if (error) throw error;

      const processingLatency = Date.now() - startTime;
      setLatency(processingLatency);

      if (data.audioUrl && data.transcript) {
        onTranscriptionReceived?.(data.transcript, data.audioUrl, processingLatency);
        
        // Play the response audio
        if (audioRef.current) {
          audioRef.current.src = data.audioUrl;
          audioRef.current.play();
          setIsPlaying(true);
        }

        toast({
          title: "Processing Complete",
          description: `Latency: ${processingLatency}ms`
        });
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process audio. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <Card className="p-6">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            className="w-32"
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Record
              </>
            )}
          </Button>

          {audioRef.current?.src && (
            <Button
              onClick={togglePlayback}
              variant="outline"
              size="lg"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Play
                </>
              )}
            </Button>
          )}
        </div>

        {isProcessing && (
          <div className="text-center">
            <div className="animate-pulse text-muted-foreground">
              Processing with {selectedModel}...
            </div>
          </div>
        )}

        {latency && (
          <div className="flex justify-center">
            <Badge variant="secondary">
              Latency: {latency}ms
            </Badge>
          </div>
        )}

        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};