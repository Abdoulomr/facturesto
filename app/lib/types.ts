export type Product = {
  id: string;
  name: string;
  price: number;
  unit: string;
};

export type InvoiceItem = {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  total: number;
};

export type Deduction = {
  id: string;
  label: string;
  amount: number;
};

export type InvoiceCreator = {
  id: string;
  name: string;
  email: string;
};

export type Invoice = {
  id: string;
  number: string;
  date: string;
  items: InvoiceItem[];
  deductions: Deduction[];
  total: number;
  tableNumber: string;
  notes: string;
  status: 'pending' | 'paid';
  createdBy?: InvoiceCreator | null;
};
