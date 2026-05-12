export interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  dateJoined: string;
  weeklyHours: number;
  defaultPassword: string;
  clockHistory: ClockRecord[];
}

export interface ClockRecord {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  breakMinutes: number;
  totalHours: number;
}

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  day: string;
  startTime: string;
  endTime: string;
  notes: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  stage: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  createdAt: string;
  comments: TaskComment[];
  subtasks: Subtask[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  author: string;
  content: string;
  time: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  author: string;
  createdAt: string;
}

export interface TeamMessage {
  id: string;
  sender: string;
  senderInitials: string;
  content: string;
  time: string;
}

export const mockEmployees: Employee[] = [
  {
    id: 'e1',
    fullName: 'Alice Morgan',
    email: 'alice@servix.com',
    phone: '+1 555-1001',
    role: 'Manager',
    dateJoined: '2023-06-15',
    weeklyHours: 38.5,
    defaultPassword: 'Servix@2024',
    clockHistory: [
      {
        id: 'ch1',
        date: '2024-04-15',
        clockIn: '08:00',
        clockOut: '17:00',
        breakMinutes: 60,
        totalHours: 8,
      },
      {
        id: 'ch2',
        date: '2024-04-14',
        clockIn: '08:15',
        clockOut: '16:45',
        breakMinutes: 45,
        totalHours: 7.75,
      },
      {
        id: 'ch3',
        date: '2024-04-13',
        clockIn: '09:00',
        clockOut: '17:30',
        breakMinutes: 30,
        totalHours: 8,
      },
      {
        id: 'ch4',
        date: '2024-04-12',
        clockIn: '08:00',
        clockOut: '16:00',
        breakMinutes: 60,
        totalHours: 7,
      },
      {
        id: 'ch5',
        date: '2024-04-11',
        clockIn: '08:30',
        clockOut: '17:00',
        breakMinutes: 45,
        totalHours: 7.75,
      },
    ],
  },
  {
    id: 'e2',
    fullName: 'David Kim',
    email: 'david@servix.com',
    phone: '+1 555-1002',
    role: 'Technician',
    dateJoined: '2023-09-01',
    weeklyHours: 40,
    defaultPassword: 'Servix@2024',
    clockHistory: [
      {
        id: 'ch6',
        date: '2024-04-15',
        clockIn: '07:45',
        clockOut: '16:45',
        breakMinutes: 60,
        totalHours: 8,
      },
      {
        id: 'ch7',
        date: '2024-04-14',
        clockIn: '08:00',
        clockOut: '17:00',
        breakMinutes: 60,
        totalHours: 8,
      },
      {
        id: 'ch8',
        date: '2024-04-13',
        clockIn: '08:00',
        clockOut: '17:00',
        breakMinutes: 60,
        totalHours: 8,
      },
      {
        id: 'ch9',
        date: '2024-04-12',
        clockIn: '08:00',
        clockOut: '17:00',
        breakMinutes: 60,
        totalHours: 8,
      },
      {
        id: 'ch10',
        date: '2024-04-11',
        clockIn: '08:00',
        clockOut: '17:00',
        breakMinutes: 60,
        totalHours: 8,
      },
    ],
  },
  {
    id: 'e3',
    fullName: 'Priya Patel',
    email: 'priya@servix.com',
    phone: '+1 555-1003',
    role: 'Designer',
    dateJoined: '2024-01-10',
    weeklyHours: 35,
    defaultPassword: 'Servix@2024',
    clockHistory: [
      {
        id: 'ch11',
        date: '2024-04-15',
        clockIn: '09:00',
        clockOut: '17:00',
        breakMinutes: 60,
        totalHours: 7,
      },
      {
        id: 'ch12',
        date: '2024-04-14',
        clockIn: '09:00',
        clockOut: '17:00',
        breakMinutes: 60,
        totalHours: 7,
      },
      {
        id: 'ch13',
        date: '2024-04-13',
        clockIn: '09:30',
        clockOut: '17:30',
        breakMinutes: 60,
        totalHours: 7,
      },
    ],
  },
  {
    id: 'e4',
    fullName: 'James Cole',
    email: 'james@servix.com',
    phone: '+1 555-1004',
    role: 'Technician',
    dateJoined: '2023-11-20',
    weeklyHours: 42,
    defaultPassword: 'Servix@2024',
    clockHistory: [
      {
        id: 'ch14',
        date: '2024-04-15',
        clockIn: '07:30',
        clockOut: '17:30',
        breakMinutes: 60,
        totalHours: 9,
      },
      {
        id: 'ch15',
        date: '2024-04-14',
        clockIn: '07:30',
        clockOut: '17:00',
        breakMinutes: 45,
        totalHours: 8.75,
      },
    ],
  },
  {
    id: 'e5',
    fullName: 'Sofia Rivera',
    email: 'sofia@servix.com',
    phone: '+1 555-1005',
    role: 'Support',
    dateJoined: '2024-02-05',
    weeklyHours: 36,
    defaultPassword: 'Servix@2024',
    clockHistory: [
      {
        id: 'ch16',
        date: '2024-04-15',
        clockIn: '08:00',
        clockOut: '16:00',
        breakMinutes: 30,
        totalHours: 7.5,
      },
    ],
  },
  {
    id: 'e6',
    fullName: 'Ryan Thompson',
    email: 'ryan@servix.com',
    phone: '+1 555-1006',
    role: 'Technician',
    dateJoined: '2023-08-12',
    weeklyHours: 39,
    defaultPassword: 'Servix@2024',
    clockHistory: [],
  },
];

