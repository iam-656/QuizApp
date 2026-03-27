'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
// @ts-ignore
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection/dist/face-landmarks-detection.js';
import axios from 'axios';
import { Camera, CameraOff, UserCheck, UserX } from 'lucide-react';

interface ProctoringManagerProps {
  attemptId: string;
  token: string | null;
  onViolation?: (reason: string) => void;
}

export default function ProctoringManager({ attemptId, token, onViolation }: ProctoringManagerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [detector, setDetector] = useState<any>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [faceStatus, setFaceStatus] = useState<'detected' | 'not_detected' | 'looking_away'>('not_detected');
  const [error, setError] = useState<string | null>(null);
  const [samples, setSamples] = useState({ total: 0, away: 0 });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  // Initialize Detector
  useEffect(() => {
    const initDetector = async () => {
      try {
        await tf.setBackend('webgl');
        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig = {
          runtime: 'tfjs',
          refineLandmarks: true,
        };
        const newDetector = await faceLandmarksDetection.createDetector(model, detectorConfig);
        setDetector(newDetector);
      } catch (err) {
        console.error('Failed to initialize face detector:', err);
        setError('Failed to load AI proctoring model.');
      }
    };
    initDetector();
  }, []);

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraOn(true);
        }
      } catch (err) {
        console.error('Camera access denied:', err);
        setError('Camera access is required for this assessment.');
      }
    };
    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const sendProctoringLog = useCallback(async (detected: boolean, away: boolean) => {
    if (!attemptId || !token) return;
    try {
      await axios.post(
        `${API_URL}/attempts/proctoring`,
        { attempt_id: attemptId, face_detected: detected, looking_away: away },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Failed to send proctoring log:', err);
    }
  }, [attemptId, token, API_URL]);

  // Detection Loop
  useEffect(() => {
    if (!detector || !isCameraOn) return;

    let logInterval: NodeJS.Timeout;
    let detectionFrame: number;
    let awayFrames = 0;
    let notDetectedFrames = 0;
    let totalFrames = 0;

    const runDetection = async () => {
      if (videoRef.current && detector) {
        try {
          const faces = await detector.estimateFaces(videoRef.current);
          totalFrames++;
          
          if (faces.length === 0) {
            setFaceStatus('not_detected');
            notDetectedFrames++;
          } else {
            const face = faces[0];
            const keypoints = face.keypoints;
            const nose = keypoints[1];
            const leftEye = keypoints[33];
            const rightEye = keypoints[263];

            // Distance-relative metric: ratio of nose offset vs eye distance
            const eyeDistance = Math.sqrt(Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2));
            const eyeCenterX = (leftEye.x + rightEye.x) / 2;
            const noseOffset = Math.abs(nose.x - eyeCenterX);

            if (eyeDistance > 0 && (noseOffset / eyeDistance) > 0.25) {
              setFaceStatus('looking_away');
              awayFrames++;
            } else {
              setFaceStatus('detected');
            }
          }
        } catch (e) {
          console.error('Detection error:', e);
        }
      }
      detectionFrame = requestAnimationFrame(runDetection);
    };

    runDetection();

    // Log to backend every 10 seconds and check for violation
    logInterval = setInterval(() => {
      if (totalFrames === 0) return;

      // Calculate percentages for this 10-second window
      const isAway = (awayFrames / totalFrames) > 0.3; // Looked away > 30% of this window
      const isDetected = (notDetectedFrames / totalFrames) < 0.3; // Face visible mostly

      setSamples(prev => {
        const newTotal = prev.total + 1;
        const newAway = prev.away + (isAway ? 1 : 0);
        
        // Trigger strict auto-submit if looking away repeatedly (e.g. 2 windows / 20 seconds)
        if (newTotal >= 2 && (newAway / newTotal) > 0.3) {
          if (onViolation) onViolation('Excessive looking away detected (>30%)');
        }
        
        return { total: newTotal, away: newAway };
      });

      sendProctoringLog(isDetected, isAway);

      // Reset accumulators for next 10-second chunk
      awayFrames = 0;
      notDetectedFrames = 0;
      totalFrames = 0;
    }, 10000);

    return () => {
      cancelAnimationFrame(detectionFrame);
      clearInterval(logInterval);
    };
  }, [detector, isCameraOn, faceStatus, sendProctoringLog, onViolation]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 w-48 overflow-hidden group">
        <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video mb-3">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover mirror transform -scale-x-100"
          />
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-500">
              <CameraOff size={24} />
            </div>
          )}
          <div className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white ${
            faceStatus === 'detected' ? 'bg-green-500' : faceStatus === 'looking_away' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Proctoring</span>
            <span className={`text-xs font-bold ${
              faceStatus === 'detected' ? 'text-green-600' : faceStatus === 'looking_away' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {faceStatus === 'detected' ? 'Secure' : faceStatus === 'looking_away' ? 'Looking Away' : 'No Face'}
            </span>
          </div>
          <div className="text-gray-300">
             {faceStatus === 'detected' ? <UserCheck size={18} /> : <UserX size={18} />}
          </div>
        </div>

        {error && (
          <div className="mt-2 text-[10px] text-red-500 font-medium leading-tight">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
