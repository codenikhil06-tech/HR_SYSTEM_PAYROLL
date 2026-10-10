import React, { useState } from 'react';
import {
  useHR,
  emp,
  activeEmps,
  deptName,
  fmtD,
  leaveBalance,
  countLeaveDays,
  nextId,
  parse,
  addD,
  ymd,
  isWorking,
  recalcAtt,
  TODAY,
  LEAVE_TYPES,
  LEAVE_QUOTA,
  BC,
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

const Badge = ({ t }) => <span className={`bdg ${BC[t] || 'gray'}`}>{t}</span>;

/* ---------- Leave Requests ---------- */
export function LeaveRequests() {
  const { db, saveDb, addToast, showModal, closeModal, logActivity } = useHR();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const rows = db.leaves
    .filter((l) => {
      const eObj = emp(db, l.employee_id);
      const q = search.toLowerCase();
      const matchStatus = !statusFilter || l.status === statusFilter;
      const matchType = !typeFilter || l.leave_type === typeFilter;
      const matchSearch =
        !q || ((eObj ? eObj.employee_name : '') + l.leave_id + l.reason).toLowerCase().includes(q);
      return matchStatus && matchType && matchSearch;
    })
    .sort((a, b) => b.leave_id.localeCompare(a.leave_id));

  const handleAction = (id, st) => {
    const lObj = db.leaves.find((x) => x.leave_id === id);
    if (!lObj) return;
    const eObj = emp(db, lObj.employee_id);

    if (st === 'Rejected') {
      const RejectForm = () => {
        const [reason, setReason] = useState('');
        const handleRejectSubmit = (evt) => {
          evt.preventDefault();
          const updatedLeaves = db.leaves.map((x) =>
            x.leave_id === id ? { ...x, status: 'Rejected', remarks: reason, approved_on: TODAY } : x
          );
          saveDb({ ...db, leaves: updatedLeaves });
          logActivity(`Leave rejected for ${eObj?.employee_name}`, 'leave');
          addToast('Leave rejected');
          closeModal();
        };

        return (
          <form id="rejForm" className="fgrid" onSubmit={handleRejectSubmit}>
            <div className="fg full">
              <label>
                Reason for rejection <i>*</i>
              </label>
              <textarea required value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </form>
        );
      };

      showModal({
        title: `Reject Leave — ${lObj.leave_id}`,
        size: 'sm',
        body: <RejectForm />,
        footer: (
          <>
            <button className="btn sec" onClick={closeModal}>
              Cancel
            </button>
            <button className="btn no" onClick={() => document.getElementById('rejForm')?.requestSubmit()}>
              Reject
            </button>
          </>
        )
      });
      return;
    }

    /* Approved */
    const updatedLeaves = db.leaves.map((x) =>
      x.leave_id === id ? { ...x, status: 'Approved', approved_on: TODAY } : x
    );

    const nextAttendance = [...db.attendance];
    for (let d = parse(lObj.from_date); ymd(d) <= lObj.to_date; d = addD(d, 1)) {
      const ds = ymd(d);
      if (ds > TODAY || !isWorking(db, ds) || (eObj && ds < eObj.joining_date)) continue;

      let rRec = nextAttendance.find((a) => a.employee_id === lObj.employee_id && a.attendance_date === ds);
      if (!rRec) {
        rRec = {
          attendance_id: nextId(db, 'ATT', 'attendance', 'attendance_id', 5),
          employee_id: lObj.employee_id,
          attendance_date: ds,
          check_in: '',
          check_out: '',
          working_hours: 0,
          attendance_status: 'Present',
          late_minutes: 0,
          early_leaving_minutes: 0,
          overtime_hours: 0
        };
        nextAttendance.push(rRec);
      }
      rRec.attendance_status = lObj.leave_type === 'Unpaid Leave' ? 'Unpaid Leave' : 'Paid Leave';
      recalcAtt(db, rRec);
    }

    saveDb({ ...db, leaves: updatedLeaves, attendance: nextAttendance });
    logActivity(`Leave approved for ${eObj?.employee_name} (${lObj.leave_type})`, 'leave');
    addToast('Leave approved ✔ — attendance updated');
  };

  const handleOpenViewModal = (lObj) => {
    const eObj = emp(db, lObj.employee_id);
    const b = eObj && leaveBalance(db, eObj.employee_id)[lObj.leave_type];

    showModal({
      title: `Leave Details — ${lObj.leave_id}`,
      size: 'sm',
      body: (
        <div>
          <div className="ecell" style={{ marginBottom: 14 }}>
            <div
              className="av"
              style={{
                width: 44,
                height: 44,
                fontSize: 14,
                background: `hsl(${[...(eObj?.employee_name || '?')].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 55%, 45%)`
              }}
            >
              {(eObj?.employee_name || '?').split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <b>{eObj ? eObj.employee_name : lObj.employee_id}</b>
              <small>{eObj ? deptName(db, eObj.department_id) : ''}</small>
            </div>
            <span style={{ marginLeft: 'auto' }}>
              <Badge t={lObj.status} />
            </span>
          </div>

          <div className="kv">
            <div>
              <small>Leave Type</small>
              <span>{lObj.leave_type}</span>
            </div>
            <div>
              <small>Number of Days</small>
              <span>{lObj.leave_days}</span>
            </div>
            <div>
              <small>From</small>
              <span>{fmtD(lObj.from_date)}</span>
            </div>
            <div>
              <small>To</small>
              <span>{fmtD(lObj.to_date)}</span>
            </div>
            <div>
              <small>Applied On</small>
              <span>{fmtD(lObj.applied_on)}</span>
            </div>
            <div>
              <small>Decision On</small>
              <span>{fmtD(lObj.approved_on)}</span>
            </div>
            <div>
              <small>Balance (this year)</small>
              <span>{b ? `${b.left} of ${b.quota} left` : 'N/A'}</span>
            </div>
            <div>
              <small>Reason</small>
              <span>{lObj.reason}</span>
            </div>
            {lObj.remarks && (
              <div>
                <small>Remarks</small>
                <span>{lObj.remarks}</span>
              </div>
            )}
          </div>
        </div>
      ),
      footer: (
        <>
          {lObj.status === 'Pending' ? (
            <>
              <button
                className="btn ok"
                onClick={() => {
                  closeModal();
                  handleAction(lObj.leave_id, 'Approved');
                }}
              >
                Approve
              </button>
              <button
                className="btn no"
                onClick={() => {
                  closeModal();
                  handleAction(lObj.leave_id, 'Rejected');
                }}
              >
                Reject
              </button>
            </>
          ) : (
            <button className="btn sec" onClick={closeModal}>
              Close
            </button>
          )}
        </>
      )
    });
  };

  const handleOpenNewModal = () => {
    const activeList = activeEmps(db);

    const NewLeaveForm = () => {
      const [empIdVal, setEmpIdVal] = useState(activeList[0]?.employee_id || '');
      const [typeVal, setTypeVal] = useState('Casual Leave');
      const [fromDateVal, setFromDateVal] = useState(TODAY);
      const [toDateVal, setToDateVal] = useState(TODAY);
      const [reasonVal, setReasonVal] = useState('');

      const daysCount =
        fromDateVal && toDateVal && toDateVal >= fromDateVal
          ? countLeaveDays(db, fromDateVal, toDateVal)
          : 0;

      const bal = empIdVal ? leaveBalance(db, empIdVal)[typeVal] : null;

      const handleSubmit = (evt) => {
        evt.preventDefault();
        if (toDateVal < fromDateVal) {
          addToast('To date cannot be before From date', 'err');
          return;
        }
        if (!daysCount) {
          addToast('Selected range has no working days', 'err');
          return;
        }
        if (bal && daysCount > bal.left) {
          addToast(`Exceeds balance (${bal.left} left) — request submitted`, 'info');
        }

        const newLeave = {
          leave_id: nextId(db, 'LV', 'leaves', 'leave_id', 4),
          employee_id: empIdVal,
          leave_type: typeVal,
          from_date: fromDateVal,
          to_date: toDateVal,
          leave_days: daysCount,
          reason: reasonVal,
          status: 'Pending',
          applied_on: TODAY,
          approved_on: '',
          remarks: ''
        };

        saveDb({ ...db, leaves: [...db.leaves, newLeave] });
        logActivity(`Leave requested by ${emp(db, empIdVal)?.employee_name}`, 'leave');
        addToast('Leave request submitted ✔');
        closeModal();
      };

      return (
        <form id="newLeaveForm" className="fgrid" onSubmit={handleSubmit}>
          <div className="fg full">
            <label>
              Employee <i>*</i>
            </label>
            <select
              required
              value={empIdVal}
              onChange={(e) => setEmpIdVal(e.target.value)}
            >
              {activeList.map((eObj) => (
                <option key={eObj.employee_id} value={eObj.employee_id}>
                  {eObj.employee_name} ({eObj.employee_id})
                </option>
              ))}
            </select>
          </div>

          <div className="fg">
            <label>Leave Type</label>
            <select value={typeVal} onChange={(e) => setTypeVal(e.target.value)}>
              {LEAVE_TYPES.map((lt) => (
                <option key={lt} value={lt}>
                  {lt}
                </option>
              ))}
            </select>
            <small>
              {bal
                ? `Balance: ${bal.left} of ${bal.quota} days left`
                : typeVal === 'Unpaid Leave'
                ? 'Unpaid leave — no balance limit'
                : ''}
            </small>
          </div>

          <div className="fg">
            <label>Number of Days</label>
            <input readOnly value={daysCount} />
          </div>

          <div className="fg">
            <label>
              From Date <i>*</i>
            </label>
            <input
              required
              type="date"
              value={fromDateVal}
              onChange={(e) => setFromDateVal(e.target.value)}
            />
          </div>

          <div className="fg">
            <label>
              To Date <i>*</i>
            </label>
            <input
              required
              type="date"
              value={toDateVal}
              onChange={(e) => setToDateVal(e.target.value)}
            />
          </div>

          <div className="fg full">
            <label>
              Reason <i>*</i>
            </label>
            <textarea
              required
              value={reasonVal}
              onChange={(e) => setReasonVal(e.target.value)}
            />
          </div>
        </form>
      );
    };

    showModal({
      title: 'New Leave Request',
      size: 'sm',
      body: <NewLeaveForm />,
      footer: (
        <>
          <button className="btn sec" onClick={closeModal}>
            Cancel
          </button>
          <button className="btn" onClick={() => document.getElementById('newLeaveForm')?.requestSubmit()}>
            Submit Request
          </button>
        </>
      )
    });
  };

  const cols = [
    { h: 'Leave ID', f: (l) => l.leave_id },
    {
      h: 'Employee',
      f: (l) => {
        const eObj = emp(db, l.employee_id);
        if (!eObj) return l.employee_id;
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
    { h: 'Leave Type', f: (l) => l.leave_type },
    { h: 'From', f: (l) => fmtD(l.from_date) },
    { h: 'To', f: (l) => fmtD(l.to_date) },
    { h: 'Days', cls: 'ctr', f: (l) => l.leave_days },
    {
      h: 'Reason',
      f: (l) => (
        <span title={l.reason}>
          {l.reason.slice(0, 28)}
          {l.reason.length > 28 ? '…' : ''}
        </span>
      )
    },
    { h: 'Status', f: (l) => <Badge t={l.status} /> },
    {
      h: 'Actions',
      f: (l) => (
        <div className="acts">
          <button className="btn xs sec" onClick={() => handleOpenViewModal(l)}>
            <Icon name="eye" size={13} />
          </button>
          {l.status === 'Pending' && (
            <>
              <button className="btn xs ok" onClick={() => handleAction(l.leave_id, 'Approved')}>
                <Icon name="check" size={13} /> Approve
              </button>
              <button className="btn xs no" onClick={() => handleAction(l.leave_id, 'Rejected')}>
                <Icon name="x" size={13} /> Reject
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <div className="ph">
        <div>
          <h2>Leave Requests</h2>
          <p>All employee leave applications</p>
        </div>
        <div className="acts noprint">
          <button className="btn" onClick={handleOpenNewModal}>
            <Icon name="plus" size={16} /> New Leave Request
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <div className="f grow">
            <label>Search</label>
            <input
              placeholder="Employee, ID, reason…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="f">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              {['Pending', 'Approved', 'Rejected'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="f">
            <label>Leave Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All</option>
              {LEAVE_TYPES.map((lt) => (
                <option key={lt} value={lt}>
                  {lt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable rows={rows} cols={cols} minw={1000} size={8} />
      </div>
    </>
  );
}

/* ---------- Leave Approval ---------- */
export function LeaveApproval() {
  const { db, saveDb, addToast, showModal, closeModal, logActivity } = useHR();

  const pending = db.leaves.filter((l) => l.status === 'Pending');
  const decided = db.leaves
    .filter((l) => l.status !== 'Pending')
    .sort((a, b) => (b.approved_on || '').localeCompare(a.approved_on || ''))
    .slice(0, 6);

  const handleAction = (id, st) => {
    const lObj = db.leaves.find((x) => x.leave_id === id);
    if (!lObj) return;
    const eObj = emp(db, lObj.employee_id);

    if (st === 'Rejected') {
      const RejectForm = () => {
        const [reason, setReason] = useState('');
        const handleRejectSubmit = (evt) => {
          evt.preventDefault();
          const updatedLeaves = db.leaves.map((x) =>
            x.leave_id === id ? { ...x, status: 'Rejected', remarks: reason, approved_on: TODAY } : x
          );
          saveDb({ ...db, leaves: updatedLeaves });
          logActivity(`Leave rejected for ${eObj?.employee_name}`, 'leave');
          addToast('Leave rejected');
          closeModal();
        };

        return (
          <form id="rejForm" className="fgrid" onSubmit={handleRejectSubmit}>
            <div className="fg full">
              <label>
                Reason for rejection <i>*</i>
              </label>
              <textarea required value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </form>
        );
      };

      showModal({
        title: `Reject Leave — ${lObj.leave_id}`,
        size: 'sm',
        body: <RejectForm />,
        footer: (
          <>
            <button className="btn sec" onClick={closeModal}>
              Cancel
            </button>
            <button className="btn no" onClick={() => document.getElementById('rejForm')?.requestSubmit()}>
              Reject
            </button>
          </>
        )
      });
      return;
    }

    const updatedLeaves = db.leaves.map((x) =>
      x.leave_id === id ? { ...x, status: 'Approved', approved_on: TODAY } : x
    );

    const nextAttendance = [...db.attendance];
    for (let d = parse(lObj.from_date); ymd(d) <= lObj.to_date; d = addD(d, 1)) {
      const ds = ymd(d);
      if (ds > TODAY || !isWorking(db, ds) || (eObj && ds < eObj.joining_date)) continue;

      let rRec = nextAttendance.find((a) => a.employee_id === lObj.employee_id && a.attendance_date === ds);
      if (!rRec) {
        rRec = {
          attendance_id: nextId(db, 'ATT', 'attendance', 'attendance_id', 5),
          employee_id: lObj.employee_id,
          attendance_date: ds,
          check_in: '',
          check_out: '',
          working_hours: 0,
          attendance_status: 'Present',
          late_minutes: 0,
          early_leaving_minutes: 0,
          overtime_hours: 0
        };
        nextAttendance.push(rRec);
      }
      rRec.attendance_status = lObj.leave_type === 'Unpaid Leave' ? 'Unpaid Leave' : 'Paid Leave';
      recalcAtt(db, rRec);
    }

    saveDb({ ...db, leaves: updatedLeaves, attendance: nextAttendance });
    logActivity(`Leave approved for ${eObj?.employee_name} (${lObj.leave_type})`, 'leave');
    addToast('Leave approved ✔ — attendance updated');
  };

  return (
    <>
      <div className="ph">
        <div>
          <h2>Leave Approval</h2>
          <p>Review pending requests</p>
        </div>
        <div className="acts noprint">
          <span className="bdg amber" style={{ fontSize: 13 }}>
            {pending.length} pending
          </span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Pending Requests</h3>
        {pending.length > 0 ? (
          pending.map((l) => {
            const eObj = emp(db, l.employee_id);
            const b = eObj && leaveBalance(db, l.employee_id)[l.leave_type];
            return (
              <div key={l.leave_id} className="apc">
                <div
                  className="av"
                  style={{
                    width: 44,
                    height: 44,
                    fontSize: 14,
                    background: `hsl(${[...(eObj?.employee_name || '?')].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 55%, 45%)`
                  }}
                >
                  {(eObj?.employee_name || '?').split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()}
                </div>

                <div className="inf">
                  <b>{eObj ? eObj.employee_name : l.employee_id}</b>{' '}
                  <span className="muted">• {deptName(db, eObj?.department_id)}</span>
                  <div>
                    {l.leave_type} — <b>{l.leave_days} day(s)</b> ({fmtD(l.from_date)} → {fmtD(l.to_date)})
                  </div>
                  <div className="muted sm">
                    "{l.reason}"{b ? ` • Balance: ${b.left}/${b.quota}` : ''}
                  </div>
                </div>

                <div className="acts">
                  <button className="btn xs ok" onClick={() => handleAction(l.leave_id, 'Approved')}>
                    <Icon name="check" size={13} /> Approve
                  </button>
                  <button className="btn xs no" onClick={() => handleAction(l.leave_id, 'Rejected')}>
                    <Icon name="x" size={13} /> Reject
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty muted" style={{ padding: 30, textAlign: 'center' }}>
            🎉 No pending leave requests
          </div>
        )}
      </div>

      <div className="card">
        <h3>Recently Decided</h3>
        <div className="tw">
          <table className="tbl" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {decided.map((l) => (
                <tr key={l.leave_id}>
                  <td>{(emp(db, l.employee_id) || {}).employee_name || l.employee_id}</td>
                  <td>{l.leave_type}</td>
                  <td>
                    {fmtD(l.from_date)} → {fmtD(l.to_date)}
                  </td>
                  <td>{l.leave_days}</td>
                  <td>
                    <Badge t={l.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ---------- Leave Balance ---------- */
export function LeaveBalance() {
  const { db } = useHR();
  const activeList = activeEmps(db);
  const curYear = TODAY.slice(0, 4);

  const cols = [
    {
      h: 'Employee',
      f: (e) => (
        <div className="ecell">
          <div
            className="av"
            style={{
              width: 36,
              height: 36,
              fontSize: 12,
              background: `hsl(${[...e.employee_name].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 55%, 45%)`
            }}
          >
            {e.employee_name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <b>{e.employee_name}</b>
            <small>{e.employee_id}</small>
          </div>
        </div>
      )
    },
    ...Object.keys(LEAVE_QUOTA).map((tKey) => ({
      h: tKey,
      f: (eObj) => {
        const b = leaveBalance(db, eObj.employee_id)[tKey];
        return (
          <div style={{ minWidth: 100 }}>
            <b>{b.left}</b> <span className="muted sm">/ {b.quota} left</span>
            <div className="prog" style={{ marginTop: 4 }}>
              <div
                style={{
                  width: `${(b.used / b.quota) * 100}%`,
                  background: b.left <= 2 ? 'var(--red)' : 'var(--primary)'
                }}
              ></div>
            </div>
          </div>
        );
      }
    })),
    {
      h: 'Unpaid Taken',
      cls: 'ctr',
      f: (eObj) =>
        db.leaves
          .filter(
            (l) =>
              l.employee_id === eObj.employee_id &&
              l.leave_type === 'Unpaid Leave' &&
              l.status === 'Approved'
          )
          .reduce((acc, l) => acc + l.leave_days, 0)
    }
  ];

  return (
    <>
      <div className="ph">
        <div>
          <h2>Leave Balance</h2>
          <p>Entitlement for {curYear}</p>
        </div>
      </div>

      <div className="card">
        <DataTable rows={activeList} cols={cols} minw={900} size={8} />
      </div>
    </>
  );
}
