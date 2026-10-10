import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  useHR,
  deptName,
  desigName,
  shiftOf,
  fmtD,
  inr,
  grossOf,
  defaultStructure,
  nextId,
  emp,
  BC,
  TODAY,
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

export default function Employees() {
  const { db, saveDb, addToast, showModal, closeModal, confirmBox, logActivity } = useHR();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showMore, setShowMore] = useState(false);

  const filteredEmployees = db.employees.filter((e) => {
    const q = search.toLowerCase();
    const matchDept = !deptFilter || e.department_id === deptFilter;
    const matchStatus = !statusFilter || e.status === statusFilter;
    const matchSearch =
      !q || (e.employee_name + e.employee_id + e.email + e.phone).toLowerCase().includes(q);
    return matchDept && matchStatus && matchSearch;
  });

  const handleDelete = (eObj) => {
    confirmBox(
      `Delete <b>${eObj.employee_name}</b> (${eObj.employee_id})? Attendance and leave records will also be removed.`,
      () => {
        const nextEmployees = db.employees.filter((x) => x.employee_id !== eObj.employee_id);
        const nextAttendance = db.attendance.filter((a) => a.employee_id !== eObj.employee_id);
        const nextLeaves = db.leaves.filter((l) => l.employee_id !== eObj.employee_id);
        saveDb({
          ...db,
          employees: nextEmployees,
          attendance: nextAttendance,
          leaves: nextLeaves
        });
        addToast('Employee deleted', 'ok');
      }
    );
  };

  const handleOpenModal = (employeeId = null) => {
    const existing = employeeId ? emp(db, employeeId) : null;
    let photoData = existing ? existing.photo : '';

    const EmployeeForm = () => {
      const [formData, setFormData] = useState({
        employee_name: existing ? existing.employee_name : '',
        gender: existing ? existing.gender : 'Male',
        dob: existing ? existing.dob : '1995-01-01',
        phone: existing ? existing.phone : '',
        email: existing ? existing.email : '',
        joining_date: existing ? existing.joining_date : TODAY,
        department_id: existing ? existing.department_id : db.departments[0]?.department_id || '',
        designation_id: existing ? existing.designation_id : '',
        shift_id: existing ? existing.shift_id : 'S1',
        status: existing ? existing.status : 'Active',
        basic_salary: existing ? existing.basic_salary : 25000,
        bank_account: existing ? existing.bank_account : '',
        ifsc: existing ? existing.ifsc : '',
        pan: existing ? existing.pan : '',
        pf_number: existing ? existing.pf_number : '',
        esi_number: existing ? existing.esi_number : '',
        emergency_contact: existing ? existing.emergency_contact : '',
        address: existing ? existing.address : ''
      });

      const filteredDesignations = db.designations.filter(
        (g) => g.department_id === formData.department_id
      );

      const handleDeptChange = (newDept) => {
        const desigs = db.designations.filter((g) => g.department_id === newDept);
        setFormData((prev) => ({
          ...prev,
          department_id: newDept,
          designation_id: desigs[0]?.designation_id || ''
        }));
      };

      const handlePhotoChange = (e) => {
        const fl = e.target.files[0];
        if (!fl) return;
        if (fl.size > 400000) {
          addToast('Photo too large (max 400 KB)', 'err');
          return;
        }
        const r = new FileReader();
        r.onload = () => {
          photoData = r.result;
        };
        r.readAsDataURL(fl);
      };

      const handleSubmit = (e) => {
        e.preventDefault();
        if (!/^\d{10}$/.test(formData.phone)) {
          addToast('Phone must be a 10-digit number', 'err');
          return;
        }
        if (formData.pan && !/^[A-Z]{5}\d{4}[A-Z]$/i.test(formData.pan)) {
          addToast('PAN format invalid (e.g. ABCDE1234F)', 'err');
          return;
        }

        const id = existing
          ? existing.employee_id
          : nextId(db, 'EMP', 'employees', 'employee_id', 3);
        const oldStruct = existing?.salary_structure || {};
        const newStruct = defaultStructure(+formData.basic_salary || 0);
        newStruct.bonus = oldStruct.bonus || 0;
        newStruct.incentive = oldStruct.incentive || 0;
        newStruct.advance_salary = oldStruct.advance_salary || 0;
        newStruct.other_deduction = oldStruct.other_deduction || 0;

        const updatedEmp = {
          ...(existing || { documents: [] }),
          ...formData,
          employee_id: id,
          pan: formData.pan.toUpperCase(),
          ifsc: formData.ifsc.toUpperCase(),
          basic_salary: +formData.basic_salary,
          gross_salary: grossOf(newStruct),
          salary_structure: newStruct,
          photo: photoData || existing?.photo || ''
        };

        const nextList = existing
          ? db.employees.map((x) => (x.employee_id === id ? updatedEmp : x))
          : [...db.employees, updatedEmp];

        saveDb({ ...db, employees: nextList });
        logActivity(
          `${existing ? 'Employee updated' : 'New employee added'}: ${updatedEmp.employee_name}`,
          'employee'
        );
        addToast(existing ? 'Employee updated ✔' : `Employee added ✔ — ${id}`);
        closeModal();
      };

      return (
        <form id="mform" className="fgrid" onSubmit={handleSubmit}>
          <div className="fg full">
            <label>Profile Photo</label>
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            <small>Optional — stored in browser (max ~400 KB)</small>
          </div>

          <div className="fg">
            <label>
              Employee Name <i>*</i>
            </label>
            <input
              required
              value={formData.employee_name}
              onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
            />
          </div>

          <div className="fg">
            <label>Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="fg">
            <label>Date of Birth</label>
            <input
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
          </div>

          <div className="fg">
            <label>
              Phone <i>*</i>
            </label>
            <input
              required
              type="tel"
              placeholder="10-digit mobile"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="fg">
            <label>
              Email <i>*</i>
            </label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="fg">
            <label>
              Joining Date <i>*</i>
            </label>
            <input
              required
              type="date"
              value={formData.joining_date}
              onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
            />
          </div>

          <div className="fg">
            <label>
              Department <i>*</i>
            </label>
            <select
              required
              value={formData.department_id}
              onChange={(e) => handleDeptChange(e.target.value)}
            >
              {db.departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.department_name}
                </option>
              ))}
            </select>
          </div>

          <div className="fg">
            <label>
              Designation <i>*</i>
            </label>
            <select
              required
              value={formData.designation_id}
              onChange={(e) => setFormData({ ...formData, designation_id: e.target.value })}
            >
              <option value="">Select designation</option>
              {filteredDesignations.map((g) => (
                <option key={g.designation_id} value={g.designation_id}>
                  {g.designation_name}
                </option>
              ))}
            </select>
          </div>

          <div className="fg">
            <label>Shift</label>
            <select
              value={formData.shift_id}
              onChange={(e) => setFormData({ ...formData, shift_id: e.target.value })}
            >
              {db.shifts.map((s) => (
                <option key={s.shift_id} value={s.shift_id}>
                  {s.shift_name} ({s.start_time}–{s.end_time})
                </option>
              ))}
            </select>
          </div>

          <div className="fg">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Probation">Probation</option>
              <option value="On Notice">On Notice</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="fg">
            <label>
              Basic Salary (monthly ₹) <i>*</i>
            </label>
            <input
              required
              type="number"
              min="0"
              value={formData.basic_salary}
              onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
            />
          </div>

          <div className="fg">
            <label>Gross Salary (auto)</label>
            <input
              readOnly
              value={inr(grossOf(defaultStructure(+formData.basic_salary || 0)))}
            />
          </div>

          <div className="fg">
            <label>Bank Account No.</label>
            <input
              value={formData.bank_account}
              onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
            />
          </div>

          <div className="fg">
            <label>IFSC</label>
            <input
              value={formData.ifsc}
              onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
            />
          </div>

          <div className="fg">
            <label>PAN</label>
            <input
              value={formData.pan}
              onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
            />
          </div>

          <div className="fg">
            <label>PF Number</label>
            <input
              value={formData.pf_number}
              onChange={(e) => setFormData({ ...formData, pf_number: e.target.value })}
            />
          </div>

          <div className="fg">
            <label>ESI Number</label>
            <input
              value={formData.esi_number}
              onChange={(e) => setFormData({ ...formData, esi_number: e.target.value })}
            />
          </div>

          <div className="fg">
            <label>Emergency Contact</label>
            <input
              type="tel"
              value={formData.emergency_contact}
              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
            />
          </div>

          <div className="fg full">
            <label>Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </form>
      );
    };

    showModal({
      title: existing ? `Edit Employee — ${existing.employee_id}` : 'Add New Employee',
      size: 'lg',
      body: <EmployeeForm />,
      footer: (
        <>
          <button className="btn sec" onClick={closeModal}>
            Cancel
          </button>
          <button className="btn" onClick={() => document.getElementById('mform')?.requestSubmit()}>
            {existing ? 'Update Employee' : 'Add Employee'}
          </button>
        </>
      )
    });
  };

  const cols = [
    {
      h: 'Employee',
      f: (e) => (
        <div className="ecell">
          {e.photo ? (
            <img className="av" style={{ width: 36, height: 36 }} src={e.photo} alt="" />
          ) : (
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
          )}
          <div>
            <b>
              <Link to={`/employee-profile/${e.employee_id}`}>{e.employee_name}</Link>
            </b>
            <small>{e.employee_id}</small>
          </div>
        </div>
      )
    },
    { h: 'Department', f: (e) => deptName(db, e.department_id) },
    { h: 'Designation', f: (e) => desigName(db, e.designation_id) },
    { h: 'Joining Date', f: (e) => fmtD(e.joining_date) },
    { h: 'Phone', f: (e) => e.phone },
    { h: 'Email', f: (e) => e.email },
    { h: 'Shift', f: (e) => shiftOf(db, e.shift_id)?.shift_name || 'General Shift' },
    { h: 'Status', f: (e) => <Badge t={e.status} /> },
    { h: 'Basic', cls: 'num', f: (e) => inr(e.basic_salary) },
    { h: 'Gross', cls: 'num', f: (e) => inr(e.gross_salary) },
    ...(showMore
      ? [
          { h: 'Bank A/c', f: (e) => e.bank_account || '—' },
          { h: 'IFSC', f: (e) => e.ifsc || '—' },
          { h: 'PAN', f: (e) => e.pan || '—' },
          { h: 'PF No.', f: (e) => e.pf_number || '—' },
          { h: 'ESI No.', f: (e) => e.esi_number || '—' }
        ]
      : []),
    {
      h: 'Actions',
      f: (e) => (
        <div className="acts">
          <button
            className="btn xs sec"
            title="View"
            onClick={() => navigate(`/employee-profile/${e.employee_id}`)}
          >
            <Icon name="eye" size={14} />
          </button>
          <button
            className="btn xs sec"
            title="Edit"
            onClick={() => handleOpenModal(e.employee_id)}
          >
            <Icon name="edit" size={14} />
          </button>
          <button
            className="btn xs no"
            title="Delete"
            onClick={() => handleDelete(e)}
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="ph">
        <div>
          <h2>Employee List</h2>
          <p>Manage employee master data</p>
        </div>
        <div className="acts noprint">
          <button className="btn" onClick={() => handleOpenModal()}>
            <Icon name="plus" size={16} /> Add Employee
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <div className="f grow">
            <label>Search</label>
            <input
              placeholder="Name, ID, phone, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="f">
            <label>Department</label>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {db.departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>
                  {d.department_name}
                </option>
              ))}
            </select>
          </div>

          <div className="f">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {['Active', 'Probation', 'On Notice', 'Inactive'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="f">
            <label>&nbsp;</label>
            <label
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                textTransform: 'none',
                fontSize: 13,
                margin: 0,
                padding: '8px 0',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                style={{ width: 'auto' }}
                checked={showMore}
                onChange={(e) => setShowMore(e.target.checked)}
              />
              Show bank / statutory columns
            </label>
          </div>
        </div>

        <DataTable rows={filteredEmployees} cols={cols} minw={1000} size={8} />
      </div>
    </>
  );
}
