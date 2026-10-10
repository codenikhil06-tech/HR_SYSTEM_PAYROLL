import React from 'react';
import { db, ICONS, emp, deptName } from '../store';

const Icon = ({ name, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: `<path d="${ICONS[name] || ICONS['file']}"/>` }} />
);

export function Departments() {
  return (
    <div>
      <div className="ph">
        <div>
          <h2>Departments</h2>
          <p>Organisation structure</p>
        </div>
        <div className="acts">
          <button className="btn"><Icon name="plus" size={15} /> Add Department</button>
        </div>
      </div>
      <div className="card">
        <div className="tw">
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th><th>Department</th><th>Code</th><th>Head</th><th className="ctr">Employees</th><th className="ctr">Designations</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {db.departments.map(r => (
                <tr key={r.department_id}>
                  <td>{r.department_id}</td>
                  <td><b>{r.department_name}</b></td>
                  <td>{r.department_code}</td>
                  <td>{(emp(r.department_head)||{}).employee_name||'—'}</td>
                  <td className="ctr">{db.employees.filter(e=>e.department_id===r.department_id).length}</td>
                  <td className="ctr">{db.designations.filter(g=>g.department_id===r.department_id).length}</td>
                  <td>
                    <div className="acts">
                      <button className="btn xs sec"><Icon name="edit" size={13} /></button>
                      <button className="btn xs no"><Icon name="trash" size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function Designations() {
  return (
    <div>
      <div className="ph">
        <div>
          <h2>Designations</h2>
          <p>Job titles per department</p>
        </div>
        <div className="acts">
          <button className="btn"><Icon name="plus" size={15} /> Add Designation</button>
        </div>
      </div>
      <div className="card">
        <div className="tw">
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th><th>Designation</th><th>Department</th><th>Level</th><th className="ctr">Employees</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {db.designations.map(r => (
                <tr key={r.designation_id}>
                  <td>{r.designation_id}</td>
                  <td><b>{r.designation_name}</b></td>
                  <td>{deptName(r.department_id)}</td>
                  <td>{r.level}</td>
                  <td className="ctr">{db.employees.filter(e=>e.designation_id===r.designation_id).length}</td>
                  <td>
                    <div className="acts">
                      <button className="btn xs sec"><Icon name="edit" size={13} /></button>
                      <button className="btn xs no"><Icon name="trash" size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function Shifts() {
  const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
  const t12 = t => { if(!t)return '—'; let [h,m] = t.split(':').map(Number); const ap = h>=12?'PM':'AM'; h=h%12||12; return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')} ${ap}`; };
  return (
    <div>
      <div className="ph">
        <div>
          <h2>Shift Management</h2>
          <p>Working hours, grace time & late rules</p>
        </div>
        <div className="acts">
          <button className="btn"><Icon name="plus" size={15} /> Add Shift</button>
        </div>
      </div>
      <div className="card">
        <div className="tw">
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th><th>Shift</th><th>Start</th><th>End</th><th>Duration</th><th>Grace</th><th className="ctr">Employees</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {db.shifts.map(r => (
                <tr key={r.shift_id}>
                  <td>{r.shift_id}</td>
                  <td><b>{r.shift_name}</b></td>
                  <td>{t12(r.start_time)}</td>
                  <td>{t12(r.end_time)}</td>
                  <td>{Math.round(((toMin(r.end_time)-toMin(r.start_time))/60)*100)/100} h</td>
                  <td>{r.grace_minutes} min</td>
                  <td className="ctr">{db.employees.filter(e=>e.shift_id===r.shift_id).length}</td>
                  <td>
                    <div className="acts">
                      <button className="btn xs sec"><Icon name="edit" size={13} /></button>
                      <button className="btn xs no"><Icon name="trash" size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
