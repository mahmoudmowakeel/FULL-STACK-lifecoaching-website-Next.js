export interface FreeTrialFormData {
  name: string; // required
  phone: string | null; // optional, can be null if empty
  email: string | null; // optional, can be null if empty
  date_time?: string | null; // optional, if you want to manually select a date
  status?: string; // optional, defaults to 'pending' in the DB
}

export interface ReservationFormData {
  email: string | ""; // optional, can be null if 
  name?: string;
  phone?: string;
  date_time?: string | null; // optional, if you want to manually select a date
  status?: string; // optional, defaults to 'pending' in the DB
  amount: string;
  payment_bill: string;
  paymentMethod: string;
  type: string;
}

export interface PaymentStatus {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

