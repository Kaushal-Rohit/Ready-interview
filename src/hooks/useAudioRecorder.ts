"use client";

import { useState, useCallback, useRef } from "react";

interface AudioRecorderState {
  isRecording: boolean;
  audioBlob: Blob | null;
  error: string | null;
  duration: number;
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    audioBlob: null,
    error: null,
    duration: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Release mic hardware
  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // LAZY initialization — only acquires mic on explicit user action
  const startRecording = useCallback(async () => {
    try {
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Pick a supported MIME type
      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        mimeType = "audio/ogg;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Compile all chunks into a single Blob with the correct MIME type
        const recordedChunks = chunksRef.current;
        if (recordedChunks.length === 0) {
          setState((prev) => ({
            ...prev,
            isRecording: false,
            audioBlob: null,
            error: "No audio data captured. Please try again.",
          }));
          releaseStream();
          return;
        }

        const blob = new Blob(recordedChunks, { type: mimeType });
        releaseStream();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        setState((prev) => ({
          ...prev,
          isRecording: false,
          audioBlob: blob,
        }));
      };

      mediaRecorderRef.current = mediaRecorder;

      // DON'T use timeslice — let the browser buffer internally.
      // Only fire ondataavailable once on stop for a clean single blob.
      mediaRecorder.start();

      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 1000);

      setState({
        isRecording: true,
        audioBlob: null,
        error: null,
        duration: 0,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error:
          err instanceof Error
            ? err.message
            : "Microphone access denied. Please allow microphone permissions.",
      }));
    }
  }, [releaseStream]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      // onstop handler will create the blob and release the stream
    }
  }, []);

  // Full cleanup — stops recording AND releases stream
  const killMicrophone = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    releaseStream();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState({
      isRecording: false,
      audioBlob: null,
      error: null,
      duration: 0,
    });
  }, [releaseStream]);

  const resetRecording = useCallback(() => {
    chunksRef.current = [];
    setState({
      isRecording: false,
      audioBlob: null,
      error: null,
      duration: 0,
    });
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    resetRecording,
    killMicrophone,
  };
}
