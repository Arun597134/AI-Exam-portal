import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

const WebcamMonitor = ({ onCheatingDetected, cheatLog, setCheatLog }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.setBackend('webgl');
        const loadedModel = await blazeface.load();
        setModel(loadedModel);
        setModelLoading(false);
      } catch (err) {
        console.error("Error loading TF model:", err);
      }
    };
    loadModel();
  }, []);

  const logIncident = (type) => {
    const newLog = [...cheatLog, { type, timestamp: new Date().toISOString() }];
    setCheatLog(newLog);
    if (onCheatingDetected) onCheatingDetected(newLog, type);
  };

  useEffect(() => {
    let stream = null;

    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Webcam access denied", err);
        logIncident('Webcam Access Denied - Setup Required');
      }
    };

    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    let interval;
    if (model && videoRef.current && !modelLoading) {
      interval = setInterval(async () => {
        if (videoRef.current.readyState === 4) { // HAVE_ENOUGH_DATA
          try {
            const predictions = await model.estimateFaces(videoRef.current, false);
            
            if (predictions.length === 0) {
              logIncident('No Face Detected in Frame');
            } else if (predictions.length > 1) {
              logIncident('Multiple Faces Detected detected');
            }

            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              predictions.forEach(pred => {
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = "red";
                ctx.rect(
                  pred.topLeft[0],
                  pred.topLeft[1],
                  pred.bottomRight[0] - pred.topLeft[0],
                  pred.bottomRight[1] - pred.topLeft[1]
                );
                ctx.stroke();
              });
            }
          } catch (e) {
            console.error(e);
          }
        }
      }, 5000); // Check every 5 seconds to reduce load
    }
    return () => clearInterval(interval);
  }, [model, modelLoading]); // eslint-disable-line

  return (
    <div className="webcam-preview border-color">
      {modelLoading && <div className="absolute inset-0 flex items-center justify-center text-xs text-white z-10 p-2" style={{position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem'}}>Loading AI...</div>}
      <video ref={videoRef} autoPlay playsInline muted />
      <canvas ref={canvasRef} width="200" height="150" />
    </div>
  );
};

export default WebcamMonitor;
