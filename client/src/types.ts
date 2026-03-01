export interface User {
  _id: string;
  username: string;
  email: string;
  verified: boolean;
}

export interface Profile {
  companyName: string;
  address: string;
  email: string;
  country: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  paymentEmail: string;
  logoUrl: string;
}

export interface Customer {
  _id: string;
  batchId?: string;
  name: string;
  email: string;
  product: string;
  quantity: number;
  price: number;
  sent: boolean;
  sentDate?: string | null;
}

export interface InvoiceRecord {
  customerId: string;
  customerName: string;
  customerEmail: string;
  product: string;
  quantity: number;
  price: number;
  status: "sent" | "unsent";
  date: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  pdfUrl: string | null;
}

