import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useHR,
  emp,
  deptName,
  desigName,
  shiftOf,
  fmtD,
  inr,
  grossOf,
  computeSalary,
  attSummary,
  leaveBalance,
  parse,
  TODAY,
  CUR_YM,
  daysIn,
  pad,
  ATT_STATUS,
  BC,
  SHORT,
  slug,
  holidayOn,
  attRec,
  LEAVE_QUOTA,
  ymLabel,
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

const Badge = ({ t }) => <span className={`bdg ${BC[t] || 'gray'}`}>{t}</span>;

const KvGrid = ({ items }) => (
  <div className="kv">
    {items.map(([l, v], idx) => (
      <div key={idx}>
        <small>{l}</small>
        <span>{v || '—'}</span>
      </div>
    ))}
  </div>
);

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { db, saveDb, addToast, showModal, closeModal } = useHR();

  const currentEmpId = id || db.employees[0]?.employee_id;
  const e = emp(db, currentEmpId);

  const [activeTab, setActiveTab] = useState('personal');
  const [attMonth, setAttMonth] = useState(CUR_YM);

  if (!e) {
    return (
      <div className="card empty">
        <h3>Employee Not Found</h3>
        <p>No employee found matching ID: {currentEmpId}</p>
        <button className="btn" onClick={() => navigate('/employees')}>
          Back to Employee List
        </button>
      </div>
    );
  }

  const tenureYears = ((parse(TODAY) - parse(e.joining_date)) / 31557600000).toFixed(1);

  const renderAttendanceCalendar = () => {
    const [y, m] = attMonth.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1).getDay();
    const daysCount = daysIn(attMonth);
    const s = attSummary(db, e.employee_id, attMonth);

    const cells = [];
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((d) =>
      cells.push(
        <div key={`h-${d}`} className="ch">
          {d}
        </div>
      )
    );

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="cd out"></div>);
    }

    for (let d = 1; d <= daysCount; d++) {
      const ds = `${attMonth}-${pad(d)}`;
      const r = attRec(db, e.employee_id, ds);
      const hol = holidayOn(db, ds);
      let st = r
        ? r.attendance_status
        : parse(ds).getDay() === 0
        ? 'Weekly Off'
        : hol
        ? 'Holiday'
        : '';

      cells.push(
        <div key={`d-${d}`} className={`cd ${st ? 's-' + slug(st) : ''}`}>
          <b>{d}</b>
          {st && <span>{SHORT[st]}</span>}
          {r && r.check_in && (
            <small>
              {r.check_in}
              {r.check_out ? '–' + r.check_out : ''}
            </small>
          )}
          {hol && <small>{hol.holiday_name}</small>}
        </div>
      );
    }

    return (
      <div className="card">
        <h3>
          Attendance <span className="sp"></span>
          <input
            type="month"
            style={{ width: 170 }}
            value={attMonth}
            onChange={(evt) => setAttMonth(evt.target.value || CUR_YM)}
          />
        </h3>
        <div className="acts" style={{ marginBottom: 14 }}>
          <Badge t="Present" /> {s.present} &nbsp;
          <Badge t="Half Day" /> {s.half} &nbsp;
          <Badge t="Absent" /> {s.absent} &nbsp;
          <Badge t="Paid Leave" /> {s.paid_leave} &nbsp;
          <Badge t="Unpaid Leave" /> {s.unpaid_leave} &nbsp;
          <span className="bdg amber">Late {s.late_days}</span>{' '}
          <span className="bdg blue">OT {s.overtime_hours}h</span>
        </div>
        <div className="cal">{cells}</div>
        <div className="legend">
          {ATT_STATUS.map((st) => (
            <span key={st}>
              <span className={`bdg ${BC[st]}`}>{SHORT[st]}</span> {st}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const handleUploadDoc = () => {
    let docName = 'Aadhaar Card';
    let fileObj = null;

    showModal({
      title: 'Upload Document',
      size: 'sm',
      body: (
        <div className="fgrid">
          <div className="fg full">
            <label>Document Type</label>
            <select
              defaultValue={docName}
              onChange={(evt) => {
                docName = evt.target.value;
              }}
            >
              {[
                'Aadhaar Card',
                'PAN Card',
                'Offer Letter',
                'Appointment Letter',
                'Bank Passbook',
                'Experience Letter',
                'Education Certificate',
                'Other'
              ].map((dt) => (
                <option key={dt} value={dt}>
                  {dt}
                </option>
              ))}
            </select>
          </div>
          <div className="fg full">
            <label>File</label>
            <input
              type="file"
              onChange={(evt) => {
                fileObj = evt.target.files[0];
              }}
            />
          </div>
        </div>
      ),
      footer: (
        <>
          <button className="btn sec" onClick={closeModal}>
            Cancel
          </button>
          <button
            className="btn"
            onClick={() => {
              const nameText = docName + (fileObj ? ` (${fileObj.name})` : '');
              const updatedDocs = [
                ...(e.documents || []),
                { name: nameText, status: 'Uploaded', date: TODAY }
              ];
              const updatedEmployees = db.employees.map((x) =>
                x.employee_id === e.employee_id ? { ...x, documents: updatedDocs } : x
              );
              saveDb({ ...db, employees: updatedEmployees });
              addToast('Document added');
              closeModal();
            }}
          >
            Upload
          </button>
        </>
      )
    });
  };

  const handleDeleteDoc = (idx) => {
    const updatedDocs = (e.documents || []).filter((_, i) => i !== idx);
    const updatedEmployees = db.employees.map((x) =>
      x.employee_id === e.employee_id ? { ...x, documents: updatedDocs } : x
    );
    saveDb({ ...db, employees: updatedEmployees });
    addToast('Document removed');
  };

  const tabs = [
    ['personal', 'Personal Information'],
    ['employment', 'Employment Information'],
    ['attendance', 'Attendance'],
    ['leave', 'Leave'],
    ['salary', 'Salary'],
    ['payroll', 'Payroll'],
    ['documents', 'Documents']
  ];

  const balances = leaveBalance(db, e.employee_id);
  const employeeLeaves = db.leaves
    .filter((l) => l.employee_id === e.employee_id)
    .sort((a, b) => b.from_date.localeCompare(a.from_date));

  const salStruct = e.salary_structure || {};
  const estCalc = computeSalary(e, {
    working_days: 26,
    present_days: 26,
    paid_leave: 0,
    overtime_hours: 0,
    late_days: 0,
    bonus: salStruct.bonus || 0,
    incentive: salStruct.incentive || 0,
    other_deduction: salStruct.other_deduction || 0
  });

  const payrollHistoryItems = db.payroll_items
    .filter((i) => i.employee_id === e.employee_id)
    .sort((a, b) => b.payroll_id.localeCompare(a.payroll_id));

  return (
    <>
      <div className="ph">
        <div>
          <h2>Employee Profile</h2>
        </div>
        <div className="acts noprint">
          <select
            style={{ width: 260 }}
            value={e.employee_id}
            onChange={(evt) => navigate(`/employee-profile/${evt.target.value}`)}
          >
            {db.employees.map((x) => (
              <option key={x.employee_id} value={x.employee_id}>
                {x.employee_name} ({x.employee_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="pf-head">
          {e.photo ? (
            <img className="av" style={{ width: 76, height: 76 }} src={e.photo} alt="" />
          ) : (
            <div
              className="av"
              style={{
                width: 76,
                height: 76,
                fontSize: 26,
                background: `hsl(${[...e.employee_name].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 55%, 45%)`
              }}
            >
              {e.employee_name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}

          <div style={{ flex: 1 }}>
            <h2>{e.employee_name}</h2>
            <div className="muted">
              {desigName(db, e.designation_id)} • {deptName(db, e.department_id)}
            </div>
            <div style={{ marginTop: 6 }}>
              <Badge t={e.status} /> <span className="bdg gray">{e.employee_id}</span>
            </div>
          </div>

          <div className="kv" style={{ minWidth: 300 }}>
            <div>
              <small>Joined</small>
              <span>{fmtD(e.joining_date)}</span>
            </div>
            <div>
              <small>Gross Salary</small>
              <span>{inr(e.gross_salary)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(([tKey, tLabel]) => (
          <button
            key={tKey}
            className={`tab ${activeTab === tKey ? 'on' : ''}`}
            onClick={() => setActiveTab(tKey)}
          >
            {tLabel}
          </button>
        ))}
      </div>

      {activeTab === 'personal' && (
        <div className="card">
          <h3>Personal Information</h3>
          <KvGrid
            items={[
              ['Full Name', e.employee_name],
              ['Gender', e.gender],
              ['Date of Birth', fmtD(e.dob)],
              ['Phone', e.phone],
              ['Email', e.email],
              ['Emergency Contact', e.emergency_contact],
              ['Address', e.address]
            ]}
          />
        </div>
      )}

      {activeTab === 'employment' && (
        <div className="card">
          <h3>Employment Information</h3>
          <KvGrid
            items={[
              ['Employee ID', e.employee_id],
              ['Department', deptName(db, e.department_id)],
              ['Designation', desigName(db, e.designation_id)],
              ['Joining Date', fmtD(e.joining_date)],
              ['Tenure', `${tenureYears} years`],
              [
                'Shift',
                `${shiftOf(db, e.shift_id).shift_name} (${shiftOf(db, e.shift_id).start_time}–${shiftOf(db, e.shift_id).end_time})`
              ],
              ['Status', e.status],
              ['Bank Account', e.bank_account],
              ['IFSC', e.ifsc],
              ['PAN', e.pan],
              ['PF Number', e.pf_number],
              ['ESI Number', e.esi_number]
            ]}
          />
        </div>
      )}

      {activeTab === 'attendance' && renderAttendanceCalendar()}

      {activeTab === 'leave' && (
        <>
          <div className="grid g4">
            {Object.keys(balances).map((k) => (
              <div key={k} className="card">
                <div className="muted sm">{k}</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>
                  {balances[k].left}
                  <span className="muted" style={{ fontSize: 13 }}>
                    {' '}
                    / {balances[k].quota} left
                  </span>
                </div>
                <div className="prog" style={{ marginTop: 8 }}>
                  <div style={{ width: `${(balances[k].used / balances[k].quota) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3>Leave History</h3>
            <div className="tw">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeLeaves.length > 0 ? (
                    employeeLeaves.map((l) => (
                      <tr key={l.leave_id}>
                        <td>{l.leave_id}</td>
                        <td>{l.leave_type}</td>
                        <td>{fmtD(l.from_date)}</td>
                        <td>{fmtD(l.to_date)}</td>
                        <td>{l.leave_days}</td>
                        <td>{l.reason}</td>
                        <td>
                          <Badge t={l.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="empty">
                        No leave records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'salary' && (
        <div className="grid g2">
          <div className="card">
            <h3>
              Earnings (monthly) <span className="sp"></span>
              <button
                className="btn xs sec"
                onClick={() => navigate(`/salary-structure?emp=${e.employee_id}`)}
              >
                Edit structure
              </button>
            </h3>
            {[
              ['Basic Salary', salStruct.basic_salary],
              ['HRA', salStruct.hra],
              ['Conveyance Allowance', salStruct.conveyance_allowance],
              ['Medical Allowance', salStruct.medical_allowance],
              ['Special Allowance', salStruct.special_allowance],
              ['Bonus', salStruct.bonus],
              ['Incentive', salStruct.incentive]
            ].map(([lbl, val]) => (
              <div key={lbl} className="row">
                <span>{lbl}</span>
                <b>{inr(val || 0)}</b>
              </div>
            ))}
            <div className="row tot">
              <span>Gross Salary</span>
              <span>
                {inr(grossOf(salStruct) + (salStruct.bonus || 0) + (salStruct.incentive || 0))}
              </span>
            </div>
          </div>

          <div className="card">
            <h3>Deductions (est. full month)</h3>
            {[
              ['PF', estCalc.pf],
              ['ESI', estCalc.esi],
              ['Professional Tax', estCalc.professional_tax],
              ['TDS', estCalc.tds],
              ['Advance Salary', estCalc.advance_salary],
              ['Other Deduction', estCalc.other_deduction]
            ].map(([lbl, val]) => (
              <div key={lbl} className="row">
                <span>{lbl}</span>
                <b>{inr(val || 0)}</b>
              </div>
            ))}
            <div className="row tot">
              <span>Net Salary</span>
              <span className="pos">{inr(estCalc.net_salary)}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="card">
          <h3>Payroll History</h3>
          <div className="tw">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="num">Paid Days</th>
                  <th className="num">Gross</th>
                  <th className="num">Deduction</th>
                  <th className="num">Net</th>
                  <th>Payment</th>
                  <th>Payslip</th>
                </tr>
              </thead>
              <tbody>
                {payrollHistoryItems.length > 0 ? (
                  payrollHistoryItems.map((pi) => (
                    <tr key={pi.payroll_item_id}>
                      <td>{ymLabel(pi.payroll_id.slice(3))}</td>
                      <td className="num">
                        {pi.paid_days}/{pi.working_days}
                      </td>
                      <td className="num">{inr(pi.gross_salary)}</td>
                      <td className="num">{inr(pi.total_deduction)}</td>
                      <td className="num">
                        <b>{inr(pi.net_salary)}</b>
                      </td>
                      <td>
                        <Badge t={pi.payment_status} />
                      </td>
                      <td>
                        <button
                          className="btn xs sec"
                          onClick={() => navigate(`/payslip/${pi.payroll_id}/${pi.employee_id}`)}
                        >
                          <Icon name="file" size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty">
                      No payroll generated yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="card">
          <h3>
            Documents <span className="sp"></span>
            <button className="btn xs" onClick={handleUploadDoc}>
              <Icon name="upload" size={13} /> Upload
            </button>
          </h3>
          <div className="tw">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(e.documents || []).length > 0 ? (
                  e.documents.map((d, i) => (
                    <tr key={i}>
                      <td>
                        <Icon name="file" size={15} /> {d.name}
                      </td>
                      <td>{fmtD(d.date)}</td>
                      <td>
                        <Badge t={d.status} />
                      </td>
                      <td>
                        <button
                          className="btn xs no"
                          onClick={() => handleDeleteDoc(i)}
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty">
                      No documents
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
