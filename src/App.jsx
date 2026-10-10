import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { HRProvider, useHR, ICONS } from './store';
import Modal from './components/Modal';
import ToastContainer from './components/ToastContainer';

import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeProfile from './pages/EmployeeProfile';
import { Departments, Designations, Shifts } from './pages/OrgPages';
import SalaryStructure from './pages/SalaryStructure';
import {
  AttendanceDaily,
  AttendanceMonthly,
  AttendanceSummary,
  AttendanceLate
} from './pages/AttendancePages';
import { LeaveRequests, LeaveApproval, LeaveBalance } from './pages/LeavePages';
import {
  PayrollDashboard,
  PayrollGenerate,
  PayrollRun,
  PayrollHistory,
  PayrollDetails,
  SalaryCalculation
} from './pages/PayrollPages';
import PayslipView from './pages/PayslipView';
import ReportsPage from './pages/ReportsPage';

import './index.css';

const Icon = ({ name, size = 18 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: `<path d="${ICONS[name] || ICONS['file']}"/>` }}
    />
  );
};

const MENU = [
  { t: 'Dashboard', i: 'home', r: '' },
  {
    t: 'Employee Management',
    i: 'users',
    c: [
      ['Employee List', 'employees'],
      ['Employee Profile', 'employee-profile'],
      ['Salary Structure', 'salary-structure']
    ]
  },
  {
    t: 'Attendance Management',
    i: 'userCheck',
    c: [
      ['Daily Attendance', 'attendance-daily'],
      ['Monthly Attendance', 'attendance-monthly'],
      ['Attendance Summary', 'attendance-summary'],
      ['Late / Early / Overtime', 'attendance-late']
    ]
  },
  {
    t: 'Leave Management',
    i: 'calendar',
    c: [
      ['Leave Requests', 'leave-requests'],
      ['Leave Approval', 'leave-approval'],
      ['Leave Balance', 'leave-balance']
    ]
  },
  {
    t: 'Payroll Management',
    i: 'card',
    c: [
      ['Payroll Dashboard', 'payroll-dashboard'],
      ['Generate Payroll', 'payroll-generate'],
      ['Payroll History', 'payroll-history'],
      ['Salary Calculation', 'salary-calculation'],
      ['Payslip', 'payslip']
    ]
  },
  { t: 'Departments', i: 'building', r: 'departments' },
  { t: 'Designations', i: 'briefcase', r: 'designations' },
  { t: 'Shift Management', i: 'clock', r: 'shifts' },
  {
    t: 'Reports',
    i: 'chart',
    c: [
      ['Employee Report', 'reports/employee'],
      ['Attendance Report', 'reports/attendance'],
      ['Payroll Report', 'reports/payroll'],
      ['Salary Report', 'reports/salary'],
      ['Leave / Overtime', 'reports/leave']
    ]
  }
];

