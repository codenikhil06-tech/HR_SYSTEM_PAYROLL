import React from 'react';
import { useHR, emp, deptName, nextId, t12, toMin, r2, ICONS } from '../store';
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

/* ---------- Departments Page ---------- */
export function Departments() {
  const { db, saveDb, addToast, showModal, closeModal, confirmBox } = useHR();

  const handleOpenDeptModal = (id = null) => {
    const existing = id ? db.departments.find((d) => d.department_id === id) : null;

    const DeptForm = () => {
      const [deptNameVal, setDeptNameVal] = React.useState(existing?.department_name || '');
      const [deptCodeVal, setDeptCodeVal] = React.useState(existing?.department_code || '');
      const [deptHeadVal, setDeptHeadVal] = React.useState(existing?.department_head || '');

      const handleSubmit = (e) => {
        e.preventDefault();
        const nextDeptId = existing ? existing.department_id : nextId(db, 'D', 'departments', 'department_id', 2);
        const item = {
          department_id: nextDeptId,
          department_name: deptNameVal,
          department_code: deptCodeVal,
          department_head: deptHeadVal
        };

        const updated = existing
          ? db.departments.map((d) => (d.department_id === nextDeptId ? item : d))
          : [...db.departments, item];

        saveDb({ ...db, departments: updated });
        addToast('Department saved ✔');
        closeModal();
      };

      return (
        <form id="deptForm" className="fgrid" onSubmit={handleSubmit}>
          <div className="fg full">
            <label>
              Department Name <i>*</i>
            </label>
            <input
              required
              value={deptNameVal}
              onChange={(e) => setDeptNameVal(e.target.value)}
            />
          </div>
          <div className="fg">
            <label>
              Code <i>*</i>
            </label>
            <input
              required
              value={deptCodeVal}
              onChange={(e) => setDeptCodeVal(e.target.value)}
            />
          </div>
          <div className="fg">
            <label>Department Head</label>
            <select
              value={deptHeadVal}
              onChange={(e) => setDeptHeadVal(e.target.value)}
            >
              <option value="">— None —</option>
              {db.employees.map((e) => (
                <option key={e.employee_id} value={e.employee_id}>
                  {e.employee_name}
                </option>
              ))}
            </select>
          </div>
        </form>
      );
    };

    showModal({
      title: existing ? 'Edit Department' : 'Add Department',
      size: 'sm',
      body: <DeptForm />,
      footer: (
        <>
          <button className="btn sec" onClick={closeModal}>
            Cancel
          </button>
          <button
            className="btn"
            onClick={() => document.getElementById('deptForm')?.requestSubmit()}
          >
            Save
          </button>
        </>
      )
    });
  };

  const handleDelete = (id) => {
    const inUse =
      db.employees.some((e) => e.department_id === id) ||
      db.designations.some((g) => g.department_id === id);

    if (inUse) {
      addToast('Cannot delete — it is in use by employees/designations', 'err');
      return;
    }

    confirmBox('Delete this department?', () => {
      saveDb({
        ...db,
        departments: db.departments.filter((d) => d.department_id !== id)
      });
      addToast('Department deleted');
    });
  };

  const cols = [
    { h: 'ID', f: (r) => r.department_id },
    { h: 'Department', f: (r) => <b>{r.department_name}</b> },
    { h: 'Code', f: (r) => r.department_code },
    { h: 'Head', f: (r) => (emp(db, r.department_head) || {}).employee_name || '—' },
    {
      h: 'Employees',
      cls: 'ctr',
      f: (r) => db.employees.filter((e) => e.department_id === r.department_id).length
    },
    {
      h: 'Designations',
      cls: 'ctr',
      f: (r) => db.designations.filter((g) => g.department_id === r.department_id).length
    },
    {
      h: 'Actions',
      f: (r) => (
        <div className="acts">
          <button className="btn xs sec" onClick={() => handleOpenDeptModal(r.department_id)}>
            <Icon name="edit" size={13} />
          </button>
          <button className="btn xs no" onClick={() => handleDelete(r.department_id)}>
            <Icon name="trash" size={13} />
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="ph">
        <div>
          <h2>Departments</h2>
          <p>Organisation structure</p>
        </div>
        <div className="acts noprint">
          <button className="btn" onClick={() => handleOpenDeptModal()}>
            <Icon name="plus" size={15} /> Add Department
          </button>
        </div>
      </div>
      <div className="card">
        <DataTable rows={db.departments} cols={cols} size={8} />
      </div>
    </>
  );
}

/* ---------- Designations Page ---------- */
export function Designations() {
  const { db, saveDb, addToast, showModal, closeModal, confirmBox } = useHR();

  const handleOpenDesigModal = (id = null) => {
    const existing = id ? db.designations.find((g) => g.designation_id === id) : null;

    const DesigForm = () => {
      const [desigNameVal, setDesigNameVal] = React.useState(existing?.designation_name || '');
      const [deptIdVal, setDeptIdVal] = React.useState(existing?.department_id || db.departments[0]?.department_id || '');
      const [levelVal, setLevelVal] = React.useState(existing?.level || 'Executive');

      const handleSubmit = (e) => {
        e.preventDefault();
        const nextDesigId = existing ? existing.designation_id : nextId(db, 'G', 'designations', 'designation_id', 2);
        const item = {
          designation_id: nextDesigId,
          designation_name: desigNameVal,
          department_id: deptIdVal,
          level: levelVal
        };

        const updated = existing
          ? db.designations.map((g) => (g.designation_id === nextDesigId ? item : g))
          : [...db.designations, item];

        saveDb({ ...db, designations: updated });
        addToast('Designation saved ✔');
        closeModal();
      };

      return (
        <form id="desigForm" className="fgrid" onSubmit={handleSubmit}>
          <div className="fg full">
            <label>
              Designation Name <i>*</i>
            </label>
            <input
              required
              value={desigNameVal}
              onChange={(e) => setDesigNameVal(e.target.value)}
            />
          </div>
          <div className="fg">
            <label>
              Department <i>*</i>
            </label>
            <select
              required
              value={deptIdVal}
              onChange={(e) => setDeptIdVal(e.target.value)}
            >
              {db.departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.department_name}
                </option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label>Level</label>
            <select value={levelVal} onChange={(e) => setLevelVal(e.target.value)}>
              {['Executive', 'Lead', 'Manager', 'Director'].map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
        </form>
      );
    };

    showModal({
      title: existing ? 'Edit Designation' : 'Add Designation',
      size: 'sm',
      body: <DesigForm />,
      footer: (
        <>
          <button className="btn sec" onClick={closeModal}>
            Cancel
          </button>
          <button
            className="btn"
            onClick={() => document.getElementById('desigForm')?.requestSubmit()}
          >
            Save
          </button>
        </>
      )
    });
  };

  const handleDelete = (id) => {
    const inUse = db.employees.some((e) => e.designation_id === id);
    if (inUse) {
      addToast('Cannot delete — it is in use by employees', 'err');
      return;
    }

    confirmBox('Delete this designation?', () => {
      saveDb({
        ...db,
        designations: db.designations.filter((g) => g.designation_id !== id)
      });
      addToast('Designation deleted');
    });
  };

  const cols = [
    { h: 'ID', f: (r) => r.designation_id },
    { h: 'Designation', f: (r) => <b>{r.designation_name}</b> },
    { h: 'Department', f: (r) => deptName(db, r.department_id) },
    { h: 'Level', f: (r) => r.level },
    {
      h: 'Employees',
      cls: 'ctr',
      f: (r) => db.employees.filter((e) => e.designation_id === r.designation_id).length
    },
    {
      h: 'Actions',
      f: (r) => (
        <div className="acts">
          <button className="btn xs sec" onClick={() => handleOpenDesigModal(r.designation_id)}>
            <Icon name="edit" size={13} />
          </button>
          <button className="btn xs no" onClick={() => handleDelete(r.designation_id)}>
            <Icon name="trash" size={13} />
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="ph">
        <div>
          <h2>Designations</h2>
          <p>Job titles per department</p>
        </div>
        <div className="acts noprint">
          <button className="btn" onClick={() => handleOpenDesigModal()}>
            <Icon name="plus" size={15} /> Add Designation
          </button>
        </div>
      </div>
      <div className="card">
        <DataTable rows={db.designations} cols={cols} size={8} />
      </div>
    </>
  );
}

/* ---------- Shifts Page ---------- */
export function Shifts() {
  const { db, saveDb, addToast, showModal, closeModal, confirmBox } = useHR();

  const handleOpenShiftModal = (id = null) => {
    const existing = id ? db.shifts.find((s) => s.shift_id === id) : null;

    const ShiftForm = () => {
      const [shiftNameVal, setShiftNameVal] = React.useState(existing?.shift_name || '');
      const [startTimeVal, setStartTimeVal] = React.useState(existing?.start_time || '09:00');
      const [endTimeVal, setEndTimeVal] = React.useState(existing?.end_time || '18:00');
      const [graceMinVal, setGraceMinVal] = React.useState(existing?.grace_minutes ?? 10);

      const handleSubmit = (e) => {
        e.preventDefault();
        if (endTimeVal <= startTimeVal) {
          addToast('End time must be after start time', 'err');
          return;
        }

        const nextShiftId = existing ? existing.shift_id : nextId(db, 'S', 'shifts', 'shift_id', 1);
        const item = {
          shift_id: nextShiftId,
          shift_name: shiftNameVal,
          start_time: startTimeVal,
          end_time: endTimeVal,
          grace_minutes: +graceMinVal
        };

        const updated = existing
          ? db.shifts.map((s) => (s.shift_id === nextShiftId ? item : s))
          : [...db.shifts, item];

        saveDb({ ...db, shifts: updated });
        addToast('Shift saved ✔');
        closeModal();
      };

      return (
        <form id="shiftForm" className="fgrid" onSubmit={handleSubmit}>
          <div className="fg full">
            <label>
              Shift Name <i>*</i>
            </label>
            <input
              required
              value={shiftNameVal}
              onChange={(e) => setShiftNameVal(e.target.value)}
            />
          </div>
          <div className="fg">
            <label>
              Start Time <i>*</i>
            </label>
            <input
              required
              type="time"
              value={startTimeVal}
              onChange={(e) => setStartTimeVal(e.target.value)}
            />
          </div>
          <div className="fg">
            <label>
              End Time <i>*</i>
            </label>
            <input
              required
              type="time"
              value={endTimeVal}
              onChange={(e) => setEndTimeVal(e.target.value)}
            />
          </div>
          <div className="fg full">
            <label>Grace Minutes</label>
            <input
              type="number"
              min="0"
              value={graceMinVal}
              onChange={(e) => setGraceMinVal(e.target.value)}
            />
          </div>
        </form>
      );
    };

    showModal({
      title: existing ? 'Edit Shift' : 'Add Shift',
      size: 'sm',
      body: <ShiftForm />,
      footer: (
        <>
          <button className="btn sec" onClick={closeModal}>
            Cancel
          </button>
          <button
            className="btn"
            onClick={() => document.getElementById('shiftForm')?.requestSubmit()}
          >
            Save
          </button>
        </>
      )
    });
  };

  const handleDelete = (id) => {
    const inUse = db.employees.some((e) => e.shift_id === id);
    if (inUse) {
      addToast('Cannot delete — it is in use by employees', 'err');
      return;
    }

    confirmBox('Delete this shift?', () => {
      saveDb({
        ...db,
        shifts: db.shifts.filter((s) => s.shift_id !== id)
      });
      addToast('Shift deleted');
    });
  };

  const cols = [
    { h: 'ID', f: (r) => r.shift_id },
    { h: 'Shift', f: (r) => <b>{r.shift_name}</b> },
    { h: 'Start', f: (r) => t12(r.start_time) },
    { h: 'End', f: (r) => t12(r.end_time) },
    {
      h: 'Duration',
      f: (r) => `${r2((toMin(r.end_time) - toMin(r.start_time)) / 60)} h`
    },
    { h: 'Grace', f: (r) => `${r.grace_minutes} min` },
    {
      h: 'Employees',
      cls: 'ctr',
      f: (r) => db.employees.filter((e) => e.shift_id === r.shift_id).length
    },
    {
      h: 'Actions',
      f: (r) => (
        <div className="acts">
          <button className="btn xs sec" onClick={() => handleOpenShiftModal(r.shift_id)}>
            <Icon name="edit" size={13} />
          </button>
          <button className="btn xs no" onClick={() => handleDelete(r.shift_id)}>
            <Icon name="trash" size={13} />
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="ph">
        <div>
          <h2>Shift Management</h2>
          <p>Working hours, grace time &amp; late rules</p>
        </div>
        <div className="acts noprint">
          <button className="btn" onClick={() => handleOpenShiftModal()}>
            <Icon name="plus" size={15} /> Add Shift
          </button>
        </div>
      </div>
      <div className="card">
        <DataTable rows={db.shifts} cols={cols} size={8} />
      </div>
    </>
  );
}
