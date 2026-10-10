import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useHR,
  runItems,
  emp,
  deptName,
  desigName,
  fmtD,
  inr,
  num,
  numWords,
  ymLabel,
  COMPANY,
  ICONS
} from '../store';

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

export default function PayslipView() {
  const { pid: paramPid, eid: paramEid } = useParams();
  const navigate = useNavigate();
  const { db, addToast } = useHR();

  const runs = [...db.payrolls].sort((a, b) => b.payroll_month.localeCompare(a.payroll_month));

  if (!runs.length) {
    return (
      <div className="card empty">
        <h3>No Payroll Runs Available</h3>
        <p>Generate a payroll run first to view payslips.</p>
      </div>
    );
  }

  const pid = paramPid && db.payrolls.some((p) => p.payroll_id === paramPid) ? paramPid : runs[0].payroll_id;
  const items = runItems(db, pid);
  let item = items.find((x) => x.employee_id === paramEid) || items[0];

  if (!item) {
    return (
      <div className="card empty">
        <h3>No Payroll Lines</h3>
        <p>No payroll line found for this selection.</p>
      </div>
    );
  }

  const eid = item.employee_id;
  const eObj = emp(db, eid) || {};

  return (
    <>
      <div className="ph">
        <div>
          <h2>Payslip</h2>
          <p>Official salary slip preview</p>
        </div>
        <div className="acts noprint">
          <select
            style={{ width: 180 }}
            value={pid}
            onChange={(e) => navigate(`/payslip/${e.target.value}/${eid}`)}
          >
            {runs.map((r) => (
              <option key={r.payroll_id} value={r.payroll_id}>
                {ymLabel(r.payroll_month)}
              </option>
            ))}
          </select>

          <select
            style={{ width: 230 }}
            value={eid}
            onChange={(e) => navigate(`/payslip/${pid}/${e.target.value}`)}
          >
            {items.map((x) => (
              <option key={x.employee_id} value={x.employee_id}>
                {x.employee_name}
              </option>
            ))}
          </select>

          <button className="btn" onClick={() => window.print()}>
            <Icon name="printer" size={15} /> PRINT PAYSLIP
          </button>
          <button
            className="btn out"
            onClick={() => addToast('Downloading Payslip PDF…', 'info')}
          >
            <Icon name="download" size={15} /> DOWNLOAD PDF
          </button>
        </div>
      </div>

      <div className="payslip" id="payslip">
        <div className="ps-head">
          <div className="lgo">N</div>
          <div>
            <h2>{COMPANY.name}</h2>
            <p>{COMPANY.address}</p>
            <p>
              {COMPANY.email} • {COMPANY.phone}
            </p>
          </div>
          <div className="tt">
            <b>PAYSLIP</b>
            <br />
            <span>{ymLabel(pid.slice(3))}</span>
          </div>
        </div>

        <div className="ps-two">
          <table>
            <thead>
              <tr>
                <th colSpan="2">Employee Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Employee Name</td>
                <td>
                  <b>{item.employee_name}</b>
                </td>
              </tr>
              <tr>
                <td>Employee ID</td>
                <td>{eid}</td>
              </tr>
              <tr>
                <td>Department</td>
                <td>{deptName(db, item.department_id)}</td>
              </tr>
              <tr>
                <td>Designation</td>
                <td>{desigName(db, item.designation_id)}</td>
              </tr>
              <tr>
                <td>Joining Date</td>
                <td>{fmtD(eObj.joining_date)}</td>
              </tr>
              <tr>
                <td>Bank A/c • IFSC</td>
                <td>
                  {eObj.bank_account || '—'} • {eObj.ifsc || '—'}
                </td>
              </tr>
            </tbody>
          </table>

          <table>
            <thead>
              <tr>
                <th colSpan="2">Attendance Summary</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Working Days</td>
                <td>{item.working_days}</td>
              </tr>
              <tr>
                <td>Present Days</td>
                <td>{item.present_days}</td>
              </tr>
              <tr>
                <td>Paid Leave</td>
                <td>{item.paid_leave}</td>
              </tr>
              <tr>
                <td>Unpaid Leave</td>
                <td>{item.unpaid_leave}</td>
              </tr>
              <tr>
                <td>Overtime</td>
                <td>{item.overtime_hours} hrs</td>
              </tr>
              <tr>
                <td>Salary Month</td>
                <td>{ymLabel(pid.slice(3))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ps-two">
          <table>
            <thead>
              <tr>
                <th>Earnings</th>
                <th style={{ textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Basic Salary', item.basic_salary],
                ['House Rent Allowance', item.hra],
                ['Conveyance Allowance', item.conveyance_allowance],
                ['Medical Allowance', item.medical_allowance],
                ['Special Allowance', item.special_allowance],
                ['Overtime', item.overtime_amount],
                ['Bonus', item.bonus],
                ['Incentive', item.incentive]
              ].map(([lbl, val]) => (
                <tr key={lbl}>
                  <td>{lbl}</td>
                  <td style={{ textAlign: 'right' }}>{num(val)}</td>
                </tr>
              ))}
              <tr>
                <th>Gross Earnings</th>
                <th style={{ textAlign: 'right' }}>{num(item.gross_salary)}</th>
              </tr>
            </tbody>
          </table>

          <table>
            <thead>
              <tr>
                <th>Deductions</th>
                <th style={{ textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Provident Fund (PF)', item.pf],
                ['ESI', item.esi],
                ['Professional Tax', item.professional_tax],
                ['TDS', item.tds],
                ['Advance Salary', item.advance_salary],
                ['Late Deduction', item.late_deduction],
                ['Other Deduction', item.other_deduction]
              ].map(([lbl, val]) => (
                <tr key={lbl}>
                  <td>{lbl}</td>
                  <td style={{ textAlign: 'right' }}>{num(val)}</td>
                </tr>
              ))}
              <tr>
                <td>&nbsp;</td>
                <td></td>
              </tr>
              <tr>
                <th>Total Deductions</th>
                <th style={{ textAlign: 'right' }}>{num(item.total_deduction)}</th>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ps-net">
          <div>
            <div style={{ fontSize: 12, color: '#56627c' }}>NET SALARY PAYABLE</div>
            <h3>{inr(item.net_salary)}</h3>
            <div style={{ fontSize: 12, color: '#56627c' }}>
              Rupees {numWords(item.net_salary)} Only
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className={`stamp ${item.payment_status}`}>
              {item.payment_status.toUpperCase()}
            </div>
            <div style={{ fontSize: 11.5, color: '#56627c', marginTop: 8 }}>
              Payment Status{item.paid_date ? ' • ' + fmtD(item.paid_date) : ''}
            </div>
          </div>
        </div>

        <div className="ps-sign">
          <div>Employee Signature</div>
          <div>Authorised Signatory (HR)</div>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#8a95ad', marginTop: 20 }}>
          This is a system-generated payslip.
        </p>
      </div>
    </>
  );
}