export const mockShifts: Shift[] = [
  {
    id: 'sh1',
    employeeId: 'e1',
    employeeName: 'Alice Morgan',
    day: 'Monday',
    startTime: '08:00',
    endTime: '16:00',
    notes: 'Morning shift - supervise team',
  },
  {
    id: 'sh2',
    employeeId: 'e2',
    employeeName: 'David Kim',
    day: 'Monday',
    startTime: '08:00',
    endTime: '17:00',
    notes: 'Field work',
  },
  {
    id: 'sh3',
    employeeId: 'e3',
    employeeName: 'Priya Patel',
    day: 'Tuesday',
    startTime: '09:00',
    endTime: '17:00',
    notes: 'Design sprints',
  },
  {
    id: 'sh4',
    employeeId: 'e4',
    employeeName: 'James Cole',
    day: 'Wednesday',
    startTime: '07:30',
    endTime: '15:30',
    notes: 'Early shift',
  },
  {
    id: 'sh5',
    employeeId: 'e1',
    employeeName: 'Alice Morgan',
    day: 'Thursday',
    startTime: '10:00',
    endTime: '18:00',
    notes: 'Late shift',
  },
  {
    id: 'sh6',
    employeeId: 'e5',
    employeeName: 'Sofia Rivera',
    day: 'Friday',
    startTime: '08:00',
    endTime: '16:00',
    notes: 'Customer support',
  },
  {
    id: 'sh7',
    employeeId: 'e2',
    employeeName: 'David Kim',
    day: 'Wednesday',
    startTime: '09:00',
    endTime: '17:00',
    notes: 'Office day',
  },
  {
    id: 'sh8',
    employeeId: 'e6',
    employeeName: 'Ryan Thompson',
    day: 'Tuesday',
    startTime: '08:00',
    endTime: '16:00',
    notes: 'Maintenance rounds',
  },
];

