"""Genera lib/agegrade-data.js dalle tabelle ufficiali USATF MLDR 2025 (Alan Jones).
Fonte: https://github.com/AlanLyttonJones/Age-Grade-Tables, cartella "2025 Files",
MaleRoadStd2025.xlsx e FemaleRoadStd2025.xlsx, foglio dei coefficienti per età.
Uso: python3 scripts/build-agegrade.py <cartella 2025 Files>"""
import json, sys, openpyxl

def read(path, offset):
    ws = openpyxl.load_workbook(path, data_only=True).worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    version = str(rows[0][0])
    names, dists, ocs = rows[1][1 + offset:], rows[2][1 + offset:], rows[3][1 + offset:]
    cols = [i for i, d in enumerate(dists) if isinstance(d, (int, float))]
    factors = {}
    for r in rows[5:]:
        age = r[offset]
        if not isinstance(age, (int, float)):
            continue
        factors[int(age)] = [round(float(r[1 + offset + i]), 4) for i in cols]
    return {
        'version': version,
        'distances': [
            {'name': str(names[i]).replace('MIle', 'Mile'), 'km': round(float(dists[i]), 6), 'openSec': round(float(ocs[i]), 1)}
            for i in cols
        ],
        'factors': factors,
    }

src = sys.argv[1]
data = {'M': read(f'{src}/MaleRoadStd2025.xlsx', 0), 'F': read(f'{src}/FemaleRoadStd2025.xlsx', 1)}
with open('lib/agegrade-data.js', 'w') as f:
    f.write('// GENERATO da scripts/build-agegrade.py: non modificare a mano.\n')
    f.write('// Tabelle USATF MLDR Road Age Standards 2025 (Alan Jones), approvate il 10/1/2025.\n')
    f.write('// M: ' + data['M']['version'] + '\n// F: ' + data['F']['version'] + '\n')
    f.write('export default ' + json.dumps(data, separators=(',', ':')) + ';\n')
print('età M', min(data['M']['factors']), max(data['M']['factors']), '| distanze', len(data['M']['distances']))
print('età F', min(data['F']['factors']), max(data['F']['factors']), '| distanze', len(data['F']['distances']))