function Layout({ children, toggleTheme, theme }) {
  const [sideOpen, setSideOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const { db, resetDB } = useHR();

  const cur = location.pathname.replace(/^\//, '') || '';
  const act = (r) => (r.includes('/') ? cur === r : cur.split('/')[0] === r);

  const pendingLeaves = db.leaves.filter((l) => l.status === 'Pending').length;
  const ungeneratedPayroll = !db.payrolls.some((p) => p.payroll_month === db.meta.month);
  const pendingSalaryPayments = db.payroll_items.filter((i) => i.payment_status === 'Pending').length;

  const notifCount =
    (pendingLeaves ? 1 : 0) + (ungeneratedPayroll ? 1 : 0) + (pendingSalaryPayments ? 1 : 0);

  return (
    <>
      <aside className={`side ${sideOpen ? 'open' : ''}`} id="side">
        <div className="brand">
          <div className="lg">N</div>
          <div>
            Nexora HRMS<small>HR &amp; Payroll Suite</small>
          </div>
        </div>
        <nav className="nav">
          {MENU.map((m, i) =>
            m.c ? (
              <div key={i} className={`grp ${m.c.some((c) => act(c[1])) ? 'open' : ''}`}>
                <button
                  className="gh"
                  onClick={(e) => e.currentTarget.parentNode.classList.toggle('open')}
                >
                  <Icon name={m.i} />
                  <span>{m.t}</span>
                  <span className="ch">
                    <Icon name="chevron" size={15} />
                  </span>
                </button>
                <div className="sub">
                  {m.c.map((c, j) => (
                    <Link
                      key={j}
                      to={`/${c[1]}`}
                      className={act(c[1]) ? 'active' : ''}
                      onClick={() => setSideOpen(false)}
                    >
                      {c[0]}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={i}
                className={`it ${act(m.r) ? 'active' : ''}`}
                to={`/${m.r}`}
                onClick={() => setSideOpen(false)}
              >
                <Icon name={m.i} />
                <span>{m.t}</span>
              </Link>
            )
          )}
        </nav>
        <div className="sfoot">
          <button id="resetBtn" onClick={resetDB}>
            <Icon name="refresh" size={15} /> Reset demo data
          </button>
        </div>
      </aside>

      <div
        className={`scrim ${sideOpen ? 'show' : ''}`}
        onClick={() => setSideOpen(false)}
      ></div>

      <div className="main">
        <header className="top">
          <button className="ib hamb" onClick={() => setSideOpen(true)}>
            <Icon name="menu" />
          </button>
          <h1 id="pageTitle">Nexora HRMS</h1>
          <div className="sp"></div>

          <div style={{ position: 'relative' }}>
            <button className="ib" onClick={() => setNotifOpen(!notifOpen)}>
              <Icon name="bell" />
              {notifCount > 0 && <span className="dot">{notifCount}</span>}
            </button>

            {notifOpen && (
              <div className="notif">
                <h4>
                  <b>Notifications</b>
                  <a
                    href="#markread"
                    onClick={(e) => {
                      e.preventDefault();
                      setNotifOpen(false);
                    }}
                  >
                    Close
                  </a>
                </h4>
                {pendingLeaves > 0 && (
                  <Link to="/leave-approval" onClick={() => setNotifOpen(false)}>
                    <i style={{ background: '#f59e0b' }}></i>
                    <span>{pendingLeaves} leave request(s) awaiting approval</span>
                  </Link>
                )}
                {ungeneratedPayroll && (
                  <Link to="/payroll-generate" onClick={() => setNotifOpen(false)}>
                    <i style={{ background: '#2563eb' }}></i>
                    <span>Payroll for current month not generated yet</span>
                  </Link>
                )}
                {pendingSalaryPayments > 0 && (
                  <Link to="/payroll-history" onClick={() => setNotifOpen(false)}>
                    <i style={{ background: '#dc2626' }}></i>
                    <span>{pendingSalaryPayments} salary payment(s) pending</span>
                  </Link>
                )}
                {notifCount === 0 && (
                  <div className="empty muted" style={{ padding: 20, textAlign: 'center' }}>
                    You are all caught up
                  </div>
                )}
              </div>
            )}
          </div>

          <button className="ib" onClick={toggleTheme}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>

          <div className="me">
            <div className="av" style={{ width: 36, height: 36, background: '#2563eb' }}>
              HR
            </div>
            <div>
              <b>HR Admin</b>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        <main className="view">{children}</main>
      </div>

      <Modal />
      <ToastContainer />
    </>
  );
}

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('nexora_theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('nexora_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <HRProvider>
      <Router>
        <Layout toggleTheme={toggleTheme} theme={theme}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employee-profile" element={<EmployeeProfile />} />
            <Route path="/employee-profile/:id" element={<EmployeeProfile />} />
            <Route path="/salary-structure" element={<SalaryStructure />} />
            <Route path="/attendance-daily" element={<AttendanceDaily />} />
            <Route path="/attendance-monthly" element={<AttendanceMonthly />} />
            <Route path="/attendance-summary" element={<AttendanceSummary />} />
            <Route path="/attendance-late" element={<AttendanceLate />} />
            <Route path="/leave-requests" element={<LeaveRequests />} />
            <Route path="/leave-approval" element={<LeaveApproval />} />
            <Route path="/leave-balance" element={<LeaveBalance />} />
            <Route path="/payroll-dashboard" element={<PayrollDashboard />} />
            <Route path="/payroll-generate" element={<PayrollGenerate />} />
            <Route path="/payroll-generate/:id" element={<PayrollGenerate />} />
            <Route path="/payroll-run/:pid" element={<PayrollRun />} />
            <Route path="/payroll-history" element={<PayrollHistory />} />
            <Route path="/payroll-details/:pid/:eid" element={<PayrollDetails />} />
            <Route path="/salary-calculation" element={<SalaryCalculation />} />
            <Route path="/payslip" element={<PayslipView />} />
            <Route path="/payslip/:pid/:eid" element={<PayslipView />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/designations" element={<Designations />} />
            <Route path="/shifts" element={<Shifts />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/:type" element={<ReportsPage />} />
          </Routes>
        </Layout>
      </Router>
    </HRProvider>
  );
}
