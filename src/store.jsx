import React, { createContext, useContext, useState, useEffect } from 'react';

export const API = {
  useBackend: false,
  base: '/api',
  endpoints: {
    employees: '/employees',
    attendance: '/attendance',
    leaves: '/leaves',
    salary: '/salary',
    payroll: '/payroll',
    payslips: '/payslips',
    reports: '/reports'
  }
};

/* ---------- utils ---------- */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const pad = (n) => String(n).padStart(2, '0');
export const r2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
export const num = (n) => Number(r2(n || 0)).toLocaleString('en-IN');
export const inr = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s) => {
  if (!s) return new Date();
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addD = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const TODAY = ymd(new Date());
export const CUR_YM = TODAY.slice(0, 7);
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const fmtD = (s) => {
  if (!s) return '—';
  const d = parse(s);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
};
export const ymLabel = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return MONTHS[+m - 1] + ' ' + y;
};
export const daysIn = (ym) => {
  if (!ym) return 30;
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};
export const addMonths = (ym, n) => {
  if (!ym) ym = CUR_YM;
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
export const toMin = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
export const fromMin = (n) => `${pad(Math.floor(n / 60))}:${pad(n % 60)}`;
export const t12 = (t) => {
  if (!t) return '—';
  let [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(h)}:${pad(m)} ${ap}`;
};
export const stripHTML = (h) => String(h).replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

function rng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- icons ---------- */
export const ICONS = {
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  userCheck: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M17 11l2 2 4-4',
  calendar: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18',
  card: 'M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M1 10h22',
  building: 'M3 21h18 M5 21V7l8-4v18 M19 21V11l-6-4 M9 9v.01 M9 12v.01 M9 15v.01 M9 18v.01',
  briefcase: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
  chart: 'M12 20V10 M18 20V4 M6 20v-4',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35',
  plus: 'M12 5v14 M5 12h14',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z',
  trash: 'M3 6h18 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6 M10 11v6 M14 11v6 M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  printer: 'M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18 M6 6l12 12',
  menu: 'M3 12h18 M3 6h18 M3 18h18',
  chevron: 'M6 9l6 6 6-6',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9z',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  refresh: 'M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12'
};

/* ---------- master config ---------- */
export const COMPANY = {
  name: 'Nexora Technologies Pvt. Ltd.',
  address: 'Tower B, Business Park, Baner Road, Pune, Maharashtra 411045',
  email: 'hr@nexora.in',
  phone: '+91 20 4000 1234'
};

export const CFG = {
  pf_rate: 12,
  pf_cap: 15000,
  esi_rate: 0.75,
  esi_limit: 21000,
  pt_amount: 200,
  pt_min_gross: 15000,
  tds_threshold: 50000,
  tds_rate: 10,
  ot_multiplier: 1.5,
  late_marks_per_halfday: 3,
  std_hours: 8
};

export const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Paid Leave', 'Unpaid Leave'];
export const LEAVE_QUOTA = { 'Casual Leave': 12, 'Sick Leave': 12, 'Earned Leave': 15, 'Paid Leave': 6 };
export const ATT_STATUS = ['Present', 'Absent', 'Half Day', 'Paid Leave', 'Unpaid Leave', 'Holiday', 'Weekly Off'];
export const BC = {
  Present: 'green',
  Absent: 'red',
  'Half Day': 'amber',
  'Paid Leave': 'blue',
  'Unpaid Leave': 'purple',
  Holiday: 'teal',
  'Weekly Off': 'gray',
  Active: 'green',
  Inactive: 'red',
  'On Notice': 'amber',
  Probation: 'blue',
  Pending: 'amber',
  Approved: 'green',
  Rejected: 'red',
  Paid: 'green',
  Partial: 'blue',
  Draft: 'gray',
  Generated: 'blue',
  Finalized: 'green',
  'Not Generated': 'gray',
  Calculated: 'purple',
  Verified: 'green',
  'Not Marked': 'gray',
  Uploaded: 'blue'
};

export const SHORT = {
  Present: 'P',
  Absent: 'A',
  'Half Day': 'HD',
  'Paid Leave': 'PL',
  'Unpaid Leave': 'UL',
  Holiday: 'H',
  'Weekly Off': 'WO'
};

export const slug = (s) => String(s || '').toLowerCase().replace(/\s+/g, '-');

/* ---------- seed database ---------- */
export function seedDB() {
  const d = {
    meta: { month: CUR_YM },
    departments: [],
    designations: [],
    shifts: [],
    holidays: [],
    employees: [],
    attendance: [],
    leaves: [],
    payrolls: [],
    payroll_items: [],
    activity: []
  };

  d.departments = [
    ['D01', 'Human Resources', 'HR'],
    ['D02', 'Finance & Accounts', 'FIN'],
    ['D03', 'Sales', 'SAL'],
    ['D04', 'Information Technology', 'IT'],
    ['D05', 'Operations', 'OPS'],
    ['D06', 'Marketing', 'MKT']
  ].map(([department_id, department_name, department_code]) => ({ department_id, department_name, department_code, department_head: '' }));

  d.designations = [
    ['G01', 'HR Manager', 'D01', 'Manager'],
    ['G02', 'HR Executive', 'D01', 'Executive'],
    ['G03', 'Accountant', 'D02', 'Executive'],
    ['G04', 'Finance Manager', 'D02', 'Manager'],
    ['G05', 'Sales Executive', 'D03', 'Executive'],
    ['G06', 'Sales Manager', 'D03', 'Manager'],
    ['G07', 'Software Engineer', 'D04', 'Executive'],
    ['G08', 'Team Lead', 'D04', 'Lead'],
    ['G09', 'Operations Supervisor', 'D05', 'Lead'],
    ['G10', 'Warehouse Executive', 'D05', 'Executive'],
    ['G11', 'Marketing Executive', 'D06', 'Executive'],
    ['G12', 'Content Writer', 'D06', 'Executive']
  ].map(([designation_id, designation_name, department_id, level]) => ({ designation_id, designation_name, department_id, level }));

  d.shifts = [
    { shift_id: 'S1', shift_name: 'General Shift', start_time: '09:30', end_time: '18:30', grace_minutes: 10 },
    { shift_id: 'S2', shift_name: 'Morning Shift', start_time: '06:00', end_time: '14:00', grace_minutes: 10 },
    { shift_id: 'S3', shift_name: 'Evening Shift', start_time: '14:00', end_time: '22:00', grace_minutes: 10 }
  ];

  d.holidays = [
    ['2026-08-15', 'Independence Day'],
    ['2026-09-14', 'Ganesh Chaturthi'],
    ['2026-10-02', 'Gandhi Jayanti'],
    ['2026-10-20', 'Dussehra'],
    ['2026-11-08', 'Diwali'],
    ['2026-12-25', 'Christmas']
  ].map(([holiday_date, holiday_name]) => ({ holiday_date, holiday_name }));

  const E = [
    ['Ananya Sharma', 'Female', 'D01', 'G01', '2019-04-15', 45000, 'S1', 'Active'],
    ['Rohit Verma', 'Male', 'D02', 'G04', '2018-07-02', 52000, 'S1', 'Active'],
    ['Priya Nair', 'Female', 'D02', 'G03', '2021-01-11', 24000, 'S1', 'Active'],
    ['Karan Mehta', 'Male', 'D03', 'G06', '2020-03-09', 40000, 'S1', 'Active'],
    ['Sneha Kulkarni', 'Female', 'D03', 'G05', '2022-06-20', 18000, 'S1', 'Active'],
    ['Vikram Singh', 'Male', 'D04', 'G08', '2017-11-27', 60000, 'S1', 'Active'],
    ['Neha Gupta', 'Female', 'D04', 'G07', '2022-09-05', 36000, 'S1', 'Active'],
    ['Arjun Reddy', 'Male', 'D04', 'G07', '2023-02-13', 32000, 'S1', 'Probation'],
    ['Pooja Iyer', 'Female', 'D05', 'G09', '2021-08-16', 22000, 'S2', 'Active'],
    ['Manoj Yadav', 'Male', 'D05', 'G10', '2023-05-22', 9000, 'S3', 'Active'],
    ['Divya Joshi', 'Female', 'D06', 'G11', '2022-01-17', 20000, 'S1', 'Active'],
    ['Sanjay Patil', 'Male', 'D06', 'G12', '2023-10-09', 16000, 'S1', 'Active'],
    ['Farhan Khan', 'Male', 'D01', 'G02', '2024-02-05', 11000, 'S1', 'Active'],
    ['Ritu Agarwal', 'Female', 'D03', 'G05', '2024-07-01', 10000, 'S1', 'On Notice'],
    ['Kavita Rao', 'Female', 'D02', 'G03', '2019-09-09', 23000, 'S1', 'Inactive'],
    ['Amitabh Banerjee', 'Male', 'D04', 'G07', '2023-11-15', 38000, 'S1', 'Active'],
    ['Shreya Ghoshal', 'Female', 'D06', 'G11', '2024-01-10', 21000, 'S1', 'Active'],
    ['Rajesh Khanna', 'Male', 'D05', 'G10', '2022-04-18', 15000, 'S2', 'Active'],
    ['Deepika Padukone', 'Female', 'D01', 'G02', '2023-08-01', 28000, 'S1', 'Active'],
    ['Ranveer Singh', 'Male', 'D03', 'G05', '2022-12-05', 31000, 'S1', 'Active']
  ];
  const L = 'ABCDEFGHJKLMNPRSTUVWXYZ';

  E.forEach((e, i) => {
    const r = rng('emp' + i);
    const S = defaultStructure(e[5]);
    if (i === 3) S.incentive = 2500;
    if (i === 4) S.incentive = 1500;
    if (i === 9) S.advance_salary = 1000;
    if (i === 15) S.bonus = 3000;
    if (i === 18) S.incentive = 2000;

    d.employees.push({
      employee_id: 'EMP' + String(i + 1).padStart(3, '0'),
      employee_name: e[0],
      gender: e[1],
      dob: `${1984 + Math.floor(r() * 15)}-${pad(1 + Math.floor(r() * 12))}-${pad(1 + Math.floor(r() * 28))}`,
      photo: '',
      department_id: e[2],
      designation_id: e[3],
      joining_date: e[4],
      phone: '9' + String(Math.floor(1e8 + r() * 9e8)),
      email: e[0].toLowerCase().replace(/ /g, '.') + '@nexora.in',
      status: e[7],
      shift_id: e[6],
      basic_salary: e[5],
      gross_salary: grossOf(S),
      bank_account: String(Math.floor(1e11 + r() * 9e11)),
      ifsc: ['HDFC0001234', 'ICIC0004521', 'SBIN0003345', 'UTIB0000987'][i % 4],
      pan:
        Array.from({ length: 5 }, () => L[Math.floor(r() * L.length)]).join('') +
        String(Math.floor(1000 + r() * 9000)) +
        L[Math.floor(r() * L.length)],
      pf_number: `MHPUN${String(1000000 + i * 137)}000`,
      esi_number: String(Math.floor(1e9 + r() * 9e9)),
      address: `${12 + i}, Lake View Residency, Pune - 4110${pad(10 + i)}`,
      emergency_contact: '9' + String(Math.floor(1e8 + r() * 9e8)),
      salary_structure: S,
      documents: [
        { name: 'Aadhaar Card', status: 'Verified', date: e[4] },
        { name: 'PAN Card', status: 'Verified', date: e[4] },
        { name: 'Offer Letter', status: 'Uploaded', date: e[4] },
        { name: 'Bank Passbook', status: 'Uploaded', date: e[4] }
      ]
    });
  });

  d.departments.forEach((x, i) => (x.department_head = ['EMP001', 'EMP002', 'EMP004', 'EMP006', 'EMP009', 'EMP011'][i]));

  /* leaves */
  const isW = (ds) => parse(ds).getDay() !== 0 && !d.holidays.find((h) => h.holiday_date === ds);
  const lv = (i, type, off, len, st, reason) => {
    let f = addD(new Date(), off);
    while (!isW(ymd(f))) f = addD(f, 1);
    let t = new Date(f),
      c = 1;
    while (c < len) {
      t = addD(t, 1);
      if (isW(ymd(t))) c++;
    }
    d.leaves.push({
      leave_id: 'LV' + String(d.leaves.length + 1).padStart(4, '0'),
      employee_id: 'EMP' + String(i).padStart(3, '0'),
      leave_type: type,
      from_date: ymd(f),
      to_date: ymd(t),
      leave_days: len,
      reason,
      status: st,
      applied_on: ymd(addD(f, -3)),
      approved_on: st === 'Pending' ? '' : ymd(addD(f, -2)),
      remarks: st === 'Rejected' ? 'Project deadline — please reschedule' : ''
    });
  };

  lv(3, 'Casual Leave', -52, 3, 'Approved', 'Family function');
  lv(7, 'Sick Leave', -45, 2, 'Approved', 'Viral fever');
  lv(2, 'Earned Leave', -38, 4, 'Approved', 'Vacation trip');
  lv(10, 'Unpaid Leave', -33, 2, 'Approved', 'Personal work');
  lv(5, 'Casual Leave', -20, 1, 'Approved', 'Bank work');
  lv(9, 'Sick Leave', -12, 2, 'Approved', 'Dental treatment');
  lv(1, 'Paid Leave', -6, 1, 'Approved', 'Anniversary');
  lv(4, 'Casual Leave', -3, 1, 'Approved', 'Relative visiting');
  lv(8, 'Sick Leave', 0, 1, 'Approved', 'Migraine');
  lv(12, 'Casual Leave', -15, 2, 'Rejected', 'Short trip');
  lv(11, 'Casual Leave', 2, 2, 'Pending', "Sister's wedding");
  lv(6, 'Earned Leave', 4, 3, 'Pending', 'Family vacation');
  lv(13, 'Casual Leave', 7, 1, 'Pending', 'House shifting');
  lv(2, 'Paid Leave', 9, 2, 'Pending', 'Medical check-up');
  lv(16, 'Sick Leave', 3, 2, 'Pending', 'Flu and fever');
  lv(17, 'Casual Leave', 5, 1, 'Pending', 'Personal work');
  lv(19, 'Earned Leave', 8, 4, 'Approved', 'Annual family trip');
  lv(20, 'Casual Leave', -2, 1, 'Approved', 'Home repair work');

  /* attendance */
  let n = 0;
  const shiftOfLocal = (id) => d.shifts.find((s) => s.shift_id === id) || d.shifts[0];
  const leaveOnLocal = (id, ds) =>
    d.leaves.find((l) => l.employee_id === id && l.status === 'Approved' && l.from_date <= ds && l.to_date >= ds);
  const recalcAttLocal = (rec, empObj) => {
    const sh = shiftOfLocal(empObj && empObj.shift_id),
      st = rec.attendance_status;
    if (!['Present', 'Half Day'].includes(st)) {
      Object.assign(rec, { check_in: '', check_out: '', working_hours: 0, late_minutes: 0, early_leaving_minutes: 0, overtime_hours: 0 });
      return;
    }
    const s = toMin(sh.start_time),
      en = toMin(sh.end_time),
      g = sh.grace_minutes,
      inn = rec.check_in ? toMin(rec.check_in) : null,
      out = rec.check_out ? toMin(rec.check_out) : null;
    rec.working_hours = inn != null && out != null && out > inn ? r2((out - inn) / 60) : 0;
    rec.late_minutes = inn != null && inn > s + g ? inn - s : 0;
    rec.early_leaving_minutes = st === 'Present' && out != null && out < en - 10 ? en - out : 0;
    rec.overtime_hours = st === 'Present' && out != null && out - en >= 30 ? Math.round(((out - en) / 60) * 2) / 2 : 0;
  };

  d.employees.forEach((e) => {
    if (e.status === 'Inactive') return;
    const sh = shiftOfLocal(e.shift_id),
      s = toMin(sh.start_time),
      en = toMin(sh.end_time),
      g = sh.grace_minutes;
    [-2, -1, 0]
      .map((k) => addMonths(CUR_YM, k))
      .forEach((ym) => {
        for (let day = 1; day <= daysIn(ym); day++) {
          const ds = `${ym}-${pad(day)}`;
          if (ds > TODAY) break;
          if (ds < e.joining_date) continue;
          const r = rng(e.employee_id + ds),
            rec = {
              attendance_id: 'ATT' + String(++n).padStart(5, '0'),
              employee_id: e.employee_id,
              attendance_date: ds,
              check_in: '',
              check_out: '',
              working_hours: 0,
              attendance_status: 'Present',
              late_minutes: 0,
              early_leaving_minutes: 0,
              overtime_hours: 0
            },
            lo = leaveOnLocal(e.employee_id, ds);

          if (parse(ds).getDay() === 0) rec.attendance_status = 'Weekly Off';
          else if (d.holidays.find((h) => h.holiday_date === ds)) rec.attendance_status = 'Holiday';
          else if (lo) rec.attendance_status = lo.leave_type === 'Unpaid Leave' ? 'Unpaid Leave' : 'Paid Leave';
          else {
            const u = r();
            rec.attendance_status = u < 0.04 ? 'Absent' : u < 0.08 ? 'Half Day' : 'Present';
          }
          if (['Present', 'Half Day'].includes(rec.attendance_status)) {
            let inn, out;
            if (rec.attendance_status === 'Half Day') {
              inn = s + Math.floor(r() * 15);
              out = inn + 240 + Math.floor(r() * 30);
            } else {
              const u = r();
              inn =
                u < 0.72
                  ? s - 15 + Math.floor(r() * (15 + g))
                  : u < 0.94
                  ? s + g + 1 + Math.floor(r() * 35)
                  : s + g + 36 + Math.floor(r() * 40);
              const v = r();
              out =
                v < 0.12
                  ? en - 12 - Math.floor(r() * 45)
                  : v < 0.32
                  ? en + 30 + Math.floor(r() * 120)
                  : en - 5 + Math.floor(r() * 25);
              if (out < inn + 300) out = inn + 300;
            }
            out = Math.min(out, 1435);
            rec.check_in = fromMin(inn);
            rec.check_out = ds === TODAY ? '' : fromMin(out);
            recalcAttLocal(rec, e);
          }
          d.attendance.push(rec);
        }
      });
  });

  /* payroll history (last 5 months + current month) */
  for (let k = 5; k >= 0; k--) {
    const ym = addMonths(CUR_YM, -k),
      pid = 'PR-' + ym,
      end = `${ym}-${daysIn(ym)}`;
    let idx = 0;
    d.employees
      .filter((e) => e.status !== 'Inactive' && e.joining_date <= end)
      .forEach((e) => {
        const inp = {
          working_days: 26,
          present_days: 25,
          paid_leave: 1,
          overtime_hours: Math.floor((idx * 3) % 10),
          late_days: Math.floor(idx % 4),
          bonus: e.salary_structure.bonus,
          incentive: e.salary_structure.incentive,
          other_deduction: e.salary_structure.other_deduction
        };
        const c = computeSalary(e, inp);
        const paid = k >= 1 || idx < 12;
        d.payroll_items.push({
          payroll_item_id: pid + '-' + e.employee_id,
          payroll_id: pid,
          employee_id: e.employee_id,
          employee_name: e.employee_name,
          department_id: e.department_id,
          designation_id: e.designation_id,
          ...c,
          payment_status: paid ? 'Paid' : 'Pending',
          paid_date: paid ? `${addMonths(ym, 1)}-0${1 + (idx % 4)}` : ''
        });
        idx++;
      });

    d.payrolls.push({
      payroll_id: pid,
      payroll_month: ym,
      generated_date: k === 0 ? TODAY : `${addMonths(ym, 1)}-01`,
      status: k >= 2 ? 'Finalized' : 'Generated',
      generated_by: 'HR Admin'
    });

    d.activity.push({ ts: `${addMonths(ym, 1)}-01T11:00:00`, text: `Payroll for ${ymLabel(ym)} generated (${idx} employees)`, kind: 'payroll' });
    if (k >= 1) d.activity.push({ ts: `${addMonths(ym, 1)}-04T16:30:00`, text: `Salary for ${ymLabel(ym)} marked as paid`, kind: 'payroll' });
  }

  d.activity.push({ ts: ymd(addD(new Date(), -1)) + 'T10:15:00', text: 'Leave approved for Karan Mehta (Casual Leave)', kind: 'leave' });
  d.activity.push({ ts: ymd(addD(new Date(), -2)) + 'T15:40:00', text: 'Salary structure revised for Sneha Kulkarni', kind: 'salary' });
  d.activity.push({ ts: ymd(addD(new Date(), -3)) + 'T14:20:00', text: 'New Employee added: Amitabh Banerjee (EMP016)', kind: 'employee' });

  return d;
}


/* ---------- domain helpers ---------- */
export const grossOf = (S) => (S ? S.basic_salary + S.hra + S.conveyance_allowance + S.medical_allowance + S.special_allowance : 0);
export const defaultStructure = (b) => ({
  basic_salary: b,
  hra: Math.round(b * 0.4),
  conveyance_allowance: 1600,
  medical_allowance: 1250,
  special_allowance: Math.round(b * 0.2),
  bonus: 0,
  incentive: 0,
  advance_salary: 0,
  other_deduction: 0
});

export function holidayOn(db, ds) {
  return db.holidays.find((h) => h.holiday_date === ds);
}
export function isWorking(db, ds) {
  return parse(ds).getDay() !== 0 && !holidayOn(db, ds);
}
export function workingDays(db, ym) {
  let c = 0;
  for (let d = 1; d <= daysIn(ym); d++) if (isWorking(db, `${ym}-${pad(d)}`)) c++;
  return c;
}
export function remainingWD(db, ym) {
  let c = 0;
  for (let d = 1; d <= daysIn(ym); d++) {
    const ds = `${ym}-${pad(d)}`;
    if (ds > TODAY && isWorking(db, ds)) c++;
  }
  return c;
}
export function countLeaveDays(db, f, t) {
  let c = 0;
  for (let d = parse(f); ymd(d) <= t; d = addD(d, 1)) if (isWorking(db, ymd(d))) c++;
  return c;
}
export function leaveOn(db, id, ds) {
  return db.leaves.find((l) => l.employee_id === id && l.status === 'Approved' && l.from_date <= ds && l.to_date >= ds);
}
export function attRec(db, e, d) {
  return db.attendance.find((a) => a.employee_id === e && a.attendance_date === d);
}
export function dashDate(db) {
  let d = parse(TODAY);
  for (let i = 0; i < 40; i++) {
    const ds = ymd(d);
    if (isWorking(db, ds) && db.attendance.some((a) => a.attendance_date === ds)) return ds;
    d = addD(d, -1);
  }
  return TODAY;
}
export function attSummary(db, id, ym) {
  const s = { present: 0, absent: 0, half: 0, paid_leave: 0, unpaid_leave: 0, holiday: 0, weekly_off: 0, late_days: 0, early_days: 0, overtime_hours: 0, records: 0 };
  db.attendance.forEach((a) => {
    if (a.employee_id !== id || !a.attendance_date.startsWith(ym)) return;
    s.records++;
    const t = a.attendance_status;
    if (t === 'Present') s.present++;
    else if (t === 'Absent') s.absent++;
    else if (t === 'Half Day') s.half++;
    else if (t === 'Paid Leave') s.paid_leave++;
    else if (t === 'Unpaid Leave') s.unpaid_leave++;
    else if (t === 'Holiday') s.holiday++;
    else s.weekly_off++;
    if (a.late_minutes > 0) s.late_days++;
    if (a.early_leaving_minutes > 0) s.early_days++;
    s.overtime_hours += a.overtime_hours || 0;
  });
  return s;
}
export function leaveBalance(db, id) {
  const y = TODAY.slice(0, 4),
    o = {};
  Object.keys(LEAVE_QUOTA).forEach((t) => {
    const used = db.leaves
      .filter((l) => l.employee_id === id && l.leave_type === t && l.status === 'Approved' && l.from_date.startsWith(y))
      .reduce((a, l) => a + l.leave_days, 0);
    o[t] = { quota: LEAVE_QUOTA[t], used, left: LEAVE_QUOTA[t] - used };
  });
  return o;
}
const defaultShift = { shift_id: 'S1', shift_name: 'General Shift', start_time: '09:30', end_time: '18:30', grace_minutes: 10 };
export function shiftOf(db, id) {
  if (!db || !db.shifts || !db.shifts.length) return defaultShift;
  return db.shifts.find((s) => s.shift_id === id) || db.shifts[0] || defaultShift;
}

export function emp(db, id) {
  return db.employees.find((x) => x.employee_id === id);
}
export function deptName(db, id) {
  return (db.departments.find((x) => x.department_id === id) || {}).department_name || '—';
}
export function desigName(db, id) {
  return (db.designations.find((x) => x.designation_id === id) || {}).designation_name || '—';
}
export function activeEmps(db) {
  return db.employees.filter((e) => e.status !== 'Inactive');
}

export function recalcAtt(db, rec) {
  const e = emp(db, rec.employee_id),
    sh = shiftOf(db, e && e.shift_id),
    st = rec.attendance_status;
  if (!['Present', 'Half Day'].includes(st)) {
    Object.assign(rec, { check_in: '', check_out: '', working_hours: 0, late_minutes: 0, early_leaving_minutes: 0, overtime_hours: 0 });
    return;
  }
  const s = toMin(sh.start_time),
    en = toMin(sh.end_time),
    g = sh.grace_minutes,
    inn = rec.check_in ? toMin(rec.check_in) : null,
    out = rec.check_out ? toMin(rec.check_out) : null;
  rec.working_hours = inn != null && out != null && out > inn ? r2((out - inn) / 60) : 0;
  rec.late_minutes = inn != null && inn > s + g ? inn - s : 0;
  rec.early_leaving_minutes = st === 'Present' && out != null && out < en - 10 ? en - out : 0;
  rec.overtime_hours = st === 'Present' && out != null && out - en >= 30 ? Math.round(((out - en) / 60) * 2) / 2 : 0;
}

export function buildInputs(db, e, ym, synth) {
  if (!e) return { working_days: 26, present_days: 26, paid_leave: 0, overtime_hours: 0, late_days: 0, bonus: 0, incentive: 0, other_deduction: 0, no_data: true, projected: 0 };
  const S = e.salary_structure || defaultStructure(e.basic_salary || 20000);
  const wd = workingDays(db, ym),
    sm = attSummary(db, e.employee_id, ym);
  const inp = {
    working_days: wd,
    present_days: 0,
    paid_leave: 0,
    overtime_hours: 0,
    late_days: 0,
    bonus: S.bonus || 0,
    incentive: S.incentive || 0,
    other_deduction: S.other_deduction || 0,
    no_data: false,
    projected: 0
  };
  if (sm.records > 0) {
    inp.present_days = sm.present + sm.half * 0.5;
    inp.paid_leave = sm.paid_leave;
    inp.overtime_hours = sm.overtime_hours;
    inp.late_days = sm.late_days;
    if (ym >= CUR_YM) {
      inp.projected = ym === CUR_YM ? remainingWD(db, ym) : wd;
      inp.present_days += inp.projected;
    }
  } else if (synth) {
    const r = rng(e.employee_id + ym);
    inp.paid_leave = r() < 0.25 ? 1 : 0;
    inp.present_days = wd - inp.paid_leave - Math.floor(r() * 3);
    inp.overtime_hours = Math.floor(r() * 10);
    inp.late_days = Math.floor(r() * 5);
  } else {
    inp.present_days = wd;
    inp.no_data = true;
  }
  return inp;
}

export function computeSalary(e, inp) {
  inp = inp || {};
  const S = (e && e.salary_structure) ? e.salary_structure : defaultStructure(e?.basic_salary || 20000);
  const wd = Math.max(1, +inp.working_days || 1),
    present = Math.max(0, +inp.present_days || 0),
    pl = Math.max(0, +inp.paid_leave || 0);
  const paid_days = Math.min(wd, present + pl),
    unpaid = r2(wd - paid_days),
    ratio = paid_days / wd,
    gm = grossOf(S),
    per_day = gm / wd,
    f = (x) => Math.round((x || 0) * ratio);
  const basic = f(S.basic_salary),
    hra = f(S.hra),
    conv = f(S.conveyance_allowance),
    med = f(S.medical_allowance),
    spl = f(S.special_allowance),
    allowances = hra + conv + med + spl;
  const ot = +inp.overtime_hours || 0,
    overtime_amount = Math.round(ot * ((S.basic_salary || 0) / wd / CFG.std_hours) * CFG.ot_multiplier);
  const bonus = +inp.bonus || 0,
    incentive = +inp.incentive || 0,
    gross = basic + allowances + overtime_amount + bonus + incentive;
  const pf = Math.round((Math.min(basic, CFG.pf_cap) * CFG.pf_rate) / 100),
    esi = gm <= CFG.esi_limit ? Math.round((gross * CFG.esi_rate) / 100) : 0;
  const pt = gross >= CFG.pt_min_gross ? CFG.pt_amount : 0,
    tds = gross > CFG.tds_threshold ? Math.round(((gross - CFG.tds_threshold) * CFG.tds_rate) / 100) : 0;
  const late_deduction = Math.round(Math.floor((+inp.late_days || 0) / CFG.late_marks_per_halfday) * 0.5 * per_day),
    adv = +(S.advance_salary || 0),
    oth = +(inp.other_deduction || 0);
  const ded = pf + esi + pt + tds + adv + late_deduction + oth;
  return {
    working_days: wd,
    present_days: present,
    paid_leave: pl,
    unpaid_leave: unpaid,
    paid_days,
    overtime_hours: ot,
    late_days: +inp.late_days || 0,
    basic_salary: basic,
    hra,
    conveyance_allowance: conv,
    medical_allowance: med,
    special_allowance: spl,
    allowances,
    overtime_amount,
    bonus,
    incentive,
    gross_salary: gross,
    pf,
    esi,
    professional_tax: pt,
    tds,
    advance_salary: adv,
    late_deduction,
    other_deduction: oth,
    total_deduction: ded,
    net_salary: gross - ded
  };
}


export function makeItem(pid, e, c, pay, paidDate) {
  return {
    payroll_item_id: pid + '-' + e.employee_id,
    payroll_id: pid,
    employee_id: e.employee_id,
    employee_name: e.employee_name,
    department_id: e.department_id,
    designation_id: e.designation_id,
    ...c,
    payment_status: pay,
    paid_date: paidDate || ''
  };
}

export function runItems(db, pid) {
  return db.payroll_items.filter((i) => i.payroll_id === pid);
}

export function totalsOf(items) {
  const t = { count: items.length, gross: 0, ded: 0, net: 0, paid: 0, pending: 0 };
  items.forEach((i) => {
    t.gross += i.gross_salary;
    t.ded += i.total_deduction;
    t.net += i.net_salary;
    i.payment_status === 'Paid' ? (t.paid += i.net_salary) : (t.pending += i.net_salary);
  });
  const p = items.filter((i) => i.payment_status === 'Paid').length;
  t.pay = !items.length ? 'Pending' : p === items.length ? 'Paid' : p === 0 ? 'Pending' : 'Partial';
  return t;
}

export function runTotals(db, pid) {
  return totalsOf(runItems(db, pid));
}

export function estFull(db, e) {
  return computeSalary(e, {
    working_days: 26,
    present_days: 26,
    paid_leave: 0,
    overtime_hours: 0,
    late_days: 0,
    bonus: e.salary_structure ? e.salary_structure.bonus : 0,
    incentive: e.salary_structure ? e.salary_structure.incentive : 0,
    other_deduction: e.salary_structure ? e.salary_structure.other_deduction : 0
  });
}

export function nextId(db, p, t, k, w) {
  return (
    p +
    String(Math.max(0, ...db[t].map((x) => parseInt(String(x[k]).slice(p.length)) || 0)) + 1).padStart(w, '0')
  );
}

export function numWords(n) {
  n = Math.round(n);
  if (n <= 0) return 'Zero';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (x) => (x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : ''));
  const three = (x) => (x >= 100 ? a[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' : '') : '') + (x % 100 ? two(x % 100) : '');
  let o = [];
  const cr = Math.floor(n / 1e7);
  n %= 1e7;
  const lk = Math.floor(n / 1e5);
  n %= 1e5;
  const th = Math.floor(n / 1e3);
  n %= 1e3;
  if (cr) o.push(three(cr) + ' Crore');
  if (lk) o.push(two(lk) + ' Lakh');
  if (th) o.push(two(th) + ' Thousand');
  if (n) o.push(three(n));
  return o.join(' ');
}

/* ---------- React Context & Hook ---------- */
const LS_KEY = 'nexora_hrms_v1';
const HRContext = createContext(null);

function sanitizeDB(data) {
  if (!data) return seedDB();
  if (!data.employees || !Array.isArray(data.employees)) data.employees = [];
  if (!data.shifts || !Array.isArray(data.shifts) || !data.shifts.length) {
    data.shifts = [
      { shift_id: 'S1', shift_name: 'General Shift', start_time: '09:30', end_time: '18:30', grace_minutes: 10 }
    ];
  }
  data.employees.forEach((empObj) => {
    if (!empObj.shift_id) empObj.shift_id = 'S1';
    if (!empObj.salary_structure) {
      empObj.salary_structure = defaultStructure(empObj.basic_salary || 25000);
    }
  });
  return data;
}

export function HRProvider({ children }) {
  const [db, setDb] = useState(() => {
    try {
      const d = JSON.parse(localStorage.getItem(LS_KEY));
      if (d && d.meta && d.meta.month === CUR_YM) return sanitizeDB(d);
    } catch (e) {}
    const seeded = seedDB();
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(seeded));
    } catch (e) {}
    return seeded;
  });


  const [toasts, setToasts] = useState([]);
  const [modalConfig, setModalConfig] = useState(null);

  const saveDb = (newDb) => {
    const updated = { ...newDb };
    setDb(updated);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
    } catch (e) {
      addToast('Browser storage full', 'err');
    }
  };

  const addToast = (message, type = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const logActivity = (text, kind) => {
    setDb((prev) => {
      const newAct = [...prev.activity, { ts: new Date().toISOString(), text, kind }];
      const next = { ...prev, activity: newAct };
      saveDb(next);
      return next;
    });
  };

  const resetDB = () => {
    localStorage.removeItem(LS_KEY);
    const fresh = seedDB();
    saveDb(fresh);
    addToast('Demo data reset ✔', 'ok');
  };

  const showModal = (config) => setModalConfig(config);
  const closeModal = () => setModalConfig(null);

  const confirmBox = (msg, onConfirm, label = 'Delete') => {
    showModal({
      title: 'Please confirm',
      size: 'sm',
      body: <div dangerouslySetInnerHTML={{ __html: `<p>${msg}</p>` }} />,
      footer: (
        <>
          <button className="btn sec" onClick={closeModal}>
            Cancel
          </button>
          <button
            className="btn no"
            onClick={() => {
              closeModal();
              if (onConfirm) onConfirm();
            }}
          >
            {label}
          </button>
        </>
      )
    });
  };

  return (
    <HRContext.Provider
      value={{
        db,
        setDb,
        saveDb,
        resetDB,
        toasts,
        addToast,
        logActivity,
        modalConfig,
        showModal,
        closeModal,
        confirmBox
      }}
    >
      {children}
    </HRContext.Provider>
  );
}

export function useHR() {
  const context = useContext(HRContext);
  if (!context) {
    throw new Error('useHR must be used within an HRProvider');
  }
  return context;
}
