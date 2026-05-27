import React, { useState, useEffect } from 'react';
import { AppState, FrameTemplate } from './types';
import IdleScreen from './components/IdleScreen';
import PaymentScreen from './components/PaymentScreen';
import TemplateScreen from './components/TemplateScreen';
import TimerScreen from './components/TimerScreen';
import PhotoSessionScreen from './components/PhotoSessionScreen';
import QRResultScreen from './components/QRResultScreen';

export default function App() {
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [selectedTemplate, setSelectedTemplate] = useState<FrameTemplate | null>(null);
  const [timerValue, setTimerValue] = useState<number>(5);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string>('');

  // Core callback: resets variables and returns the kiosk back to the IDLE screen
  const handleResetToIdle = () => {
    setAppState('IDLE');
    setSelectedTemplate(null);
    setTimerValue(5);
    setCapturedPhotos([]);
    setActiveOrderId('');
  };

  // Safe validation side-effect to check states and handle transitions after rendering
  useEffect(() => {
    if (appState === 'PHOTO_SESSION' && !selectedTemplate) {
      setAppState('TEMPLATE_SELECTION');
    } else if (appState === 'UPLOADING' && (!selectedTemplate || capturedPhotos.length < 4)) {
      handleResetToIdle();
    }
  }, [appState, selectedTemplate, capturedPhotos.length]);

  return (
    <div id="memo-kiosk-app-root" className="min-h-screen w-full bg-[#FFE5F1] text-[#1A1A1A] font-sans antialiased overflow-x-hidden">
      {/* State Router */}
      {(() => {
        switch (appState) {
          case 'IDLE':
            return (
              <IdleScreen
                onStart={() => setAppState('PAYMENT')}
              />
            );
          
          case 'PAYMENT':
            return (
              <PaymentScreen
                onBack={handleResetToIdle}
                onPaymentSuccess={(orderId) => {
                  setActiveOrderId(orderId);
                  setAppState('TEMPLATE_SELECTION');
                }}
              />
            );
          
          case 'TEMPLATE_SELECTION':
            return (
              <TemplateScreen
                onSelectTemplate={(template) => {
                  setSelectedTemplate(template);
                  setAppState('TIMER_SELECTION');
                }}
              />
            );
          
          case 'TIMER_SELECTION':
            return (
              <TimerScreen
                onBack={() => setAppState('TEMPLATE_SELECTION')}
                onSelectTimer={(seconds) => {
                  setTimerValue(seconds);
                  setAppState('PHOTO_SESSION');
                }}
              />
            );
          
          case 'PHOTO_SESSION':
            if (!selectedTemplate) {
              return null; // Will be handled secure and safe inside our validation hook
            }
            return (
              <PhotoSessionScreen
                template={selectedTemplate}
                timerValue={timerValue}
                onPhotosComplete={(completedPhotos) => {
                  setCapturedPhotos(completedPhotos);
                  setAppState('UPLOADING');
                }}
              />
            );
          
          case 'UPLOADING':
            if (!selectedTemplate || capturedPhotos.length < 4) {
              return null; // Will be handled secure and safe inside our validation hook
            }
            return (
              <QRResultScreen
                photos={capturedPhotos}
                template={selectedTemplate}
                orderId={activeOrderId}
                onFinish={handleResetToIdle}
              />
            );
          
          default:
            return (
              <IdleScreen
                onStart={() => setAppState('PAYMENT')}
              />
            );
        }
      })()}
    </div>
  );
}
