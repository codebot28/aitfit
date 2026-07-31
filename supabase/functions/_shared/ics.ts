// Eenvoudige iCal/ICS-parser — haalt de events van vandaag (Europe/Amsterdam).
// Gedeeld door haalAgendaVandaag en haalRoosterVandaag.

function parseIcsDate(value?: string): { date: Date; allDay: boolean } | null {
  if (!value) return null;
  if (/^\d{8}$/.test(value)) {
    const y = +value.slice(0, 4);
    const m = +value.slice(4, 6) - 1;
    const d = +value.slice(6, 8);
    return { date: new Date(Date.UTC(y, m, d)), allDay: true };
  }
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  if (z === 'Z') {
    return { date: new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)), allDay: false };
  }
  // "Floating" tijd -> interpreteer als Europe/Amsterdam.
  return { date: new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}${amsterdamOffset()}`), allDay: false };
}

// Grove DST-bepaling voor NL: zomertijd ~ laatste zondag maart t/m laatste zondag okt.
function amsterdamOffset(): string {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  return month >= 4 && month <= 9 ? '+02:00' : '+01:00';
}

function unfold(ics: string): string {
  return ics.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
}

function parseEvents(ics: string): Record<string, string>[] {
  const unfolded = unfold(ics);
  const blocks = unfolded.split('BEGIN:VEVENT').slice(1);
  return blocks.map((b) => {
    const bodyText = b.split('END:VEVENT')[0];
    const event: Record<string, string> = {};
    bodyText.split(/\r?\n/).forEach((line) => {
      const idx = line.indexOf(':');
      if (idx < 0) return;
      const keyPart = line.slice(0, idx);
      const val = line.slice(idx + 1);
      const key = keyPart.split(';')[0];
      event[key] = val;
    });
    return event;
  });
}

function todayRangeAmsterdam() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = fmt.formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const d = parts.find((p) => p.type === 'day')!.value;
  const off = amsterdamOffset();
  return {
    start: new Date(`${y}-${m}-${d}T00:00:00${off}`),
    end: new Date(`${y}-${m}-${d}T23:59:59${off}`),
  };
}

export type IcalItem = {
  id: string;
  naam: string;
  locatie: string;
  start: string;
  eind: string;
  hele_dag: boolean;
};

// Haalt + parseert een iCal-feed en geeft de items van vandaag terug.
export async function haalIcalVandaag(url: string, prefix = 'item'): Promise<IcalItem[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iCal niet bereikbaar: ${res.status}`);
  const ics = await res.text();
  const events = parseEvents(ics);
  const { start, end } = todayRangeAmsterdam();

  return events
    .map((e) => {
      const dtStart = parseIcsDate(e.DTSTART);
      const dtEnd = parseIcsDate(e.DTEND);
      if (!dtStart) return null;
      return {
        naam: e.SUMMARY || '(geen titel)',
        locatie: (e.LOCATION || '').replace(/\\,/g, ',').replace(/\\n/g, ' '),
        start: dtStart.date,
        eind: dtEnd?.date || dtStart.date,
        hele_dag: dtStart.allDay,
      };
    })
    .filter((e): e is NonNullable<typeof e> => !!e && e.start >= start && e.start <= end)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .map((e, i) => ({
      id: `${prefix}-${i}`,
      naam: e.naam,
      locatie: e.locatie,
      start: e.start.toISOString(),
      eind: e.eind.toISOString(),
      hele_dag: e.hele_dag,
    }));
}
