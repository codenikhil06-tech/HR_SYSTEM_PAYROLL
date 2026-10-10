import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useHR,
  emp,
  activeEmps,
  deptName,
  desigName,
  shiftOf,
  fmtD,
  inr,
  attSummary,
  estFull,
  ymLabel,
  t12,
  stripHTML,
  TODAY,
  CUR_YM,
  ICONS
} from '../store';
import DataTable from '../components/DataTable';

const Icon = ({ name, size = 18 }) => (
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

const REPS = {
  employee: ['Employee Report', ['dept', 'emp']],
  attendance: ['Attendance Report', ['range', 'dept', 'emp']],
  monthly: ['Monthly Attendance', ['month', 'dept', 'emp']],
  salary: ['Salary Report', ['dept', 'emp']],
  payroll: ['Payroll Report', ['month', 'dept', 'emp']],
  leave: ['Leave Report', ['range', 'dept', 'emp']],
  overtime: ['Overtime Report', ['range', 'dept', 'emp']]
};

export default function ReportsPage() {
  const { type: paramType } = useParams();
  const navigate = useNavigate();
  const { db, addToast } = useHR();

  const [repType, setRepType] = useState(paramType || 'employee');
  const [from, setFrom] = useState(CUR_YM + '-01');
  const [to, setTo] = useState(TODAY);
  const [ym, setYm] = useState(CUR_YM);
  const [dept, setDept] = useState('');
  const [empId, setEmpId] = useState('');

  const currentType = REPS[repType] ? repType : 'employee';
  const u = REPS[currentType][1];

  const ok = (eObj) =>
    eObj &&
    (!dept || eObj.department_id === dept) &&
    (!empId || eObj.employee_id === empId);

  const inR = (dStr) => dStr >= from && dStr <= to;

  const buildReportData = () => {
    switch (currentType) {
      case 'employee':
        return {
          cols: [
            { h: 'ID', f: (e) => e.employee_id },
            { h: 'Name', f: (e) => e.employee_name },
            { h: 'Department', f: (e) => deptName(db, e.department_id) },
            { h: 'Designation', f: (e) => desigName(db, e.designation_id) },
            { h: 'Joining', f: (e) => fmtD(e.joining_date) },
            { h: 'Phone', f: (e) => e.phone },
            { h: 'Email', f: (e) => e.email },
            { h: 'Status', f: (e) => e.status },
            { h: 'PAN', f: (e) => e.pan || '—' },
            { h: 'PF No.', f: (e) => e.pf_number || '—' }
          ],
          rows: db.employees.filter(ok)
        };

      case 'attendance':
        return {
          cols: [
            { h: 'Date', f: (a) => fmtD(a.attendance_date) },
            { h: 'Employee', f: (a) => emp(db, a.employee_id)?.employee_name || a.employee_id },
            { h: 'Check In', f: (a) => t12(a.check_in) },
            { h: 'Check Out', f: (a) => t12(a.check_out) },
            { h: 'Hours', f: (a) => a.working_hours },
            { h: 'Status', f: (a) => a.attendance_status },
            { h: 'Late (min)', f: (a) => a.late_minutes },
            { h: 'OT (h)', f: (a) => a.overtime_hours }
          ],
          rows: db.attendance
            .filter((a) => inR(a.attendance_date) && ok(emp(db, a.employee_id)))
            .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date))
        };

      case 'monthly':
        return {
          cols: [
            { h: 'Employee', f: (r) => r.e.employee_name },
            { h: 'Present', f: (r) => r.s.present },
            { h: 'Half Day', f: (r) => r.s.half },
            { h: 'Absent', f: (r) => r.s.absent },
            { h: 'Paid Leave', f: (r) => r.s.paid_leave },
            { h: 'Unpaid Leave', f: (r) => r.s.unpaid_leave },
            { h: 'Late Days', f: (r) => r.s.late_days },
            { h: 'OT Hours', f: (r) => r.s.overtime_hours }
          ],
          rows: activeEmps(db)
            .filter(ok)
            .map((e) => ({ e, s: attSummary(db, e.employee_id, ym) }))
        };

      case 'salary':
        return {
          cols: [
            { h: 'ID', f: (e) => e.employee_id },
            { h: 'Name', f: (e) => e.employee_name },
            { h: 'Basic', cls: 'num', f: (e) => inr(e.salary_structure?.basic_salary || 0) },
            { h: 'HRA', cls: 'num', f: (e) => inr(e.salary_structure?.hra || 0) },
            {
              h: 'Allowances',
              cls: 'num',
              f: (e) =>
                inr(
                  (e.salary_structure?.conveyance_allowance || 0) +
                    (e.salary_structure?.medical_allowance || 0) +
                    (e.salary_structure?.special_allowance || 0)
                )
            },
            { h: 'Gross', cls: 'num', f: (e) => inr(e.gross_salary) },
            { h: 'Est. Deduction', cls: 'num', f: (e) => inr(estFull(db, e).total_deduction) },
            { h: 'Est. Net', cls: 'num', f: (e) => inr(estFull(db, e).net_salary) }
          ],
          rows: db.employees.filter(ok)
        };

      case 'payroll':
        return {
          cols: [
            { h: 'Month', f: (i) => ymLabel(i.payroll_id.slice(3)) },
            { h: 'Emp ID', f: (i) => i.employee_id },
            { h: 'Employee', f: (i) => i.employee_name },
            { h: 'Paid Days', f: (i) => i.paid_days },
            { h: 'Gross', cls: 'num', f: (i) => inr(i.gross_salary) },
            { h: 'Deduction', cls: 'num', f: (i) => inr(i.total_deduction) },
            { h: 'Net', cls: 'num', f: (i) => inr(i.net_salary) },
            { h: 'Payment', f: (i) => i.payment_status }
          ],
          rows: db.payroll_items.filter(
            (i) =>
              i.payroll_id === 'PR-' + ym &&
              ok(emp(db, i.employee_id) || { department_id: i.department_id, employee_id: i.employee_id })
          )
        };

      case 'leave':
        return {
          cols: [
            { h: 'Leave ID', f: (l) => l.leave_id },
            { h: 'Employee', f: (l) => (emp(db, l.employee_id) || {}).employee_name || l.employee_id },
            { h: 'Type', f: (l) => l.leave_type },
            { h: 'From', f: (l) => fmtD(l.from_date) },
            { h: 'To', f: (l) => fmtD(l.to_date) },
            { h: 'Days', f: (l) => l.leave_days },
            { h: 'Status', f: (l) => l.status }
          ],
          rows: db.leaves.filter(
            (l) => l.from_date <= to && l.to_date >= from && ok(emp(db, l.employee_id))
          )
        };

      default:
        return {
          cols: [
            { h: 'Date', f: (a) => fmtD(a.attendance_date) },
            { h: 'Employee', f: (a) => emp(db, a.employee_id)?.employee_name || a.employee_id },
            { h: 'Shift End', f: (a) => t12(shiftOf(db, emp(db, a.employee_id)?.shift_id).end_time) },
            { h: 'Check Out', f: (a) => t12(a.check_out) },
            { h: 'Overtime (h)', f: (a) => a.overtime_hours }
          ],
          rows: db.attendance
            .filter((a) => a.overtime_hours > 0 && inR(a.attendance_date) && ok(emp(db, a.employee_id)))
            .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date))
        };
    }
  };

  const reportData = buildReportData();

  const handleExportCSV = () => {
    const q = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    const csvContent = [
      reportData.cols.map((c) => q(c.h)).join(','),
      ...reportData.rows.map((r) =>
        reportData.cols
          .map((c) => {
            const rawVal = c.f ? c.f(r) : r[c.key];
            return q(stripHTML(rawVal));
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentType}-report-${TODAY}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('CSV exported ✔');
  };

  return (
    <>
      <div className="ph">
        <div>
          <h2>Reports</h2>
          <p>Generate, filter and export HR reports</p>
        </div>
      </div>

      <div className="grid g4" style={{ marginBottom: 16 }}>
        {Object.keys(REPS).map((k) => (
          <div
            key={k}
            className="card"
            style={{
              cursor: 'pointer',
              padding: 13,
              borderColor: k === currentType ? 'var(--primary)' : 'var(--border)',
              background: k === currentType ? 'var(--primary-l)' : 'var(--card)'
            }}
            onClick={() => {
              setRepType(k);
              navigate(`/reports/${k}`);
            }}
          >
            <div className="stat">
              <div
                className={`ico ${k === currentType ? 'blue' : 'gray'}`}
                style={{ width: 36, height: 36 }}
              >
                <Icon name="file" size={17} />
              </div>
              <b>{REPS[k][0]}</b>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>
          {REPS[currentType][0]}
          <span className="sp"></span>
          <button className="btn xs out" onClick={handleExportCSV}>
            <Icon name="download" size={13} /> CSV
          </button>
          <button className="btn xs out" onClick={() => addToast('Excel export', 'info')}>
            Excel
          </button>
          <button className="btn xs out" onClick={() => addToast('PDF export', 'info')}>
            PDF
          </button>
        </h3>

        <div className="filters">
          {u.includes('range') && (
            <>
              <div className="f">
                <label>From Date</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="f">
                <label>To Date</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </>
          )}

          {u.includes('month') && (
            <div className="f">
              <label>Month</label>
              <input type="month" value={ym} onChange={(e) => setYm(e.target.value || CUR_YM)} />
            </div>
          )}

          <div className="f">
            <label>Department</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="">All Departments</option>
              {db.departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.department_name}
                </option>
              ))}
            </select>
          </div>

          <div className="f">
            <label>Employee</label>
            <select value={empId} onChange={(e) => setEmpId(e.target.value)}>
              <option value="">All Employees</option>
              {db.employees.map((e) => (
                <option key={e.employee_id} value={e.employee_id}>
                  {e.employee_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable rows={reportData.rows} cols={reportData.cols} size={10} />
      </div>
    </>
  );
}
