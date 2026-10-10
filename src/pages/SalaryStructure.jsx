import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  useHR,
  emp,
  activeEmps,
  inr,
  grossOf,
  computeSalary,
  estFull,
  CFG,
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

export default function SalaryStructure() {
  const { db, saveDb, addToast, logActivity } = useHR();
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const paramEmpId = queryParams.get('emp');

  const activeList = activeEmps(db);
  const [selectedEmpId, setSelectedEmpId] = useState(
    paramEmpId || activeList[0]?.employee_id || db.employees[0]?.employee_id
  );

  const selectedEmp = emp(db, selectedEmpId) || activeList[0] || db.employees[0];

  const [structureState, setStructureState] = useState({
    basic_salary: selectedEmp?.salary_structure?.basic_salary || 25000,
    hra: selectedEmp?.salary_structure?.hra || 10000,
    conveyance_allowance: selectedEmp?.salary_structure?.conveyance_allowance || 1600,
    medical_allowance: selectedEmp?.salary_structure?.medical_allowance || 1250,
    special_allowance: selectedEmp?.salary_structure?.special_allowance || 5000,
    bonus: selectedEmp?.salary_structure?.bonus || 0,
    incentive: selectedEmp?.salary_structure?.incentive || 0,
    advance_salary: selectedEmp?.salary_structure?.advance_salary || 0,
    other_deduction: selectedEmp?.salary_structure?.other_deduction || 0
  });

  useEffect(() => {
    if (selectedEmp && selectedEmp.salary_structure) {
      setStructureState({
        basic_salary: selectedEmp.salary_structure.basic_salary || 0,
        hra: selectedEmp.salary_structure.hra || 0,
        conveyance_allowance: selectedEmp.salary_structure.conveyance_allowance || 0,
        medical_allowance: selectedEmp.salary_structure.medical_allowance || 0,
        special_allowance: selectedEmp.salary_structure.special_allowance || 0,
        bonus: selectedEmp.salary_structure.bonus || 0,
        incentive: selectedEmp.salary_structure.incentive || 0,
        advance_salary: selectedEmp.salary_structure.advance_salary || 0,
        other_deduction: selectedEmp.salary_structure.other_deduction || 0
      });
    }
  }, [selectedEmpId, selectedEmp]);

  const handleInputChange = (key, val) => {
    setStructureState((prev) => ({
      ...prev,
      [key]: val === '' ? '' : +val
    }));
  };

  const handleSave = () => {
    if (!selectedEmp) return;
    const cleanStruct = {
      basic_salary: +structureState.basic_salary || 0,
      hra: +structureState.hra || 0,
      conveyance_allowance: +structureState.conveyance_allowance || 0,
      medical_allowance: +structureState.medical_allowance || 0,
      special_allowance: +structureState.special_allowance || 0,
      bonus: +structureState.bonus || 0,
      incentive: +structureState.incentive || 0,
      advance_salary: +structureState.advance_salary || 0,
      other_deduction: +structureState.other_deduction || 0
    };

    const updatedEmp = {
      ...selectedEmp,
      basic_salary: cleanStruct.basic_salary,
      gross_salary: grossOf(cleanStruct),
      salary_structure: cleanStruct
    };

    const nextList = db.employees.map((x) =>
      x.employee_id === selectedEmp.employee_id ? updatedEmp : x
    );

    saveDb({ ...db, employees: nextList });
    logActivity(`Salary structure revised for ${selectedEmp.employee_name}`, 'salary');
    addToast('Salary structure saved ✔');
  };

  const liveCalc = computeSalary(selectedEmp || {}, {
    working_days: 26,
    present_days: 26,
    paid_leave: 0,
    overtime_hours: 0,
    late_days: 0,
    bonus: +structureState.bonus || 0,
    incentive: +structureState.incentive || 0,
    other_deduction: +structureState.other_deduction || 0
  });

  const liveGross = grossOf(structureState);

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
            <b>
              <Link to={`/employee-profile/${e.employee_id}`}>{e.employee_name}</Link>
            </b>
            <small>{e.employee_id}</small>
          </div>
        </div>
      )
    },
    { h: 'Basic', cls: 'num', f: (x) => inr(x.salary_structure?.basic_salary || 0) },
    { h: 'HRA', cls: 'num', f: (x) => inr(x.salary_structure?.hra || 0) },
    {
      h: 'Other Allowances',
      cls: 'num',
      f: (x) =>
        inr(
          (x.salary_structure?.conveyance_allowance || 0) +
            (x.salary_structure?.medical_allowance || 0) +
            (x.salary_structure?.special_allowance || 0)
        )
    },
    { h: 'Gross', cls: 'num', f: (x) => inr(grossOf(x.salary_structure)) },
    { h: 'Est. Deduction', cls: 'num', f: (x) => inr(estFull(db, x).total_deduction) },
    { h: 'Est. Net', cls: 'num', f: (x) => <b>{inr(estFull(db, x).net_salary)}</b> },
    {
      h: '',
      f: (x) => (
        <button
          className="btn xs sec"
          onClick={() => {
            setSelectedEmpId(x.employee_id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <Icon name="edit" size={13} /> Edit
        </button>
      )
    }
  ];

  return (
    <>
      <div className="ph">
        <div>
          <h2>Salary Structure</h2>
          <p>Define earnings and deduction components per employee</p>
        </div>
        <div className="acts noprint">
          <select
            style={{ width: 270 }}
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
          >
            {db.employees.map((e) => (
              <option key={e.employee_id} value={e.employee_id}>
                {e.employee_name} ({e.employee_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid g21">
        <div className="card">
          <h3>Components — {selectedEmp?.employee_name}</h3>
          <div className="grid g2" style={{ margin: 0 }}>
            <div>
              <h4 className="pos" style={{ marginBottom: 8 }}>
                EARNINGS
              </h4>
              {[
                ['basic_salary', 'Basic Salary'],
                ['hra', 'HRA'],
                ['conveyance_allowance', 'Conveyance Allowance'],
                ['medical_allowance', 'Medical Allowance'],
                ['special_allowance', 'Special Allowance'],
                ['bonus', 'Bonus (monthly default)'],
                ['incentive', 'Incentive (monthly default)']
              ].map(([k, label]) => (
                <div key={k} className="fg" style={{ marginBottom: 9 }}>
                  <label>{label}</label>
                  <input
                    type="number"
                    min="0"
                    value={structureState[k]}
                    onChange={(e) => handleInputChange(k, e.target.value)}
                  />
                </div>
              ))}
              <div className="fg">
                <label>Overtime</label>
                <input readOnly value="Auto from attendance" />
                <small>
                  Rate = Basic ÷ working days ÷ 8 × {CFG.ot_multiplier}
                </small>
              </div>
            </div>

            <div>
              <h4 className="neg" style={{ marginBottom: 8 }}>
                DEDUCTIONS
              </h4>
              <div className="fg" style={{ marginBottom: 9 }}>
                <label>PF</label>
                <input readOnly value={inr(liveCalc.pf)} />
                <small>
                  {CFG.pf_rate}% of basic (cap ₹{CFG.pf_cap.toLocaleString('en-IN')})
                </small>
              </div>
              <div className="fg" style={{ marginBottom: 9 }}>
                <label>ESI</label>
                <input readOnly value={inr(liveCalc.esi)} />
                <small>
                  {CFG.esi_rate}% if gross ≤ ₹{CFG.esi_limit.toLocaleString('en-IN')}
                </small>
              </div>
              <div className="fg" style={{ marginBottom: 9 }}>
                <label>Professional Tax</label>
                <input readOnly value={inr(liveCalc.professional_tax)} />
                <small>Slab based (auto)</small>
              </div>
              <div className="fg" style={{ marginBottom: 9 }}>
                <label>TDS</label>
                <input readOnly value={inr(liveCalc.tds)} />
                <small>
                  {CFG.tds_rate}% above ₹{CFG.tds_threshold.toLocaleString('en-IN')} (est.)
                </small>
              </div>
              <div className="fg" style={{ marginBottom: 9 }}>
                <label>Advance Salary (monthly recovery)</label>
                <input
                  type="number"
                  min="0"
                  value={structureState.advance_salary}
                  onChange={(e) => handleInputChange('advance_salary', e.target.value)}
                />
              </div>
              <div className="fg" style={{ marginBottom: 9 }}>
                <label>Late Deduction</label>
                <input
                  readOnly
                  value={`Auto — ½ day per ${CFG.late_marks_per_halfday} late marks`}
                />
              </div>
              <div className="fg">
                <label>Other Deduction</label>
                <input
                  type="number"
                  min="0"
                  value={structureState.other_deduction}
                  onChange={(e) => handleInputChange('other_deduction', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="acts" style={{ marginTop: 16 }}>
            <button className="btn" onClick={handleSave}>
              <Icon name="check" size={16} /> Save Salary Structure
            </button>
          </div>
        </div>

        <div className="card">
          <h3>Summary (full month)</h3>
          <div>
            <div className="row">
              <span>Fixed Gross</span>
              <b>{inr(liveGross)}</b>
            </div>
            <div className="row">
              <span>+ Bonus / Incentive</span>
              <b>{inr((+structureState.bonus || 0) + (+structureState.incentive || 0))}</b>
            </div>
            <div className="row tot">
              <span>Gross Salary</span>
              <span>{inr(liveCalc.gross_salary)}</span>
            </div>
            <div className="row">
              <span>PF</span>
              <span className="neg">- {inr(liveCalc.pf)}</span>
            </div>
            <div className="row">
              <span>ESI</span>
              <span className="neg">- {inr(liveCalc.esi)}</span>
            </div>
            <div className="row">
              <span>Professional Tax</span>
              <span className="neg">- {inr(liveCalc.professional_tax)}</span>
            </div>
            <div className="row">
              <span>TDS</span>
              <span className="neg">- {inr(liveCalc.tds)}</span>
            </div>
            <div className="row">
              <span>Advance + Other</span>
              <span className="neg">
                - {inr((+structureState.advance_salary || 0) + (+structureState.other_deduction || 0))}
              </span>
            </div>
            <div className="row tot">
              <span>Total Deduction</span>
              <span className="neg">{inr(liveCalc.total_deduction)}</span>
            </div>
            <div className="row tot" style={{ fontSize: 17 }}>
              <span>Net Salary</span>
              <span className="pos">{inr(liveCalc.net_salary)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>All Salary Structures</h3>
        <DataTable rows={db.employees} cols={cols} minw={900} size={6} />
      </div>
    </>
  );
}
