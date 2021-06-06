import React, { useState, useEffect, FC, HTMLAttributes } from 'react';
import './audioRecorder.css';
import Button from '@material-ui/core/Button';
import { default as StartRecordIcon } from '@material-ui/icons/FiberManualRecord';
import { default as StopRecordIcon } from '@material-ui/icons/Stop';
import { default as PlayIcon } from '@material-ui/icons/PlayCircleFilledWhite';
import CancelIcon from '@material-ui/icons/Cancel';
import MicIcon from '@material-ui/icons/Mic';

declare var MediaRecorder: any;

export interface Props extends HTMLAttributes<HTMLDivElement> {
  onGenerateAudioURL: (audioUrl: any) => void;
}

const UP_BAR_COLOR = '#432E88';
const DOWN_BAR_COLOR = '#F4266E';
const DEVISION_FACTOR = 7;

const AudioRecorder: FC<Props> = ({ onGenerateAudioURL }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<any | null>(null);
  const [audio, setAudio] = useState<any | null>(null);
  const [timer, setTimer] = useState<number | null>(0);

  let timerInterval: ReturnType<typeof setTimeout>;
  let audioCtx: AudioContext;
  let canvasUp: HTMLCanvasElement | null;
  let canvasUpCtx: false | CanvasRenderingContext2D | null;
  let canvasDown: HTMLCanvasElement | null;
  let canvasDownCtx: false | CanvasRenderingContext2D | null;

  let animationFrameUp: number;
  let animationFrameDown: number;

  /**
   * Generate top section animated stream bars
   */
  useEffect(() => {
    canvasUp = document.querySelector('.visualizer1');
    canvasUpCtx = !!canvasUp && canvasUp.getContext('2d');
  }, []);

  /**
   * Generate bottom section animated stream bars
   */
  useEffect(() => {
    canvasDown = document.querySelector('.visualizer2');
    canvasDownCtx = !!canvasDown && canvasDown.getContext('2d');
  }, []);

  /**
   * Timer for audio recorder
   */
  useEffect(() => {
    if (isRecording) {
      timerInterval = setInterval(() => {
        !!timer && setTimer(timer + 1);
      }, 1000);
    } else {
      clearInterval(timerInterval);
    }

    return () => {
      clearInterval(timerInterval);
    };
  }, [isRecording, timer]);

  /**
   *
   * Generate visualization of streams
   */
  function visualize(stream: MediaStream) {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    const source = audioCtx.createMediaStreamSource(stream);

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    drawUp();

    function drawUp() {
      const WIDTH = !!canvasUp ? canvasUp.width : 10;
      const HEIGHT = !!canvasUp ? canvasUp.height : 10;
      let x = 0;
      const width = 4;
      const height = 4;

      animationFrameUp = requestAnimationFrame(drawUp);
      analyser.getByteTimeDomainData(dataArray);
      if (!!canvasUpCtx) {
        canvasUpCtx.fillStyle = 'rgb(255, 255, 255)';
        canvasUpCtx.fillRect(0, 0, WIDTH, HEIGHT);
        canvasUpCtx.beginPath();
      }

      for (let i = 0; i < bufferLength; i++) {
        var h = dataArray[i] / DEVISION_FACTOR;
        if (!!canvasUpCtx) {
          canvasUpCtx.rect(x, HEIGHT, width, -height);
          canvasUpCtx.fillStyle = UP_BAR_COLOR;
          canvasUpCtx.fill();
        }

        if (dataArray[i] / 128 > 1 && !!canvasUpCtx) {
          canvasUpCtx.rect(x, HEIGHT, width, -h);
          canvasUpCtx.fillStyle = UP_BAR_COLOR;
          canvasUpCtx.fill();
        }
        x += 8;
      }
    }

    drawDown();

    function drawDown() {
      const WIDTH = !!canvasDown ? canvasDown.width : 10;
      const HEIGHT = !!canvasDown ? canvasDown.height : 10;
      let x = 0;
      const width = 4;
      const height = 4;

      animationFrameDown = requestAnimationFrame(drawDown);
      analyser.getByteTimeDomainData(dataArray);
      if (!!canvasDownCtx) {
        canvasDownCtx.fillStyle = 'rgb(255, 255, 255)';
        canvasDownCtx.fillRect(0, 0, WIDTH, HEIGHT);
        canvasDownCtx.beginPath();
      }

      for (let i = 0; i < bufferLength; i++) {
        var h = dataArray[i] / DEVISION_FACTOR;
        if (!!canvasDownCtx) {
          canvasDownCtx.rect(x, 0, width, height);
          canvasDownCtx.fillStyle = DOWN_BAR_COLOR;
          canvasDownCtx.fill();
        }

        if (dataArray[i] / 128 > 1 && !!canvasDownCtx) {
          canvasDownCtx.rect(x, 0, width, h);
          canvasDownCtx.fillStyle = DOWN_BAR_COLOR;
          canvasDownCtx.fill();
        }
        x += 8;
      }
    }
  }

  const recordAudio = (): Promise<any> => {
    return new Promise(resolve => {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: any[] = [];

        visualize(stream);

        mediaRecorder.addEventListener('dataavailable', (event: any) => {
          audioChunks.push(event.data);
        });

        const start = () => {
          mediaRecorder.start();
        };

        const stop = () => {
          return new Promise(resolve => {
            mediaRecorder.addEventListener('stop', () => {
              const audioBlob = new Blob(audioChunks);
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);
              onGenerateAudioURL(audioUrl);
              const play = () => {
                audio.play();
              };

              const pause = () => {
                audio.pause();
              };

              resolve({ audioBlob, audioUrl, play, pause });
            });
            // To stop all streams which mutes the microphone and removes the recording icon from the tab
            stream.getAudioTracks().forEach(function(track) {
              track.stop();
            });
            mediaRecorder.stop();
          });
        };

        resolve({ start, stop });
      });
    });
  };

  const start = async () => {
    const recorderInstance = await recordAudio();
    setRecorder(recorderInstance);
    !!recorderInstance && recorderInstance.start();
    setIsRecording(true);
  };

  const stop = async () => {
    if (recorder) {
      const recorderInstance = await recorder.stop();
      setAudio(recorderInstance);
      setRecorder(null);
      setIsRecording(false);
      cancelAnimationFrame(animationFrameUp);
      cancelAnimationFrame(animationFrameDown);
    }
  };

  const handleDiscard = () => {
    audio.pause();
    setAudio(null);
    setRecorder(null);
    setIsRecording(false);
  };

  return (
    <div className="root">
      <div className="canvasContainer">
        <canvas
          className="visualizer1"
          height={isRecording ? 20 : 0}
          width="auto"
        ></canvas>
        <canvas
          className="visualizer2"
          height={isRecording ? 20 : 0}
          width="auto"
        ></canvas>
        <div className={`defaultContiner ${isRecording ? 'hidden' : ''}`}>
          <MicIcon />
        </div>
        <div className="timeContainer">
          <div>
            {!!timer && new Date(timer * 1000).toISOString().substr(11, 8)}
          </div>
        </div>
      </div>
      <div className="w-100">
        {!!audio ? (
          <div>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PlayIcon htmlColor="#28a745" />}
              onClick={() => audio.play()}
              style={{ marginRight: '1rem' }}
            >
              Play
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<CancelIcon htmlColor="#dc3545" />}
              onClick={handleDiscard}
            >
              Discard
            </Button>
          </div>
        ) : !!isRecording ? (
          <Button
            className="w-100"
            variant="outlined"
            color="primary"
            startIcon={<StopRecordIcon htmlColor="#dc3545" />}
            onClick={() => stop()}
          >
            Stop Recording
          </Button>
        ) : (
          <Button
            className="w-100"
            variant="outlined"
            color="primary"
            startIcon={<StartRecordIcon htmlColor="#28a745" />}
            onClick={() => start()}
          >
            Start Recording
          </Button>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;
