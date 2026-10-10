import React, { useState } from 'react';
import {
  useHR,
  activeEmps,
  dashDate,
  fmtD,
  attRec,
  t12,
  shiftOf,
  recalcAtt,
  nextId,
  isWorking,
  TODAY,
  CUR_YM,
  daysIn,
  pad,
  ATT_STATUS,
  BC,
  SHORT,
  slug,
  holidayOn,
  attSummary,
  parse,
  emp,
  ymLabel,
  ICONS
} from '../store';

import DataTable from '../components/DataTable';
import { DonutChart } from '../components/Charts';

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

/* ---------- Daily Attendance ---------- */
export function AttendanceDaily() {
  const { db, saveDb, addToast, showModal, closeModal } = useHR();
  const [date, setDate] = useState(() => dashDate(db));
  const [dept, setDept] = useState('');
  const [empId, setEmpId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const activeList = activeEmps(db);
  const rows = activeList
    .filter((e) => (!dept || e.department_id === dept) && (!empId || e.employee_id === empId) && e.joining_date <= date)
    .map((e) => ({ e, date, rec: attRec(db, e.employee_id, date) }))
    .filter((r) => !statusFilter || (r.rec ? r.rec.attendance_status : 'Not Marked') === statusFilter);

  const handleEditModal = (rObj) => {
    const eObj = rObj.e;
    const r = rObj.rec || {
      attendance_status: 'Present',
      check_in: shiftOf(db, eObj.shift_id).start_time,
      check_out: shiftOf(db, eObj.shift_id).end_time
    };

    const AttForm = () => {
      const [attStatus, setAttStatus] = useState(r.attendance_status || 'Present');
      const [checkIn, setCheckIn] = useState(r.check_in || '');
      const [checkOut, setCheckOut] = useState(r.check_out || '');

      const handleSubmit = (evt) => {
        evt.preventDefault();
        let existingRec = attRec(db, eObj.employee_id, date);
        const nextAtt = [...db.attendance];

        if (!existingRec) {
          existingRec = {
            attendance_id: nextId(db, 'ATT', 'attendance', 'attendance_id', 5),
            employee_id: eObj.employee_id,
            attendance_date: date,
            check_in: '',
            check_out: '',
            working_hours: 0,
            attendance_status: 'Present',
            late_minutes: 0,
            early_leaving_minutes: 0,
            overtime_hours: 0
          };
          nextAtt.push(existingRec);
        }

        existingRec.attendance_status = attStatus;
        existingRec.check_in = checkIn;
        existingRec.check_out = checkOut;
        recalcAtt(db, existingRec);

        saveDb({ ...db, attendance: nextAtt });
        addToast('Attendance updated ✔');
        closeModal();
      };

      return (
        <form id="attForm" className="fgrid" onSubmit={handleSubmit}>
          <div className="fg full">
            <label>Attendance Status</label>
            <select value={attStatus} onChange={(e) => setAttStatus(e.target.value)}>
              {ATT_STATUS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label>Check In</label>
            <input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </div>
          <div className="fg">
            <label>Check Out</label>
            <input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </div>
        </form>
      );
    };

    showModal({
      title: `Attendance — ${eObj.employee_name} (${fmtD(date)})`,
      size: 'sm',
      body: <AttForm />,
      footer: (
        <>
          <button className="btn sec" onClick={closeModal}>
            Cancel
          </button>
          <button className="btn" onClick={() => document.getElementById('attForm')?.requestSubmit()}>
            Save
          </button>
        </>
      )
    });
  };

  const handleMarkAllPresent = () => {
    if (!isWorking(db, date)) {
      addToast('Selected date is a holiday / weekly off', 'err');
      return;
    }
    let count = 0;
    const nextAtt = [...db.attendance];

    activeList
      .filter((e) => e.joining_date <= date && !attRec(db, e.employee_id, date))
      .forEach((e) => {
        const sh = shiftOf(db, e.shift_id);
        const rec = {
          attendance_id: nextId(db, 'ATT', 'attendance', 'attendance_id', 5),
          employee_id: e.employee_id,
          attendance_date: date,
          check_in: sh.start_time,
          check_out: date === TODAY ? '' : sh.end_time,
          working_hours: 0,
          attendance_status: 'Present',
          late_minutes: 0,
          early_leaving_minutes: 0,
          overtime_hours: 0
        };
        recalcAtt(db, rec);
        nextAtt.push(rec);
        count++;
      });

    saveDb({ ...db, attendance: nextAtt });
    addToast(count ? `${count} employee(s) marked present` : 'No unmarked employees', count ? 'ok' : 'info');
  };

  const cols = [
    {
      h: 'Employee',
      f: (r) => (
        <div className="ecell">
          <div
            className="av"
            style={{
              width: 36,
              height: 36,
              fontSize: 12,
              background: `hsl(${[...r.e.employee_name].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 55%, 45%)`
            }}
          >
            {r.e.employee_name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <b>{r.e.employee_name}</b>
            <small>{r.e.employee_id}</small>
          </div>
        </div>
      )
    },
    { h: 'Date', f: (r) => fmtD(r.date) },
    { h: 'Check In', f: (r) => (r.rec ? t12(r.rec.check_in) : '—') },
    {
      h: 'Check Out',
      f: (r) =>
        r.rec
          ? r.rec.check_out
            ? t12(r.rec.check_out)
            : r.rec.check_in && r.date === TODAY
            ? 'Working…'
            : '—'
          : '—'
    },
    { h: 'Working Hrs', f: (r) => (r.rec && r.rec.working_hours ? r.rec.working_hours + ' h' : '—') },
    { h: 'Status', f: (r) => <Badge t={r.rec ? r.rec.attendance_status : 'Not Marked'} /> },
    { h: 'Late', f: (r) => (r.rec && r.rec.late_minutes ? <span className="neg">{r.rec.late_minutes} min</span> : '—') },
    { h: 'Early Leaving', f: (r) => (r.rec && r.rec.early_leaving_minutes ? <span className="neg">{r.rec.early_leaving_minutes} min</span> : '—') },
    { h: 'Overtime', f: (r) => (r.rec && r.rec.overtime_hours ? <span className="pos">{r.rec.overtime_hours} h</span> : '—') },
    {
      h: '',
      f: (r) => (
        <button className="btn xs sec" onClick={() => handleEditModal(r)}>
          <Icon name="edit" size={13} /> Edit
        </button>
      )
    }
  ];

  return (
    <>
      <div className="ph">
        <div>
          <h2>Daily Attendance</h2>
          <p>Check-in / check-out register</p>
        </div>
        <div className="acts noprint">
          <button className="btn" onClick={handleMarkAllPresent}>
            <Icon name="check" size={16} /> Mark Unmarked as Present
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <div className="f">
            <label>Date</label>
            <input type="date" value={date} max={TODAY} onChange={(e) => setDate(e.target.value)} />
          </div>
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
              {activeList.map((e) => (
                <option key={e.employee_id} value={e.employee_id}>
                  {e.employee_name} ({e.employee_id})
                </option>
              ))}
            </select>
          </div>
          <div className="f">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {[...ATT_STATUS, 'Not Marked'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable rows={rows} cols={cols} minw={980} size={10} />
      </div>
    </>
  );
}

/* ---------- Monthly Attendance ---------- */
export function AttendanceMonthly() {
  const { db } = useHR();
  const [ym, setYm] = useState(CUR_YM);
  const [dept, setDept] = useState('');
  const [selectedEmp, setSelectedEmp] = useState('');

  const activeList = activeEmps(db).filter(
    (e) => (!dept || e.department_id === dept) && (!selectedEmp || e.employee_id === selectedEmp)
  );

  const numDays = daysIn(ym);

  const renderSingleEmpCalendar = () => {
    const targetEmp = emp(db, selectedEmp);
    if (!targetEmp) return null;
    const s = attSummary(db, targetEmp.employee_id, ym);

    const [y, m] = ym.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1).getDay();

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

    for (let d = 1; d <= numDays; d++) {
      const ds = `${ym}-${pad(d)}`;
      const r = attRec(db, targetEmp.employee_id, ds);
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
          {targetEmp.employee_name} — {ymLabel(ym)}
        </h3>
        <div className="acts" style={{ marginBottom: 14 }}>
          <span className="bdg green">Present {s.present}</span>
          <span className="bdg amber">Half Day {s.half}</span>
          <span className="bdg red">Absent {s.absent}</span>
          <span className="bdg blue">Paid Leave {s.paid_leave}</span>
          <span className="bdg purple">Unpaid {s.unpaid_leave}</span>
          <span className="bdg amber">Late {s.late_days}</span>
          <span className="bdg teal">OT {s.overtime_hours}h</span>
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

  const renderGrid = () => {
    const dayHeaders = Array.from({ length: numDays }, (_, i) => i + 1);

    return (
      <div className="card">
        <h3>Monthly Attendance Grid — {ymLabel(ym)}</h3>
        <div className="tw">
          <table className="mg">
            <thead>
              <tr>
                <th className="nm" style={{ textAlign: 'left', paddingLeft: 10 }}>
                  Employee
                </th>
                {dayHeaders.map((dh) => (
                  <th key={dh}>{dh}</th>
                ))}
                <th>P</th>
                <th>A</th>
                <th>L</th>
              </tr>
            </thead>
            <tbody>
              {activeList.map((eObj) => {
                let p = 0,
                  a = 0,
                  l = 0;
                const dayCells = [];

                for (let d = 1; d <= numDays; d++) {
                  const ds = `${ym}-${pad(d)}`;
                  const r = attRec(db, eObj.employee_id, ds);
                  const hol = holidayOn(db, ds);
                  let st = r
                    ? r.attendance_status
                    : ds <= TODAY && ds >= eObj.joining_date
                    ? parse(ds).getDay() === 0
                      ? 'Weekly Off'
                      : hol
                      ? 'Holiday'
                      : ''
                    : '';

                  if (st === 'Present') p++;
                  else if (st === 'Half Day') p += 0.5;
                  else if (st === 'Absent') a++;
                  else if (st.includes('Leave')) l++;

                  dayCells.push(
                    <td
                      key={d}
                      className={st ? 's-' + slug(st) : ''}
                      title={`${ds}: ${st || '—'}`}
                    >
                      {st ? SHORT[st] : ''}
                    </td>
                  );
                }

                return (
                  <tr key={eObj.employee_id}>
                    <td className="nm">{eObj.employee_name}</td>
                    {dayCells}
                    <td className="t">{p}</td>
                    <td className="t">{a}</td>
                    <td className="t">{l}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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

  return (
    <>
      <div className="ph">
        <div>
          <h2>Monthly Attendance</h2>
          <p>Month-wise attendance register &amp; calendar</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filters">
          <div className="f">
            <label>Month</label>
            <input type="month" value={ym} onChange={(e) => setYm(e.target.value || CUR_YM)} />
          </div>
          <div className="f">
            <label>Department</label>
            <select
              value={dept}
              onChange={(e) => {
                setDept(e.target.value);
                setSelectedEmp('');
              }}
            >
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
            <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)}>
              <option value="">All (Grid view)</option>
              {activeEmps(db)
                .filter((e) => !dept || e.department_id === dept)
                .map((e) => (
                  <option key={e.employee_id} value={e.employee_id}>
                    {e.employee_name}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="muted sm">Select a single employee to see the calendar view.</div>
      </div>

      {selectedEmp ? renderSingleEmpCalendar() : renderGrid()}
    </>
  );
}

/* ---------- Attendance Summary ---------- */
export function AttendanceSummary() {
  const { db } = useHR();
  const [ym, setYm] = useState(CUR_YM);
  const [dept, setDept] = useState('');

  const list = activeEmps(db).filter((e) => !dept || e.department_id === dept);
  const rows = list.map((e) => ({ e, s: attSummary(db, e.employee_id, ym) }));

  const T = rows.reduce(
    (a, r) => {
      a.p += r.s.present;
      a.h += r.s.half;
      a.a += r.s.absent;
      a.l += r.s.paid_leave + r.s.unpaid_leave;
      return a;
    },
    { p: 0, h: 0, a: 0, l: 0 }
  );

  const cols = [
    {
      h: 'Employee',
      f: (r) => (
        <div className="ecell">
          <div
            className="av"
            style={{
              width: 36,
              height: 36,
              fontSize: 12,
              background: `hsl(${[...r.e.employee_name].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 55%, 45%)`
            }}
          >
            {r.e.employee_name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <b>{r.e.employee_name}</b>
            <small>{r.e.employee_id}</small>
          </div>
        </div>
      )
    },
    { h: 'Present', cls: 'ctr', f: (r) => r.s.present },
    { h: 'Half Day', cls: 'ctr', f: (r) => r.s.half },
    { h: 'Absent', cls: 'ctr', f: (r) => r.s.absent },
    { h: 'Paid Leave', cls: 'ctr', f: (r) => r.s.paid_leave },
    { h: 'Unpaid Leave', cls: 'ctr', f: (r) => r.s.unpaid_leave },
    { h: 'Late', cls: 'ctr', f: (r) => r.s.late_days },
    { h: 'OT Hrs', cls: 'ctr', f: (r) => r.s.overtime_hours },
    {
      h: 'Attendance %',
      f: (r) => {
        const wd = Math.max(1, r.s.present + r.s.half + r.s.absent + r.s.paid_leave + r.s.unpaid_leave);
        const pc = Math.round(((r.s.present + r.s.half * 0.5 + r.s.paid_leave) / wd) * 100);
        return (
          <div style={{ minWidth: 110 }}>
            <b>{pc}%</b>
            <div className="prog">
              <div
                style={{
                  width: `${pc}%`,
                  background: pc >= 90 ? 'var(--green)' : pc >= 75 ? 'var(--amber)' : 'var(--red)'
                }}
              ></div>
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <>
      <div className="ph">
        <div>
          <h2>Attendance Summary</h2>
          <p>Employee-wise attendance statistics</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filters">
          <div className="f">
            <label>Month</label>
            <input type="month" value={ym} onChange={(e) => setYm(e.target.value || CUR_YM)} />
          </div>
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
        </div>
      </div>

      <div className="grid g12">
        <div className="card">
          <h3>Status Distribution</h3>
          <DonutChart
            center={T.p + T.h + T.l + T.a}
            items={[
              { label: 'Present', value: T.p, color: '#16a34a' },
              { label: 'Half Day', value: T.h, color: '#f59e0b' },
              { label: 'Leave', value: T.l, color: '#2563eb' },
              { label: 'Absent', value: T.a, color: '#dc2626' }
            ]}
          />
        </div>

        <div className="card">
          <h3>Employee Summary — {ymLabel(ym)}</h3>
          <DataTable rows={rows} cols={cols} minw={900} size={8} />
        </div>
      </div>
    </>
  );
}

/* ---------- Attendance Late / Early / Overtime ---------- */
export function AttendanceLate() {
  const { db } = useHR();
  const [ym, setYm] = useState(CUR_YM);
  const [dept, setDept] = useState('');
  const [type, setType] = useState('');

  const rows = db.attendance
    .filter((a) => a.attendance_date.startsWith(ym))
    .filter((a) => {
      const eObj = emp(db, a.employee_id);
      return (
        eObj &&
        (!dept || eObj.department_id === dept) &&
        (type === 'late'
          ? a.late_minutes > 0
          : type === 'early'
          ? a.early_leaving_minutes > 0
          : type === 'ot'
          ? a.overtime_hours > 0
          : a.late_minutes > 0 || a.early_leaving_minutes > 0 || a.overtime_hours > 0)
      );
    })
    .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));

  const allInMonth = db.attendance.filter((a) => a.attendance_date.startsWith(ym));
  const sum = (k) => allInMonth.reduce((x, a) => x + (a[k] || 0), 0);

  const cols = [
    {
      h: 'Employee',
      f: (a) => {
        const eObj = emp(db, a.employee_id);
        if (!eObj) return a.employee_id;
        return (
          <div className="ecell">
            <div
              className="av"
              style={{
                width: 36,
                height: 36,
                fontSize: 12,
                background: `hsl(${[...eObj.employee_name].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 55%, 45%)`
              }}
            >
              {eObj.employee_name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <b>{eObj.employee_name}</b>
              <small>{eObj.employee_id}</small>
            </div>
          </div>
        );
      }
    },
    { h: 'Date', f: (a) => fmtD(a.attendance_date) },
    { h: 'Shift', f: (a) => shiftOf(db, emp(db, a.employee_id)?.shift_id).shift_name },
    { h: 'Check In', f: (a) => t12(a.check_in) },
    { h: 'Check Out', f: (a) => t12(a.check_out) },
    { h: 'Late', f: (a) => (a.late_minutes ? <span className="neg">{a.late_minutes} min</span> : '—') },
    {
      h: 'Early Leaving',
      f: (a) => (a.early_leaving_minutes ? <span className="neg">{a.early_leaving_minutes} min</span> : '—')
    },
    { h: 'Overtime', f: (a) => (a.overtime_hours ? <span className="pos">{a.overtime_hours} h</span> : '—') }
  ];

  return (
    <>
      <div className="ph">
        <div>
          <h2>Late / Early / Overtime</h2>
          <p>Track punctuality and extra hours</p>
        </div>
      </div>

      <div className="grid g4">
        <div className="card stat">
          <div className="ico amber">
            <Icon name="clock" size={22} />
          </div>
          <div>
            <div className="v">{allInMonth.filter((a) => a.late_minutes > 0).length}</div>
            <div className="l">Late Marks</div>
            <div className="s">{sum('late_minutes')} min total</div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico red">
            <Icon name="x" size={22} />
          </div>
          <div>
            <div className="v">{allInMonth.filter((a) => a.early_leaving_minutes > 0).length}</div>
            <div className="l">Early Leaving</div>
            <div className="s">{sum('early_leaving_minutes')} min total</div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico blue">
            <Icon name="zap" size={22} />
          </div>
          <div>
            <div className="v">{allInMonth.filter((a) => a.overtime_hours > 0).length}</div>
            <div className="l">Overtime Entries</div>
            <div className="s"></div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico green">
            <Icon name="card" size={22} />
          </div>
          <div>
            <div className="v">{sum('overtime_hours')} h</div>
            <div className="l">Overtime Hours</div>
            <div className="s">Payable at 1.5× rate</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <div className="f">
            <label>Month</label>
            <input type="month" value={ym} onChange={(e) => setYm(e.target.value || CUR_YM)} />
          </div>
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
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All</option>
              <option value="late">Late</option>
              <option value="early">Early Leaving</option>
              <option value="ot">Overtime</option>
            </select>
          </div>
        </div>

        <DataTable rows={rows} cols={cols} minw={800} size={10} />
      </div>
    </>
  );
}
