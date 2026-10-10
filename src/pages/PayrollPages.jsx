import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  useHR,
  activeEmps,
  inr,
  num,
  pad,
  ymLabel,
  runItems,
  totalsOf,
  runTotals,
  computeSalary,
  buildInputs,
  makeItem,
  daysIn,
  deptName,
  desigName,
  emp,
  fmtD,
  grossOf,
  nextId,
  TODAY,
  CUR_YM,
  MONTHS,
  CFG,
  BC,
  ICONS
} from '../store';

import DataTable from '../components/DataTable';
import { BarChart } from '../components/Charts';

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

const WF = [
  'Employee Master',
  'Salary Structure',
  'Attendance',
  'Leave',
  'Working Days',
  'Present Days',
  'Paid Leave',
  'Unpaid Leave',
  'Late Deduction',
  'Overtime',
  'Bonus / Incentive',
  'Gross Earned Salary',
  'PF / ESI / Tax',
  'Other Deductions',
  'Net Salary',
  'Generate Payroll',
  'Generate Payslip'
];

function WorkflowSteps({ vals, active = -1, done = -1 }) {
  const stepsVals = vals || WF.map(() => '—');
  return (
    <div className="flow">
      {WF.map((w, i) => (
        <div
          key={i}
          className={`step ${i <= done ? 'done' : i === active ? 'active' : ''}`}
        >
          <span className="n">{i + 1}</span>
          <b>{w}</b>
          <div>{stepsVals[i]}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Payroll Dashboard ---------- */
export function PayrollDashboard() {
  const { db } = useHR();
  const navigate = useNavigate();

  const run = db.payrolls.find((p) => p.payroll_month === CUR_YM);
  let items = [];
  let est = false;

  if (run) {
    items = runItems(db, run.payroll_id);
  } else {
    est = true;
    items = activeEmps(db).map((e) =>
      makeItem('EST', e, computeSalary(e, buildInputs(db, e, CUR_YM)), 'Pending', '')
    );
  }

  const T = totalsOf(items);
  const runs = [...db.payrolls]
    .sort((a, b) => a.payroll_month.localeCompare(b.payroll_month))
    .slice(-6);

  return (
    <>
      <div className="ph">
        <div>
          <h2>Payroll Dashboard</h2>
          <p>
            Current payroll month: <b>{ymLabel(CUR_YM)}</b>
          </p>
        </div>
        <div className="acts noprint">
          <button className="btn lg" onClick={() => navigate('/payroll-generate')}>
            <Icon name="zap" size={17} /> GENERATE PAYROLL
          </button>
        </div>
      </div>

      {est ? (
        <div className="warn">
          Payroll for this month is not generated yet — figures below are estimates based on salary
          structures and attendance to date (remaining days assumed present).
        </div>
      ) : (
        <div className="info">
          Payroll {run.payroll_id} • <Badge t={run.status} /> • Generated on {fmtD(run.generated_date)}
        </div>
      )}

      <div className="grid g4">
        <div className="card stat">
          <div className="ico blue">
            <Icon name="calendar" size={22} />
          </div>
          <div>
            <div className="v">{ymLabel(CUR_YM)}</div>
            <div className="l">Current Month</div>
            <div className="s">{run ? run.status : 'Not Generated'}</div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico teal">
            <Icon name="users" size={22} />
          </div>
          <div>
            <div className="v">{T.count}</div>
            <div className="l">Total Employees</div>
            <div className="s">In payroll</div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico blue">
            <Icon name="card" size={22} />
          </div>
          <div>
            <div className="v">{inr(T.gross)}</div>
            <div className="l">Total Gross Salary</div>
            <div className="s"></div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico amber">
            <Icon name="file" size={22} />
          </div>
          <div>
            <div className="v">{inr(T.ded)}</div>
            <div className="l">Total Deductions</div>
            <div className="s">PF, ESI, tax &amp; others</div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico green">
            <Icon name="check" size={22} />
          </div>
          <div>
            <div className="v">{inr(T.net)}</div>
            <div className="l">Total Net Salary</div>
            <div className="s">Payable</div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico green">
            <Icon name="check" size={22} />
          </div>
          <div>
            <div className="v">{inr(T.paid)}</div>
            <div className="l">Paid Salary</div>
            <div className="s">{T.net ? Math.round((T.paid / T.net) * 100) : 0}% of net</div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico red">
            <Icon name="clock" size={22} />
          </div>
          <div>
            <div className="v">{inr(T.pending)}</div>
            <div className="l">Pending Salary</div>
            <div className="s">To be disbursed</div>
          </div>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <h3>Payroll Trend (last {runs.length} months)</h3>
          <BarChart
            labels={runs.map((r) => ymLabel(r.payroll_month).slice(0, 3))}
            series={[
              { name: 'Gross', color: '#93b4f5', values: runs.map((r) => runTotals(db, r.payroll_id).gross) },
              { name: 'Net', color: '#2563eb', values: runs.map((r) => runTotals(db, r.payroll_id).net) }
            ]}
            options={{
              fmt: (v) => (v >= 1e5 ? (v / 1e5).toFixed(1) + 'L' : Math.round(v / 1e3) + 'k')
            }}
          />
        </div>

        <div className="card">
          <h3>Disbursement Progress</h3>
          <div style={{ fontSize: 30, fontWeight: 800 }}>
            {T.net ? Math.round((T.paid / T.net) * 100) : 0}%
          </div>
          <div className="prog" style={{ margin: '8px 0 14px', height: 12 }}>
            <div
              style={{
                width: `${T.net ? (T.paid / T.net) * 100 : 0}%`,
                background: 'var(--green)'
              }}
            ></div>
          </div>
          <div className="row">
            <span>Paid</span>
            <b className="pos">{inr(T.paid)}</b>
          </div>
          <div className="row">
            <span>Pending</span>
            <b className="neg">{inr(T.pending)}</b>
          </div>
          <div className="row">
            <span>Payment Status</span>
            <Badge t={T.pay} />
          </div>
          {run && (
            <div className="acts" style={{ marginTop: 12 }}>
              <button className="btn out" onClick={() => navigate(`/payroll-run/${run.payroll_id}`)}>
                Open payroll run
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Automated Payroll Workflow</h3>
        <WorkflowSteps />
      </div>

      <div className="card">
        <h3>
          {ymLabel(CUR_YM)} — Payroll Lines {est ? '(estimate)' : ''}
        </h3>
        <div className="tw">
          <table className="tbl" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th className="num">Paid Days</th>
                <th className="num">Gross</th>
                <th className="num">Deduction</th>
                <th className="num">Net</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 8).map((i) => (
                <tr key={i.payroll_item_id}>
                  <td>{i.employee_name}</td>
                  <td className="num">
                    {i.paid_days}/{i.working_days}
                  </td>
                  <td className="num">{inr(i.gross_salary)}</td>
                  <td className="num">{inr(i.total_deduction)}</td>
                  <td className="num">
                    <b>{inr(i.net_salary)}</b>
                  </td>
                  <td>
                    <Badge t={i.payment_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length > 8 && (
          <div className="muted sm" style={{ marginTop: 8 }}>
            + {items.length - 8} more employees
          </div>
        )}
      </div>
    </>
  );
}

/* ---------- Generate Payroll ---------- */
export function PayrollGenerate() {
  const { id: paramPid } = useParams();
  const navigate = useNavigate();
  const { db, saveDb, addToast, showModal, closeModal, logActivity } = useHR();

  const initialYm = paramPid ? paramPid.replace('PR-', '') : CUR_YM;
  const [selectedYm, setSelectedYm] = useState(initialYm);
  const [deptFilter, setDeptFilter] = useState('');
  const [empFilter, setEmpFilter] = useState('');

  const [monthVal, setMonthVal] = useState(+initialYm.split('-')[1]);
  const [yearVal, setYearVal] = useState(+initialYm.split('-')[0]);

  const [genRows, setGenRows] = useState(null);

  const handleCalculate = (m = monthVal, y = yearVal, dFilter = deptFilter, eFilter = empFilter) => {
    const ym = `${y}-${pad(m)}`;
    setSelectedYm(ym);
    const end = `${ym}-${daysIn(ym)}`;
    const ex = db.payrolls.find((p) => p.payroll_month === ym);

    if (ex && ex.status === 'Finalized') {
      addToast(`${ymLabel(ym)} payroll is finalized and locked`, 'err');
      return;
    }

    const list = activeEmps(db).filter(
      (e) =>
        e.joining_date <= end &&
        (!dFilter || e.department_id === dFilter) &&
        (!eFilter || e.employee_id === eFilter)
    );

    if (!list.length) {
      addToast('No employees match this selection', 'err');
      return;
    }

    const computed = list.map((e) => {
      const old =
        ex &&
        db.payroll_items.find(
          (i) => i.payroll_id === ex.payroll_id && i.employee_id === e.employee_id
        );
      const inp = old
        ? {
            working_days: old.working_days,
            present_days: old.present_days,
            paid_leave: old.paid_leave,
            overtime_hours: old.overtime_hours,
            late_days: old.late_days,
            bonus: old.bonus,
            incentive: old.incentive,
            other_deduction: old.other_deduction
          }
        : buildInputs(db, e, ym);

      return {
        e,
        inp,
        c: computeSalary(e, inp),
        old
      };
    });

    setGenRows(computed);
  };

  const handleRowUpdate = (idx, field, val) => {
    if (!genRows) return;
    const next = [...genRows];
    const r = { ...next[idx] };
    r.inp = { ...r.inp, [field]: val === '' ? 0 : +val };
    r.c = computeSalary(r.e, r.inp);
    next[idx] = r;
    setGenRows(next);
  };

  const handleRunCommit = () => {
    if (!genRows) return;

    let step = 0;
    const updateModalProgress = (s) => {
      const txt = document.getElementById('gp_txt');
      const bar = document.getElementById('gp_bar');
      if (txt) txt.textContent = `Step ${s + 1}/${WF.length}: ${WF[s]}`;
      if (bar) bar.style.width = `${((s + 1) / WF.length) * 100}%`;
    };

    showModal({
      title: 'Generating Payroll…',
      size: 'sm',
      body: (
        <div>
          <div id="gp_txt" style={{ fontWeight: 700, marginBottom: 10 }}>
            Starting…
          </div>
          <div className="prog" style={{ height: 12 }}>
            <div id="gp_bar" style={{ width: '0%', background: 'var(--primary)' }}></div>
          </div>
        </div>
      )
    });

    const timer = setInterval(() => {
      if (step >= WF.length) {
        clearInterval(timer);
        closeModal();

        const pid = 'PR-' + selectedYm;
        let runObj = db.payrolls.find((p) => p.payroll_id === pid);
        const nextPayrolls = [...db.payrolls];

        if (!runObj) {
          runObj = {
            payroll_id: pid,
            payroll_month: selectedYm,
            generated_date: TODAY,
            status: 'Generated',
            generated_by: 'HR Admin'
          };
          nextPayrolls.push(runObj);
        } else {
          runObj = { ...runObj, generated_date: TODAY, status: 'Generated' };
          const pIdx = nextPayrolls.findIndex((p) => p.payroll_id === pid);
          if (pIdx >= 0) nextPayrolls[pIdx] = runObj;
        }

        const nextItems = [...db.payroll_items];
        genRows.forEach((r) => {
          const idx = nextItems.findIndex(
            (i) => i.payroll_id === pid && i.employee_id === r.e.employee_id
          );
          const old = nextItems[idx];
          const it = makeItem(
            pid,
            r.e,
            r.c,
            old ? old.payment_status : 'Pending',
            old ? old.paid_date : ''
          );
          if (idx >= 0) nextItems[idx] = it;
          else nextItems.push(it);
        });

        saveDb({ ...db, payrolls: nextPayrolls, payroll_items: nextItems });
        logActivity(`Payroll for ${ymLabel(selectedYm)} generated (${genRows.length} employees)`, 'payroll');
        addToast('Payroll generated successfully ✔');
        navigate(`/payroll-run/${pid}`);
        return;
      }

      updateModalProgress(step);
      step++;
    }, 150);
  };

  const getWfValues = () => {
    if (!genRows || !genRows.length) return WF.map(() => '—');
    const s = (k) => genRows.reduce((acc, r) => acc + (r.c[k] || 0), 0);
    const n = genRows.length;
    return [
      `${n} employees`,
      `${n} structures`,
      `${db.attendance.filter((a) => a.attendance_date.startsWith(selectedYm)).length} records`,
      `${
        db.leaves.filter(
          (l) =>
            l.status === 'Approved' &&
            (l.from_date.startsWith(selectedYm) || l.to_date.startsWith(selectedYm))
        ).length
      } approved`,
      `${genRows[0].c.working_days} days`,
      `${num(s('present_days'))} days`,
      `${num(s('paid_leave'))} days`,
      `${num(s('unpaid_leave'))} days`,
      '- ' + inr(s('late_deduction')),
      inr(s('overtime_amount')),
      inr(s('bonus') + s('incentive')),
      inr(s('gross_salary')),
      '- ' + inr(s('pf') + s('esi') + s('professional_tax') + s('tds')),
      '- ' + inr(s('other_deduction') + s('advance_salary')),
      inr(s('net_salary')),
      'Ready',
      'Ready'
    ];
  };

  const ex = db.payrolls.find((p) => p.payroll_month === selectedYm);

  return (
    <>
      <div className="ph">
        <div>
          <h2>Generate Payroll</h2>
          <p>Attendance-based automatic salary calculation</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filters">
          <div className="f">
            <label>Month</label>
            <select value={monthVal} onChange={(e) => setMonthVal(+e.target.value)}>
              {MONTHS.map((m, idx) => (
                <option key={idx} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="f">
            <label>Year</label>
            <select value={yearVal} onChange={(e) => setYearVal(+e.target.value)}>
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
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
            <label>Employee</label>
            <select value={empFilter} onChange={(e) => setEmpFilter(e.target.value)}>
              <option value="">All Employees</option>
              {db.employees.map((e) => (
                <option key={e.employee_id} value={e.employee_id}>
                  {e.employee_name} ({e.employee_id})
                </option>
              ))}
            </select>
          </div>

          <div className="f">
            <label>&nbsp;</label>
            <button className="btn lg" onClick={() => handleCalculate()}>
              <Icon name="refresh" size={16} /> Calculate Salary
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Payroll Workflow</h3>
        <WorkflowSteps vals={getWfValues()} />
      </div>

      {genRows ? (
        <>
          {ex && (
            <div className="info">
              Existing payroll {ex.payroll_id} found — saving will update the selected employees.
            </div>
          )}

          <div className="grid g4" style={{ marginBottom: 16 }}>
            <div className="card stat">
              <div className="ico blue">
                <Icon name="users" size={22} />
              </div>
              <div>
                <div className="v">{genRows.length}</div>
                <div className="l">Employees</div>
                <div className="s">{ymLabel(selectedYm)}</div>
              </div>
            </div>

            <div className="card stat">
              <div className="ico teal">
                <Icon name="card" size={22} />
              </div>
              <div>
                <div className="v">
                  {inr(genRows.reduce((a, r) => a + r.c.gross_salary, 0))}
                </div>
                <div className="l">Total Gross</div>
                <div className="s">Earned + OT + bonus</div>
              </div>
            </div>

            <div className="card stat">
              <div className="ico amber">
                <Icon name="file" size={22} />
              </div>
              <div>
                <div className="v">
                  {inr(genRows.reduce((a, r) => a + r.c.total_deduction, 0))}
                </div>
                <div className="l">Total Deductions</div>
              </div>
            </div>

            <div className="card stat">
              <div className="ico green">
                <Icon name="check" size={22} />
              </div>
              <div>
                <div className="v">
                  {inr(genRows.reduce((a, r) => a + r.c.net_salary, 0))}
                </div>
                <div className="l">Total Net Payable</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>
              Salary Calculation — {ymLabel(selectedYm)} <span className="sp"></span>
              <span className="muted sm">Edit highlighted fields — salary recalculates instantly</span>
            </h3>

            <div className="tw">
              <table className="tbl" style={{ minWidth: 1750 }}>
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Employee</th>
                    <th className="num">Working Days</th>
                    <th className="num">Present Days</th>
                    <th className="num">Paid Leave</th>
                    <th className="num">Unpaid Leave</th>
                    <th className="num">Basic Salary</th>
                    <th className="num">Allowances</th>
                    <th className="num">Overtime</th>
                    <th className="num">Bonus</th>
                    <th className="num">Gross Salary</th>
                    <th className="num">PF</th>
                    <th className="num">ESI</th>
                    <th className="num">Tax</th>
                    <th className="num">Other Deduction</th>
                    <th className="num">Net Salary</th>
                    <th>Payroll Status</th>
                    <th>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {genRows.map((r, i) => (
                    <tr key={r.e.employee_id}>
                      <td>{r.e.employee_id}</td>
                      <td>
                        <b>{r.e.employee_name}</b>
                      </td>
                      <td className="num">{r.c.working_days}</td>
                      <td className="num">
                        <input
                          className="mini"
                          type="number"
                          step="0.5"
                          min="0"
                          value={r.inp.present_days}
                          onChange={(evt) => handleRowUpdate(i, 'present_days', evt.target.value)}
                        />
                      </td>
                      <td className="num">
                        <input
                          className="mini"
                          type="number"
                          step="0.5"
                          min="0"
                          value={r.inp.paid_leave}
                          onChange={(evt) => handleRowUpdate(i, 'paid_leave', evt.target.value)}
                        />
                      </td>
                      <td className="num">{num(r.c.unpaid_leave)}</td>
                      <td className="num">{inr(r.c.basic_salary)}</td>
                      <td className="num">{inr(r.c.allowances)}</td>
                      <td className="num">
                        <input
                          className="mini"
                          type="number"
                          step="0.5"
                          min="0"
                          value={r.inp.overtime_hours}
                          onChange={(evt) => handleRowUpdate(i, 'overtime_hours', evt.target.value)}
                        />{' '}
                        h
                        <div className="muted sm">{inr(r.c.overtime_amount)}</div>
                      </td>
                      <td className="num">
                        <input
                          className="mini"
                          type="number"
                          min="0"
                          value={r.inp.bonus}
                          onChange={(evt) => handleRowUpdate(i, 'bonus', evt.target.value)}
                        />
                      </td>
                      <td className="num">{inr(r.c.gross_salary)}</td>
                      <td className="num">{inr(r.c.pf)}</td>
                      <td className="num">{inr(r.c.esi)}</td>
                      <td className="num">{inr(r.c.professional_tax + r.c.tds)}</td>
                      <td className="num">
                        <input
                          className="mini"
                          type="number"
                          min="0"
                          value={r.inp.other_deduction}
                          onChange={(evt) => handleRowUpdate(i, 'other_deduction', evt.target.value)}
                        />
                        <div className="muted sm">
                          + {inr(r.c.advance_salary + r.c.late_deduction)} adv/late
                        </div>
                      </td>
                      <td className="num" style={{ fontWeight: 800 }}>
                        <span className={r.c.net_salary < 0 ? 'neg' : ''}>
                          {inr(r.c.net_salary)}
                        </span>
                      </td>
                      <td>
                        <Badge t={r.old ? ex.status : 'Calculated'} />
                      </td>
                      <td>
                        <Badge t={r.old ? r.old.payment_status : 'Pending'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="acts" style={{ marginTop: 16 }}>
              <button className="btn lg ok" onClick={handleRunCommit}>
                <Icon name="zap" size={17} /> Generate Payroll
              </button>
              <button className="btn sec" onClick={() => handleCalculate()}>
                <Icon name="refresh" size={15} /> Reset to Attendance Values
              </button>
            </div>
          </div>
        </>
      ) : (
        <div id="gen-out">
          <div className="card empty muted" style={{ textAlign: 'center', padding: 40 }}>
            Select month / department / employee and click <b>Calculate Salary</b> to see the
            attendance-based salary calculation.
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Payroll Run ---------- */
export function PayrollRun() {
  const { pid } = useParams();
  const navigate = useNavigate();
  const { db, saveDb, addToast, confirmBox, logActivity } = useHR();

  const runObj = db.payrolls.find((p) => p.payroll_id === pid);
  if (!runObj) return <PayrollHistory />;

  const items = runItems(db, pid);
  const T = totalsOf(items);
  const fin = runObj.status === 'Finalized';

  const handlePayOne = (itemId) => {
    const nextItems = db.payroll_items.map((i) =>
      i.payroll_item_id === itemId ? { ...i, payment_status: 'Paid', paid_date: TODAY } : i
    );
    const targetItem = items.find((i) => i.payroll_item_id === itemId);
    saveDb({ ...db, payroll_items: nextItems });
    if (targetItem) {
      logActivity(`Salary paid to ${targetItem.employee_name} (${ymLabel(pid.slice(3))})`, 'payroll');
      addToast(`Paid ${inr(targetItem.net_salary)} to ${targetItem.employee_name}`);
    }
  };

  const handlePayAll = () => {
    const pendingItems = items.filter((i) => i.payment_status === 'Pending');
    if (!pendingItems.length) {
      addToast('All salaries already paid', 'info');
      return;
    }

    confirmBox(
      `Mark ${pendingItems.length} pending salaries (${inr(
        pendingItems.reduce((a, i) => a + i.net_salary, 0)
      )}) as paid?`,
      () => {
        const nextItems = db.payroll_items.map((i) =>
          i.payroll_id === pid ? { ...i, payment_status: 'Paid', paid_date: TODAY } : i
        );
        saveDb({ ...db, payroll_items: nextItems });
        logActivity(`All pending salaries paid for ${ymLabel(pid.slice(3))}`, 'payroll');
        addToast('All salaries marked as paid ✔');
      },
      'Mark Paid'
    );
  };

  const handleFinalize = () => {
    confirmBox(
      'Finalize this payroll? It will be locked and cannot be edited.',
      () => {
        const nextRuns = db.payrolls.map((p) =>
          p.payroll_id === pid ? { ...p, status: 'Finalized' } : p
        );
        saveDb({ ...db, payrolls: nextRuns });
        addToast('Payroll finalized & locked');
      },
      'Finalize'
    );
  };

  const cols = [
    { h: 'Emp ID', f: (i) => i.employee_id },
    {
      h: 'Employee',
      f: (i) => (
        <div>
          <b>{i.employee_name}</b>
          <div className="muted sm">{deptName(db, i.department_id)}</div>
        </div>
      )
    },
    { h: 'Paid Days', cls: 'num', f: (i) => `${i.paid_days}/${i.working_days}` },
    { h: 'Gross', cls: 'num', f: (i) => inr(i.gross_salary) },
    { h: 'Deduction', cls: 'num', f: (i) => inr(i.total_deduction) },
    { h: 'Net Salary', cls: 'num', f: (i) => <b>{inr(i.net_salary)}</b> },
    {
      h: 'Payment',
      f: (i) => (
        <div>
          <Badge t={i.payment_status} />
          {i.paid_date && <div className="muted sm">{fmtD(i.paid_date)}</div>}
        </div>
      )
    },
    {
      h: 'Actions',
      f: (i) => (
        <div className="acts">
          <button
            className="btn xs sec"
            onClick={() => navigate(`/payroll-details/${pid}/${i.employee_id}`)}
          >
            <Icon name="eye" size={13} /> Details
          </button>
          <button
            className="btn xs sec"
            onClick={() => navigate(`/payslip/${pid}/${i.employee_id}`)}
          >
            <Icon name="file" size={13} /> Payslip
          </button>
          {i.payment_status === 'Pending' && (
            <button className="btn xs ok" onClick={() => handlePayOne(i.payroll_item_id)}>
              Pay
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <div className="ph">
        <div>
          <h2>Payroll {pid}</h2>
          <p>
            {ymLabel(runObj.payroll_month)} • Generated {fmtD(runObj.generated_date)} by{' '}
            {runObj.generated_by}
          </p>
        </div>
        <div className="acts noprint">
          <button className="btn sec" onClick={() => navigate('/payroll-history')}>
            ← History
          </button>
          {!fin && (
            <>
              <button
                className="btn out"
                onClick={() => navigate(`/payroll-generate/${pid}`)}
              >
                <Icon name="edit" size={15} /> Edit
              </button>
              <button className="btn out" onClick={handleFinalize}>
                <Icon name="check" size={15} /> Finalize
              </button>
            </>
          )}
          <button className="btn ok" onClick={handlePayAll}>
            <Icon name="card" size={15} /> Mark All Paid
          </button>
          <button className="btn" onClick={() => window.print()}>
            <Icon name="printer" size={15} /> Print
          </button>
        </div>
      </div>

      <div className="grid g4">
        <div className="card stat">
          <div className="ico blue">
            <Icon name="users" size={22} />
          </div>
          <div>
            <div className="v">{T.count}</div>
            <div className="l">Employees</div>
            <div className="s">
              <Badge t={runObj.status} />
            </div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico teal">
            <Icon name="card" size={22} />
          </div>
          <div>
            <div className="v">{inr(T.gross)}</div>
            <div className="l">Gross Salary</div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico amber">
            <Icon name="file" size={22} />
          </div>
          <div>
            <div className="v">{inr(T.ded)}</div>
            <div className="l">Total Deduction</div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico green">
            <Icon name="check" size={22} />
          </div>
          <div>
            <div className="v">{inr(T.net)}</div>
            <div className="l">Net Payroll</div>
            <div className="s">Payment: {T.pay}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <DataTable rows={items} cols={cols} minw={1000} size={10} />
      </div>
    </>
  );
}

/* ---------- Payroll History ---------- */
export function PayrollHistory() {
  const { db, addToast } = useHR();
  const navigate = useNavigate();

  const sortedPayrolls = [...db.payrolls].sort((a, b) =>
    b.payroll_month.localeCompare(a.payroll_month)
  );

  const cols = [
    { h: 'Payroll ID', f: (p) => <b>{p.payroll_id}</b> },
    { h: 'Month', f: (p) => ymLabel(p.payroll_month) },
    { h: 'Employees', cls: 'ctr', f: (p) => runTotals(db, p.payroll_id).count },
    { h: 'Gross Salary', cls: 'num', f: (p) => inr(runTotals(db, p.payroll_id).gross) },
    { h: 'Total Deduction', cls: 'num', f: (p) => inr(runTotals(db, p.payroll_id).ded) },
    { h: 'Net Payroll', cls: 'num', f: (p) => <b>{inr(runTotals(db, p.payroll_id).net)}</b> },
    { h: 'Generated', f: (p) => fmtD(p.generated_date) },
    { h: 'Status', f: (p) => <Badge t={p.status} /> },
    { h: 'Payment', f: (p) => <Badge t={runTotals(db, p.payroll_id).pay} /> },
    {
      h: 'Actions',
      f: (p) => (
        <div className="acts">
          <button
            className="btn xs sec"
            title="View"
            onClick={() => navigate(`/payroll-run/${p.payroll_id}`)}
          >
            <Icon name="eye" size={13} />
          </button>
          <button
            className="btn xs sec"
            title="Edit"
            onClick={() => {
              if (p.status === 'Finalized') {
                addToast('Finalized payroll is locked', 'err');
              } else {
                navigate(`/payroll-generate/${p.payroll_id}`);
              }
            }}
          >
            <Icon name="edit" size={13} />
          </button>
          <button
            className="btn xs sec"
            title="Print"
            onClick={() => {
              navigate(`/payroll-run/${p.payroll_id}`);
              setTimeout(() => window.print(), 500);
            }}
          >
            <Icon name="printer" size={13} />
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="ph">
        <div>
          <h2>Payroll History</h2>
          <p>All generated payroll runs</p>
        </div>
        <div className="acts noprint">
          <button className="btn" onClick={() => navigate('/payroll-generate')}>
            <Icon name="zap" size={15} /> Generate Payroll
          </button>
        </div>
      </div>

      <div className="card">
        <DataTable rows={sortedPayrolls} cols={cols} minw={1100} size={8} />
      </div>
    </>
  );
}

/* ---------- Payroll Details ---------- */
export function PayrollDetails() {
  const { pid, eid } = useParams();
  const navigate = useNavigate();
  const { db, saveDb, addToast, showModal, closeModal } = useHR();

  const item = db.payroll_items.find(
    (x) => x.payroll_id === pid && x.employee_id === eid
  );

  if (!item) return <PayrollHistory />;

  const eObj = emp(db, eid) || {};
  const runObj = db.payrolls.find((p) => p.payroll_id === pid);
  const items = runItems(db, pid);
  const ix = items.findIndex((x) => x.employee_id === eid);

  const handleAdjustModal = () => {
    const AdjustForm = () => {
      const [presentDays, setPresentDays] = useState(item.present_days);
      const [paidLeave, setPaidLeave] = useState(item.paid_leave);
      const [otHours, setOtHours] = useState(item.overtime_hours);
      const [lateDays, setLateDays] = useState(item.late_days);
      const [bonus, setBonus] = useState(item.bonus);
      const [incentive, setIncentive] = useState(item.incentive);
      const [otherDed, setOtherDed] = useState(item.other_deduction);

      const handleSubmit = (evt) => {
        evt.preventDefault();
        const nextCalc = computeSalary(eObj, {
          working_days: item.working_days,
          present_days: +presentDays || 0,
          paid_leave: +paidLeave || 0,
          overtime_hours: +otHours || 0,
          late_days: +lateDays || 0,
          bonus: +bonus || 0,
          incentive: +incentive || 0,
          other_deduction: +otherDed || 0
        });

        const nextItems = db.payroll_items.map((x) =>
          x.payroll_item_id === item.payroll_item_id ? { ...x, ...nextCalc } : x
        );

        saveDb({ ...db, payroll_items: nextItems });
        addToast('Payroll line recalculated ✔');
        closeModal();
      };

      return (
        <form id="adjForm" className="fgrid" onSubmit={handleSubmit}>
          <div className="fg">
            <label>Present Days</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={presentDays}
              onChange={(e) => setPresentDays(e.target.value)}
            />
          </div>
          <div className="fg">
            <label>Paid Leave</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={paidLeave}
              onChange={(e) => setPaidLeave(e.target.value)}
            />
          </div>
          <div className="fg">
            <label>Overtime Hours</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={otHours}
              onChange={(e) => setOtHours(e.target.value)}
            />
          </div>
          <div className="fg">
            <label>Late Marks</label>
            <input
              type="number"
              min="0"
              value={lateDays}
              onChange={(e) => setLateDays(e.target.value)}
            />
          </div>
          <div className="fg">
            <label>Bonus (₹)</label>
            <input
              type="number"
              min="0"
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
            />
          </div>
          <div className="fg">
            <label>Incentive (₹)</label>
            <input
              type="number"
              min="0"
              value={incentive}
              onChange={(e) => setIncentive(e.target.value)}
            />
          </div>
          <div className="fg full">
            <label>Other Deduction (₹)</label>
            <input
              type="number"
              min="0"
              value={otherDed}
              onChange={(e) => setOtherDed(e.target.value)}
            />
          </div>
        </form>
      );
    };

    showModal({
      title: `Adjust Payroll — ${item.employee_name}`,
      size: 'sm',
      body: <AdjustForm />,
      footer: (
        <>
          <button className="btn sec" onClick={closeModal}>
            Cancel
          </button>
          <button className="btn" onClick={() => document.getElementById('adjForm')?.requestSubmit()}>
            Save Adjustments
          </button>
        </>
      )
    });
  };

  return (
    <>
      <div className="ph">
        <div>
          <h2>Payroll Details — {item.employee_name}</h2>
          <p>
            {ymLabel(pid.slice(3))} • {pid}
          </p>
        </div>
        <div className="acts noprint">
          <button className="btn sec" onClick={() => navigate(`/payroll-run/${pid}`)}>
            ← Payroll run
          </button>

          {ix > 0 && (
            <button
              className="btn sec"
              onClick={() => navigate(`/payroll-details/${pid}/${items[ix - 1].employee_id}`)}
            >
              ‹ Prev
            </button>
          )}

          {ix < items.length - 1 && (
            <button
              className="btn sec"
              onClick={() => navigate(`/payroll-details/${pid}/${items[ix + 1].employee_id}`)}
            >
              Next ›
            </button>
          )}

          {runObj?.status !== 'Finalized' && (
            <button className="btn out" onClick={handleAdjustModal}>
              <Icon name="edit" size={15} /> Adjust
            </button>
          )}

          <button className="btn" onClick={() => navigate(`/payslip/${pid}/${eid}`)}>
            <Icon name="file" size={15} /> Payslip
          </button>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <h3>Employee Information</h3>
          <div className="ecell" style={{ marginBottom: 14 }}>
            <div
              className="av"
              style={{
                width: 52,
                height: 52,
                fontSize: 18,
                background: `hsl(${[...item.employee_name].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 55%, 45%)`
              }}
            >
              {item.employee_name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <b>{item.employee_name}</b>
              <small>
                {eid} • {desigName(db, item.designation_id)}
              </small>
            </div>
          </div>

          <div className="kv">
            <div>
              <small>Department</small>
              <span>{deptName(db, item.department_id)}</span>
            </div>
            <div>
              <small>Joining Date</small>
              <span>{fmtD(eObj.joining_date)}</span>
            </div>
            <div>
              <small>Bank Account</small>
              <span>{eObj.bank_account || '—'}</span>
            </div>
            <div>
              <small>IFSC</small>
              <span>{eObj.ifsc || '—'}</span>
            </div>
            <div>
              <small>PAN</small>
              <span>{eObj.pan || '—'}</span>
            </div>
            <div>
              <small>Payment Status</small>
              <span>
                <Badge t={item.payment_status} />
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Attendance Summary</h3>
          <div className="kv">
            <div>
              <small>Working Days</small>
              <span>{item.working_days}</span>
            </div>
            <div>
              <small>Present Days</small>
              <span>{item.present_days}</span>
            </div>
            <div>
              <small>Paid Leave</small>
              <span>{item.paid_leave}</span>
            </div>
            <div>
              <small>Unpaid Leave</small>
              <span>{item.unpaid_leave}</span>
            </div>
            <div>
              <small>Paid Days</small>
              <span>{item.paid_days}</span>
            </div>
            <div>
              <small>Overtime Hours</small>
              <span>{item.overtime_hours} hrs</span>
            </div>
            <div>
              <small>Late Marks</small>
              <span>{item.late_days}</span>
            </div>
          </div>
          <div className="prog" style={{ marginTop: 14 }}>
            <div
              style={{
                width: `${(item.paid_days / item.working_days) * 100}%`,
                background: 'var(--green)'
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <h3 className="pos">Earnings</h3>
          {[
            ['Basic Salary', item.basic_salary],
            ['HRA', item.hra],
            ['Conveyance & Medical', item.conveyance_allowance + item.medical_allowance],
            ['Special Allowance', item.special_allowance],
            ['Overtime', item.overtime_amount],
            ['Bonus', item.bonus],
            ['Incentive', item.incentive]
          ].map(([lbl, val]) => (
            <div key={lbl} className="row">
              <span>{lbl}</span>
              <b>{inr(val)}</b>
            </div>
          ))}
          <div className="row tot">
            <span>Gross Salary</span>
            <span>{inr(item.gross_salary)}</span>
          </div>
        </div>

        <div className="card">
          <h3 className="neg">Deductions</h3>
          {[
            ['PF', item.pf],
            ['ESI', item.esi],
            ['Professional Tax', item.professional_tax],
            ['TDS', item.tds],
            ['Advance Salary', item.advance_salary],
            ['Late Deduction', item.late_deduction],
            ['Other Deduction', item.other_deduction]
          ].map(([lbl, val]) => (
            <div key={lbl} className="row">
              <span>{lbl}</span>
              <b>{inr(val)}</b>
            </div>
          ))}
          <div className="row tot">
            <span>Total Deduction</span>
            <span className="neg">{inr(item.total_deduction)}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ background: 'var(--primary-l)' }}>
        <div className="row" style={{ border: 'none', fontSize: 15 }}>
          <span>Gross Salary</span>
          <b>{inr(item.gross_salary)}</b>
        </div>
        <div className="row" style={{ border: 'none', fontSize: 15 }}>
          <span>Total Deduction</span>
          <b className="neg">- {inr(item.total_deduction)}</b>
        </div>
        <div className="row tot" style={{ fontSize: 22 }}>
          <span>NET SALARY</span>
          <span className="pos">{inr(item.net_salary)}</span>
        </div>
      </div>
    </>
  );
}

/* ---------- Salary Calculation Playground ---------- */
export function SalaryCalculation() {
  const { db } = useHR();

  const [empId, setEmpId] = useState('');
  const [grossSal, setGrossSal] = useState(30000);
  const [workingDays, setWorkingDays] = useState(26);
  const [presentDays, setPresentDays] = useState(24);
  const [otHours, setOtHours] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [lateMarks, setLateMarks] = useState(0);
  const [otherDed, setOtherDed] = useState(0);

  const handleEmpSelect = (id) => {
    setEmpId(id);
    if (id) {
      const eObj = emp(db, id);
      if (eObj && eObj.salary_structure) {
        setGrossSal(grossOf(eObj.salary_structure));
      }
    }
  };

  let S;
  if (empId) {
    S = emp(db, empId)?.salary_structure;
  }
  if (!S) {
    const sal = +grossSal || 0;
    const b = Math.round(sal * 0.5);
    const h = Math.round(sal * 0.2);
    S = {
      basic_salary: b,
      hra: h,
      conveyance_allowance: 1600,
      medical_allowance: 1250,
      special_allowance: Math.max(0, sal - b - h - 2850),
      bonus: 0,
      incentive: 0,
      advance_salary: 0,
      other_deduction: 0
    };
  }

  const wd = Math.max(1, +workingDays || 1);
  const pd = +presentDays || 0;
  const calc = computeSalary(
    { salary_structure: S },
    {
      working_days: wd,
      present_days: pd,
      paid_leave: 0,
      overtime_hours: +otHours || 0,
      late_days: +lateMarks || 0,
      bonus: +bonus || 0,
      incentive: 0,
      other_deduction: +otherDed || 0
    }
  );

  const gm = grossOf(S);

  return (
    <>
      <div className="ph">
        <div>
          <h2>Salary Calculation</h2>
          <p>Interactive attendance-based salary calculator</p>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <h3>Inputs</h3>
          <div className="fgrid">
            <div className="fg full">
              <label>Load from Employee (optional)</label>
              <select value={empId} onChange={(e) => handleEmpSelect(e.target.value)}>
                <option value="">Custom salary</option>
                {activeEmps(db).map((e) => (
                  <option key={e.employee_id} value={e.employee_id}>
                    {e.employee_name} ({e.employee_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="fg">
              <label>Monthly Salary (Gross ₹)</label>
              <input
                type="number"
                min="0"
                value={grossSal}
                onChange={(e) => setGrossSal(e.target.value)}
              />
            </div>

            <div className="fg">
              <label>Working Days</label>
              <input
                type="number"
                min="1"
                value={workingDays}
                onChange={(e) => setWorkingDays(e.target.value)}
              />
            </div>

            <div className="fg">
              <label>Present + Paid Leave Days (Paid Days)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={presentDays}
                onChange={(e) => setPresentDays(e.target.value)}
              />
            </div>

            <div className="fg">
              <label>Overtime Hours</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={otHours}
                onChange={(e) => setOtHours(e.target.value)}
              />
            </div>

            <div className="fg">
              <label>Bonus / Incentive ₹</label>
              <input
                type="number"
                min="0"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
              />
            </div>

            <div className="fg">
              <label>Late Marks</label>
              <input
                type="number"
                min="0"
                value={lateMarks}
                onChange={(e) => setLateMarks(e.target.value)}
              />
            </div>

            <div className="fg full">
              <label>Other Deduction ₹</label>
              <input
                type="number"
                min="0"
                value={otherDed}
                onChange={(e) => setOtherDed(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Result</h3>
          <div>
            <div className="row">
              <span>
                Per Day Salary ({inr(gm)} ÷ {wd})
              </span>
              <b>{inr(gm / wd)}</b>
            </div>
            <div className="row">
              <span>
                Earned Salary (per day × {Math.min(pd, wd)} days)
              </span>
              <b>{inr((gm / wd) * Math.min(pd, wd))}</b>
            </div>
            <div className="row">
              <span>Basic (earned)</span>
              <b>{inr(calc.basic_salary)}</b>
            </div>
            <div className="row">
              <span>Allowances (earned)</span>
              <b>{inr(calc.allowances)}</b>
            </div>
            <div className="row">
              <span>Overtime</span>
              <b>{inr(calc.overtime_amount)}</b>
            </div>
            <div className="row">
              <span>Bonus</span>
              <b>{inr(calc.bonus)}</b>
            </div>
            <div className="row tot">
              <span>Gross Earned Salary</span>
              <span>{inr(calc.gross_salary)}</span>
            </div>

            <div className="row">
              <span>PF</span>
              <span className="neg">- {inr(calc.pf)}</span>
            </div>
            <div className="row">
              <span>ESI</span>
              <span className="neg">- {inr(calc.esi)}</span>
            </div>
            <div className="row">
              <span>Professional Tax</span>
              <span className="neg">- {inr(calc.professional_tax)}</span>
            </div>
            <div className="row">
              <span>TDS</span>
              <span className="neg">- {inr(calc.tds)}</span>
            </div>
            <div className="row">
              <span>Late Deduction</span>
              <span className="neg">- {inr(calc.late_deduction)}</span>
            </div>
            <div className="row">
              <span>Other Deduction</span>
              <span className="neg">- {inr(calc.other_deduction + calc.advance_salary)}</span>
            </div>
            <div className="row tot">
              <span>Total Deduction</span>
              <span className="neg">{inr(calc.total_deduction)}</span>
            </div>
            <div className="row tot" style={{ fontSize: 20 }}>
              <span>NET SALARY</span>
              <span className="pos">{inr(calc.net_salary)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
