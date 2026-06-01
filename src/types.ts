export type AppState =
  | 'IDLE'
  | 'PAYMENT'
  | 'TEMPLATE_SELECTION'
  | 'TIMER_SELECTION'
  | 'PHOTO_SESSION'
  | 'UPLOADING'
  | 'QR_READY';

export interface FrameTemplate {
  id: string;
  name: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  fontFamily: string;
  label: string;
  styleName: string;
  decor?: 'checkers' | 'stars' | 'retro' | 'minimal' | 'sedes-run';
  frameImage?: string;
  accentColor?: string;
}

export interface CapturedPhoto {
  index: number;
  dataUrl: string;
  timestamp: string;
}

export interface PaymentSession {
  orderId: string;
  token: string;
  amount: number;
  status: 'pending' | 'paid';
}
