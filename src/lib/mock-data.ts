// Mock data for the app

export interface Client {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  jobLocation: string;
  totalSpent: number;
  price: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  price: number;
  date: string;
  status: 'paid' | 'pending' | 'partial';
}

export interface Job {
  id: string;
  clientId: string;
  title: string;
  date: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ClientFile {
  id: string;
  clientId: string;
  filename: string;
  format: 'pdf' | 'doc';
  filesize: string;
  dateSent: string;
}

export interface Contract {
  id: string;
  clientId: string;
  name: string;
  date: string;
  amount: number;
  status: 'pending' | 'signed';
}

export interface Message {
  id: string;
  clientId: string;
  sender: string;
  timeSent: string;
  content: string;
}

export interface Activity {
  id: string;
  description: string;
  time: string;
  type: 'invoice' | 'client' | 'job' | 'payment';
}

export const mockClients: Client[] = [
  {
    id: '1',
    fullName: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+1 555-0101',
    jobLocation: 'New York, NY',
    totalSpent: 12500,
    price: 3500,
  },
  {
    id: '2',
    fullName: 'Michael Chen',
    email: 'michael@example.com',
    phone: '+1 555-0102',
    jobLocation: 'Los Angeles, CA',
    totalSpent: 8900,
    price: 2200,
  },
  {
    id: '3',
    fullName: 'Emma Williams',
    email: 'emma@example.com',
    phone: '+1 555-0103',
    jobLocation: 'Chicago, IL',
    totalSpent: 15300,
    price: 4100,
  },
  {
    id: '4',
    fullName: 'James Brown',
    email: 'james@example.com',
    phone: '+1 555-0104',
    jobLocation: 'Houston, TX',
    totalSpent: 6700,
    price: 1800,
  },
  {
    id: '5',
    fullName: 'Olivia Davis',
    email: 'olivia@example.com',
    phone: '+1 555-0105',
    jobLocation: 'Phoenix, AZ',
    totalSpent: 21000,
    price: 5500,
  },
  {
    id: '6',
    fullName: 'William Garcia',
    email: 'william@example.com',
    phone: '+1 555-0106',
    jobLocation: 'San Diego, CA',
    totalSpent: 3200,
    price: 900,
  },
  {
    id: '7',
    fullName: 'Sophia Martinez',
    email: 'sophia@example.com',
    phone: '+1 555-0107',
    jobLocation: 'Dallas, TX',
    totalSpent: 11400,
    price: 3000,
  },
  {
    id: '8',
    fullName: 'Benjamin Lee',
    email: 'benjamin@example.com',
    phone: '+1 555-0108',
    jobLocation: 'Austin, TX',
    totalSpent: 7800,
    price: 2600,
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'inv1',
    clientId: '1',
    invoiceNumber: 'INV-001',
    price: 3500,
    date: '2024-03-15',
    status: 'paid',
  },
  {
    id: 'inv2',
    clientId: '1',
    invoiceNumber: 'INV-002',
    price: 4500,
    date: '2024-04-01',
    status: 'pending',
  },
  {
    id: 'inv3',
    clientId: '2',
    invoiceNumber: 'INV-003',
    price: 2200,
    date: '2024-03-20',
    status: 'partial',
  },
  {
    id: 'inv4',
    clientId: '3',
    invoiceNumber: 'INV-004',
    price: 4100,
    date: '2024-02-28',
    status: 'paid',
  },
  {
    id: 'inv5',
    clientId: '3',
    invoiceNumber: 'INV-005',
    price: 5200,
    date: '2024-04-05',
    status: 'pending',
  },
  {
    id: 'inv6',
    clientId: '4',
    invoiceNumber: 'INV-006',
    price: 1800,
    date: '2024-03-10',
    status: 'paid',
  },
  {
    id: 'inv7',
    clientId: '5',
    invoiceNumber: 'INV-007',
    price: 5500,
    date: '2024-04-02',
    status: 'pending',
  },
  {
    id: 'inv8',
    clientId: '5',
    invoiceNumber: 'INV-008',
    price: 7500,
    date: '2024-01-15',
    status: 'paid',
  },
  {
    id: 'inv9',
    clientId: '6',
    invoiceNumber: 'INV-009',
    price: 900,
    date: '2024-03-25',
    status: 'partial',
  },
  {
    id: 'inv10',
    clientId: '7',
    invoiceNumber: 'INV-010',
    price: 3000,
    date: '2024-04-08',
    status: 'pending',
  },
];

export const mockJobs: Job[] = [
  {
    id: 'j1',
    clientId: '1',
    title: 'Website Redesign',
    date: '2024-03-15',
    status: 'completed',
  },
  {
    id: 'j2',
    clientId: '1',
    title: 'SEO Optimization',
    date: '2024-04-01',
    status: 'in_progress',
  },
  {
    id: 'j3',
    clientId: '2',
    title: 'Mobile App Development',
    date: '2024-03-20',
    status: 'in_progress',
  },
  {
    id: 'j4',
    clientId: '3',
    title: 'Brand Identity Package',
    date: '2024-02-28',
    status: 'completed',
  },
  {
    id: 'j5',
    clientId: '3',
    title: 'Social Media Campaign',
    date: '2024-04-05',
    status: 'pending',
  },
  {
    id: 'j6',
    clientId: '4',
    title: 'E-commerce Setup',
    date: '2024-03-10',
    status: 'completed',
  },
  {
    id: 'j7',
    clientId: '5',
    title: 'Cloud Migration',
    date: '2024-04-02',
    status: 'in_progress',
  },
  {
    id: 'j8',
    clientId: '5',
    title: 'Security Audit',
    date: '2024-01-15',
    status: 'completed',
  },
  {
    id: 'j9',
    clientId: '6',
    title: 'Logo Design',
    date: '2024-03-25',
    status: 'pending',
  },
  {
    id: 'j10',
    clientId: '7',
    title: 'Content Strategy',
    date: '2024-04-08',
    status: 'pending',
  },
];

export const mockFiles: ClientFile[] = [
  {
    id: 'f1',
    clientId: '1',
    filename: 'Project_Proposal',
    format: 'pdf',
    filesize: '2.4 MB',
    dateSent: '2024-03-14',
  },
  {
    id: 'f2',
    clientId: '1',
    filename: 'Contract_Agreement',
    format: 'doc',
    filesize: '1.1 MB',
    dateSent: '2024-03-15',
  },
  {
    id: 'f3',
    clientId: '2',
    filename: 'App_Requirements',
    format: 'pdf',
    filesize: '3.8 MB',
    dateSent: '2024-03-19',
  },
  {
    id: 'f4',
    clientId: '3',
    filename: 'Brand_Guidelines',
    format: 'pdf',
    filesize: '5.2 MB',
    dateSent: '2024-02-27',
  },
  {
    id: 'f5',
    clientId: '5',
    filename: 'Migration_Plan',
    format: 'doc',
    filesize: '1.6 MB',
    dateSent: '2024-04-01',
  },
];

export const mockContracts: Contract[] = [
  {
    id: 'c1',
    clientId: '1',
    name: 'Web Redesign Contract',
    date: '2024-03-14',
    amount: 8000,
    status: 'signed',
  },
  {
    id: 'c2',
    clientId: '2',
    name: 'App Development Agreement',
    date: '2024-03-19',
    amount: 15000,
    status: 'signed',
  },
  {
    id: 'c3',
    clientId: '3',
    name: 'Branding Package Deal',
    date: '2024-02-27',
    amount: 6500,
    status: 'signed',
  },
  {
    id: 'c4',
    clientId: '5',
    name: 'Cloud Services Contract',
    date: '2024-04-01',
    amount: 12000,
    status: 'pending',
  },
  {
    id: 'c5',
    clientId: '7',
    name: 'Content Retainer',
    date: '2024-04-07',
    amount: 3000,
    status: 'pending',
  },
];

export const mockMessages: Message[] = [
  {
    id: 'm1',
    clientId: '1',
    sender: 'Servix Team',
    timeSent: '2 hours ago',
    content: 'Hi Sarah, your project revision is ready for review.',
  },
  {
    id: 'm2',
    clientId: '1',
    sender: 'Servix Team',
    timeSent: '1 day ago',
    content: "We've completed the initial wireframes.",
  },
  {
    id: 'm3',
    clientId: '2',
    sender: 'Servix Team',
    timeSent: '5 hours ago',
    content: 'Michael, the beta build is available for testing.',
  },
  {
    id: 'm4',
    clientId: '3',
    sender: 'Servix Team',
    timeSent: '3 hours ago',
    content: 'Emma, please review the updated brand colors.',
  },
  {
    id: 'm5',
    clientId: '5',
    sender: 'Servix Team',
    timeSent: '1 hour ago',
    content: 'Olivia, migration phase 1 is complete.',
  },
];

export const mockActivities: Activity[] = [
  {
    id: 'a1',
    description: 'Invoice INV-007 sent to Olivia Davis',
    time: '1 hour ago',
    type: 'invoice',
  },
  {
    id: 'a2',
    description: 'New client Benjamin Lee added',
    time: '3 hours ago',
    type: 'client',
  },
  {
    id: 'a3',
    description: "Job 'Cloud Migration' status updated to In Progress",
    time: '5 hours ago',
    type: 'job',
  },
  {
    id: 'a4',
    description: 'Payment of $4,100 received from Emma Williams',
    time: '1 day ago',
    type: 'payment',
  },
  {
    id: 'a5',
    description: "Job 'Website Redesign' marked as Completed",
    time: '2 days ago',
    type: 'job',
  },
];

export const mockRevenueData = [
  { month: 'Oct', revenue: 9400 },
  { month: 'Nov', revenue: 11200 },
  { month: 'Dec', revenue: 14800 },
  { month: 'Jan', revenue: 12500 },
  { month: 'Feb', revenue: 15800 },
  { month: 'Mar', revenue: 17400 },
  { month: 'Apr', revenue: 19800 },
];

export const mockJobStatusData = [
  { name: 'Pending', value: 3, fill: 'hsl(45, 93%, 47%)' },
  { name: 'In Progress', value: 3, fill: 'hsl(217, 91%, 60%)' },
  { name: 'Completed', value: 4, fill: 'hsl(142, 71%, 45%)' },
];

export interface Payment {
  id: string;
  businessName: string;
  paymentDate: string;
  paymentMode:
    | 'cash'
    | 'bank_transfer'
    | 'credit_card'
    | 'cheque'
    | 'mobile_money';
  amount: number;
  status: 'completed' | 'partial';
}

export const mockPayments: Payment[] = [
  {
    id: 'p1',
    businessName: 'Sarah Johnson',
    paymentDate: '2024-04-10',
    paymentMode: 'bank_transfer',
    amount: 3500,
    status: 'completed',
  },
  {
    id: 'p2',
    businessName: 'Michael Chen',
    paymentDate: '2024-04-08',
    paymentMode: 'credit_card',
    amount: 1100,
    status: 'partial',
  },
  {
    id: 'p3',
    businessName: 'Emma Williams',
    paymentDate: '2024-03-28',
    paymentMode: 'cash',
    amount: 4100,
    status: 'completed',
  },
  {
    id: 'p4',
    businessName: 'James Brown',
    paymentDate: '2024-03-15',
    paymentMode: 'bank_transfer',
    amount: 1800,
    status: 'completed',
  },
  {
    id: 'p5',
    businessName: 'Olivia Davis',
    paymentDate: '2024-04-05',
    paymentMode: 'mobile_money',
    amount: 7500,
    status: 'completed',
  },
  {
    id: 'p6',
    businessName: 'William Garcia',
    paymentDate: '2024-03-30',
    paymentMode: 'cheque',
    amount: 450,
    status: 'partial',
  },
  {
    id: 'p7',
    businessName: 'Sophia Martinez',
    paymentDate: '2024-04-12',
    paymentMode: 'bank_transfer',
    amount: 3000,
    status: 'completed',
  },
  {
    id: 'p8',
    businessName: 'Benjamin Lee',
    paymentDate: '2024-04-01',
    paymentMode: 'credit_card',
    amount: 2600,
    status: 'completed',
  },
  {
    id: 'p9',
    businessName: 'Sarah Johnson',
    paymentDate: '2024-04-15',
    paymentMode: 'cash',
    amount: 2000,
    status: 'partial',
  },
  {
    id: 'p10',
    businessName: 'Emma Williams',
    paymentDate: '2024-04-18',
    paymentMode: 'bank_transfer',
    amount: 5200,
    status: 'completed',
  },
  {
    id: 'p11',
    businessName: 'Olivia Davis',
    paymentDate: '2024-04-20',
    paymentMode: 'mobile_money',
    amount: 3000,
    status: 'partial',
  },
  {
    id: 'p12',
    businessName: 'James Brown',
    paymentDate: '2024-04-22',
    paymentMode: 'credit_card',
    amount: 950,
    status: 'completed',
  },
];