export const mockTasks: Task[] = [
  {
    id: 't1',
    title: 'Redesign client portal',
    description:
      'Update the client portal UI to match the new brand guidelines. Include responsive design improvements.',
    assigneeId: 'e3',
    assigneeName: 'Priya Patel',
    stage: 'in_progress',
    priority: 'high',
    dueDate: '2024-04-20',
    createdAt: '2024-04-10',
    comments: [
      {
        id: 'tc1',
        author: 'Alice Morgan',
        content: 'Great progress on the mockups!',
        time: '2 hours ago',
      },
      {
        id: 'tc2',
        author: 'Priya Patel',
        content: 'Thanks! Working on the mobile views now.',
        time: '1 hour ago',
      },
    ],
    subtasks: [
      { id: 'st1', title: 'Create wireframes', completed: true },
      { id: 'st2', title: 'Design mockups', completed: true },
      { id: 'st3', title: 'Implement responsive layout', completed: false },
      { id: 'st4', title: 'User testing', completed: false },
    ],
  },
  {
    id: 't2',
    title: 'Fix payment gateway integration',
    description:
      'Resolve timeout issues with the payment processor and add retry logic.',
    assigneeId: 'e2',
    assigneeName: 'David Kim',
    stage: 'todo',
    priority: 'urgent',
    dueDate: '2024-04-18',
    createdAt: '2024-04-12',
    comments: [
      {
        id: 'tc3',
        author: 'David Kim',
        content: 'Found the root cause — connection pooling issue.',
        time: '5 hours ago',
      },
    ],
    subtasks: [
      { id: 'st5', title: 'Debug timeout errors', completed: false },
      { id: 'st6', title: 'Add retry mechanism', completed: false },
      { id: 'st7', title: 'Write tests', completed: false },
    ],
  },
  {
    id: 't3',
    title: 'Setup automated email notifications',
    description:
      'Configure email triggers for invoice creation, payment received, and job completion.',
    assigneeId: 'e5',
    assigneeName: 'Sofia Rivera',
    stage: 'todo',
    priority: 'medium',
    dueDate: '2024-04-25',
    createdAt: '2024-04-11',
    comments: [],
    subtasks: [
      { id: 'st8', title: 'Design email templates', completed: false },
      { id: 'st9', title: 'Configure triggers', completed: false },
    ],
  },
  {
    id: 't4',
    title: 'Update company branding assets',
    description:
      'Replace all old logos, update color scheme, and create new marketing materials.',
    assigneeId: 'e3',
    assigneeName: 'Priya Patel',
    stage: 'completed',
    priority: 'low',
    dueDate: '2024-04-10',
    createdAt: '2024-04-01',
    comments: [
      {
        id: 'tc4',
        author: 'Alice Morgan',
        content: 'Looks perfect! Approved.',
        time: '3 days ago',
      },
    ],
    subtasks: [
      { id: 'st10', title: 'Design new logo', completed: true },
      { id: 'st11', title: 'Update website', completed: true },
      { id: 'st12', title: 'Create social media kit', completed: true },
    ],
  },
  {
    id: 't5',
    title: 'Inventory system optimization',
    description:
      'Improve the inventory tracking system performance and add barcode scanning.',
    assigneeId: 'e4',
    assigneeName: 'James Cole',
    stage: 'in_progress',
    priority: 'high',
    dueDate: '2024-04-22',
    createdAt: '2024-04-08',
    comments: [],
    subtasks: [
      { id: 'st13', title: 'Optimize database queries', completed: true },
      {
        id: 'st14',
        title: 'Add barcode scanner integration',
        completed: false,
      },
    ],
  },
];

export const mockAnnouncements: Announcement[] = [
  {
    id: 'a1',
    title: 'Team Outing Next Friday',
    description:
      "We're planning a team outing next Friday afternoon. Everyone is welcome to join. Details will be shared via email.",
    author: 'Alice Morgan',
    createdAt: '2024-04-14',
  },
  {
    id: 'a2',
    title: 'New Client Onboarding Process',
    description:
      'Starting next week, all new client onboarding will follow the updated process. Please review the documentation.',
    author: 'Business Owner',
    createdAt: '2024-04-12',
  },
  {
    id: 'a3',
    title: 'System Maintenance This Weekend',
    description:
      'The platform will undergo scheduled maintenance this Saturday from 2 AM to 6 AM. Expect brief downtime.',
    author: 'David Kim',
    createdAt: '2024-04-10',
  },
];

export const mockTeamMessages: TeamMessage[] = [
  {
    id: 'tm1',
    sender: 'Alice Morgan',
    senderInitials: 'AM',
    content: "Good morning team! 🌟 Let's have a great day.",
    time: '9:00 AM',
  },
  {
    id: 'tm2',
    sender: 'David Kim',
    senderInitials: 'DK',
    content: "Morning! I'll be heading to the field site around 10.",
    time: '9:05 AM',
  },
  {
    id: 'tm3',
    sender: 'Priya Patel',
    senderInitials: 'PP',
    content: 'The new designs are ready for review. Check the shared folder!',
    time: '9:15 AM',
  },
  {
    id: 'tm4',
    sender: 'James Cole',
    senderInitials: 'JC',
    content:
      'Just finished the morning maintenance rounds. All systems operational ✅',
    time: '9:30 AM',
  },
  {
    id: 'tm5',
    sender: 'Sofia Rivera',
    senderInitials: 'SR',
    content:
      "I'll be handling the client calls today. Let me know if you need anything.",
    time: '9:45 AM',
  },
];

export const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
export const timeSlots = [
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
];
