import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  useHR,
  activeEmps,
  dashDate,
  fmtD,
  inr,
  ymLabel,
  runTotals,
  runItems,
  totalsOf,
  isWorking,
  parse,
  addD,
  ymd,
  emp,
  t12,
  BC,
  esc,
  ICONS
} from '../store';
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

export default function Dashboard() {
  const { db } = useHR();
  const navigate = useNavigate();

  const dd = dashDate(db);
  const activeList = activeEmps(db);
  const ids = new Set(activeList.map((e) => e.employee_id));
  const recs = db.attendance.filter((a) => a.attendance_date === dd && ids.has(a.employee_id));
  const c = (s) => recs.filter((a) => a.attendance_status === s).length;

  const present = c('Present') + c('Half Day');
  const absent = c('Absent');
  const leave = c('Paid Leave') + c('Unpaid Leave');
  const late = recs.filter((a) => a.late_minutes > 0).length;

  const runs = [...db.payrolls].sort((a, b) => b.payroll_month.localeCompare(a.payroll_month));
  const last = runs[0];
  const T = last ? runTotals(db, last.payroll_id) : totalsOf([]);

  const days = [];
  for (let d = parse(dd), k = 0; days.length < 7 && k < 40; d = addD(d, -1), k++) {
    const ds = ymd(d);
    if (!isWorking(db, ds)) continue;
    const rs = db.attendance.filter((a) => a.attendance_date === ds && ids.has(a.employee_id));
    if (!rs.length) continue;
    days.unshift({
      ds,
      p: rs.filter((a) => ['Present', 'Half Day'].includes(a.attendance_status)).length,
      a: rs.filter((a) => a.attendance_status === 'Absent').length,
      l: rs.filter((a) => ['Paid Leave', 'Unpaid Leave'].includes(a.attendance_status)).length
    });
  }

  const pr = runs
    .slice(0, 6)
    .reverse()
    .map((r) => ({
      m: ymLabel(r.payroll_month).slice(0, 3) + " '" + r.payroll_month.slice(2, 4),
      t: runTotals(db, r.payroll_id)
    }));

  const recAtt = recs
    .filter((a) => a.check_in)
    .sort((a, b) => b.check_in.localeCompare(a.check_in))
    .slice(0, 6);

  const lv = [...db.leaves].sort((a, b) => b.applied_on.localeCompare(a.applied_on)).slice(0, 5);
  const act = [...db.activity].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 6);

  return (
    <>
      <div className="ph">
        <div>
          <h2>Welcome back, HR Admin 👋</h2>
          <p>
            Overview for {fmtD(dd)}
            {dd !== ymd(new Date()) ? ' (last working day)' : ''}
          </p>
        </div>
        <div className="acts noprint">
          <button className="btn" onClick={() => navigate('/payroll-generate')}>
            <Icon name="zap" size={16} /> Generate Payroll
          </button>
        </div>
      </div>

      <div className="grid g4">
        <div className="card stat">
          <div className="ico blue">
            <Icon name="users" size={22} />
          </div>
          <div>
            <div className="v">{activeList.length}</div>
            <div className="l">Total Employees</div>
            <div className="s">{db.employees.length - activeList.length} inactive</div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico green">
            <Icon name="userCheck" size={22} />
          </div>
          <div>
            <div className="v">{present}</div>
            <div className="l">Present Today</div>
            <div className="s">of {recs.length} marked</div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico red">
            <Icon name="x" size={22} />
          </div>
          <div>
            <div className="v">{absent}</div>
            <div className="l">Absent Today</div>
            <div className="s">Unapproved absence</div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico purple">
            <Icon name="calendar" size={22} />
          </div>
          <div>
            <div className="v">{leave}</div>
            <div className="l">On Leave</div>
            <div className="s">Approved leave</div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico amber">
            <Icon name="clock" size={22} />
          </div>
          <div>
            <div className="v">{late}</div>
            <div className="l">Late Employees</div>
            <div className="s">Beyond grace time</div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico teal">
            <Icon name="card" size={22} />
          </div>
          <div>
            <div className="v">{inr(T.net)}</div>
            <div className="l">Total Payroll</div>
            <div className="s">{last ? ymLabel(last.payroll_month) + ' (net)' : '—'}</div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico amber">
            <Icon name="file" size={22} />
          </div>
          <div>
            <div className="v">{inr(T.pending)}</div>
            <div className="l">Pending Payroll</div>
            <div className="s">
              {runItems(db, last ? last.payroll_id : '').filter((i) => i.payment_status === 'Pending').length} payments pending
            </div>
          </div>
        </div>

        <div className="card stat">
          <div className="ico green">
            <Icon name="check" size={22} />
          </div>
          <div>
            <div className="v">{inr(T.paid)}</div>
            <div className="l">Paid Payroll</div>
            <div className="s">{T.net ? Math.round((T.paid / T.net) * 100) : 0}% disbursed</div>
          </div>
        </div>
      </div>

      <div className="grid g21">
        <div className="card">
          <h3>
            Attendance Overview <span className="sp"></span>
            <span className="muted sm">Last {days.length} working days</span>
          </h3>
          <BarChart
            labels={days.map((x) => fmtD(x.ds).slice(0, 6))}
            series={[
              { name: 'Present', color: '#16a34a', values: days.map((x) => x.p) },
              { name: 'On Leave', color: '#2563eb', values: days.map((x) => x.l) },
              { name: 'Absent', color: '#dc2626', values: days.map((x) => x.a) }
            ]}
            options={{ stacked: true }}
          />
        </div>

        <div className="card">
          <h3>Monthly Payroll</h3>
          <BarChart
            labels={pr.map((x) => x.m)}
            series={[
              { name: 'Net Payroll', color: '#2563eb', values: pr.map((x) => x.t.net) },
              { name: 'Deductions', color: '#f59e0b', values: pr.map((x) => x.t.ded) }
            ]}
            options={{
              stacked: true,
              fmt: (v) => (v >= 1e5 ? (v / 1e5).toFixed(1) + 'L' : Math.round(v / 1e3) + 'k'),
              h: 250
            }}
          />
        </div>
      </div>

      <div className="grid g3">
        <div className="card">
          <h3>Recent Attendance</h3>
          {recAtt.length > 0 ? (
            recAtt.map((a) => {
              const eObj = emp(db, a.employee_id);
              if (!eObj) return null;
              return (
                <div key={a.attendance_id} className="row">
                  <div className="ecell">
                    <div
                      className="av"
                      style={{
                        width: 30,
                        height: 30,
                        fontSize: 11,
                        background: `hsl(${[...eObj.employee_name].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 55%, 45%)`
                      }}
                    >
                      {eObj.employee_name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <b>{eObj.employee_name}</b>
                      <small>{t12(a.check_in)}</small>
                    </div>
                  </div>
                  {a.late_minutes ? (
                    <span className="bdg amber">Late {a.late_minutes}m</span>
                  ) : (
                    <Badge t={a.attendance_status} />
                  )}
                </div>
              );
            })
          ) : (
            <div className="muted">No check-ins yet</div>
          )}
        </div>

        <div className="card">
          <h3>
            Recent Leave Requests <span className="sp"></span>
            <Link className="sm" to="/leave-requests">
              View all
            </Link>
          </h3>
          {lv.map((l) => {
            const eObj = emp(db, l.employee_id);
            return (
              <div key={l.leave_id} className="row">
                <div>
                  <b>{eObj ? eObj.employee_name : l.employee_id}</b>
                  <div className="muted sm">
                    {l.leave_type} • {l.leave_days}d • {fmtD(l.from_date)}
                  </div>
                </div>
                <Badge t={l.status} />
              </div>
            );
          })}
        </div>

        <div className="card">
          <h3>Recent Payroll Activity</h3>
          {act.map((a, idx) => (
            <div key={idx} className="row">
              <div>
                {a.text}
                <div className="muted sm">{fmtD(a.ts.slice(0, 10))}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
