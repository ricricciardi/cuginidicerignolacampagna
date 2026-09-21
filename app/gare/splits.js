import { fmtTime } from '@/lib/format';

const fmtUpDown = (e) => (typeof e !== 'number' ? '' : Math.round(e) === 0 ? '0' : `${e < 0 ? '−' : '+'}${Math.abs(Math.round(e))}`);

// Parziali dei primi `km` km di una corsa: tempo del km (con barra: più lunga = più veloce),
// tempo progressivo e dislivello. La barra va dal 100% (km più veloce) al 40% (più lento),
// così anche differenze di pochi secondi si vedono. Il km più veloce è in lime, il più lento in rosa.
export default function Splits({ splits, km }) {
  const rows = (splits ?? []).slice(0, km);
  if (rows.length < km) return null;
  const times = rows.map((x) => x.s);
  const fast = Math.min(...times), slow = Math.max(...times);
  const hasElev = rows.some((x) => typeof x.e === 'number');
  let total = 0;
  return (
    <table className="splits">
      <thead>
        <tr>
          <th scope="col">Km</th><th scope="col" className="split">Parziale</th>
          <th scope="col">Totale</th>{hasElev && <th scope="col">Disl. m</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((x, i) => {
          total += x.s;
          const cls = fast !== slow && x.s === fast ? 'fast' : fast !== slow && x.s === slow ? 'slow' : undefined;
          return (
            <tr key={i} className={cls}>
              <th scope="row">{i + 1}</th>
              <td className="split">
                <div className="cell">
                  <span className="split-bar" style={{ '--p': fast === slow ? 1 : 1 - 0.6 * (x.s - fast) / (slow - fast) }} aria-hidden="true" />
                  <span className="t">{fmtTime(x.s)}</span>
                </div>
              </td>
              <td>{fmtTime(total)}</td>
              {hasElev && <td>{fmtUpDown(x.e)}</td>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
