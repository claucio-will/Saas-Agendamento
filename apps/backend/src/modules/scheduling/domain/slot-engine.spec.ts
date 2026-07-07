import { computeAvailableSlots, type Interval } from './slot-engine';

// Helper: cria Date a partir de "HH:MM" num dia fixo (UTC) para legibilidade.
const DAY = '2026-07-10T';
const at = (hhmm: string): Date => new Date(`${DAY}${hhmm}:00.000Z`);
const iv = (start: string, end: string): Interval => ({
  start: at(start),
  end: at(end),
});

describe('computeAvailableSlots (motor de agenda)', () => {
  const wide = { earliest: at('00:00'), latest: at('23:59') };

  it('gera slots dentro da jornada respeitando duração e passo', () => {
    const slots = computeAvailableSlots({
      workingIntervals: [iv('09:00', '10:00')],
      busyIntervals: [],
      serviceDurationMinutes: 30,
      slotIntervalMinutes: 30,
      ...wide,
    });
    expect(slots.map((s) => s.toISOString())).toEqual([
      at('09:00').toISOString(),
      at('09:30').toISOString(),
    ]);
  });

  it('não gera slot que ultrapassa o fim da jornada', () => {
    const slots = computeAvailableSlots({
      workingIntervals: [iv('09:00', '10:00')],
      busyIntervals: [],
      serviceDurationMinutes: 45,
      slotIntervalMinutes: 15,
      ...wide,
    });
    // 09:00 (termina 09:45) e 09:15 (termina 10:00) cabem; 09:30 não.
    expect(slots.map((s) => s.toISOString())).toEqual([
      at('09:00').toISOString(),
      at('09:15').toISOString(),
    ]);
  });

  it('remove slots que colidem com períodos ocupados', () => {
    const slots = computeAvailableSlots({
      workingIntervals: [iv('09:00', '11:00')],
      busyIntervals: [iv('09:30', '10:00')],
      serviceDurationMinutes: 30,
      slotIntervalMinutes: 30,
      ...wide,
    });
    // 09:30 colide; 09:00, 10:00, 10:30 livres.
    expect(slots.map((s) => s.toISOString())).toEqual([
      at('09:00').toISOString(),
      at('10:00').toISOString(),
      at('10:30').toISOString(),
    ]);
  });

  it('permite agendamento back-to-back (fim exclusivo)', () => {
    const slots = computeAvailableSlots({
      workingIntervals: [iv('09:00', '10:00')],
      busyIntervals: [iv('09:00', '09:30')],
      serviceDurationMinutes: 30,
      slotIntervalMinutes: 30,
      ...wide,
    });
    // 09:30 começa exatamente quando o ocupado termina → permitido.
    expect(slots.map((s) => s.toISOString())).toEqual([
      at('09:30').toISOString(),
    ]);
  });

  it('respeita a antecedência mínima (earliest)', () => {
    const slots = computeAvailableSlots({
      workingIntervals: [iv('09:00', '10:00')],
      busyIntervals: [],
      serviceDurationMinutes: 30,
      slotIntervalMinutes: 30,
      earliest: at('09:15'),
      latest: at('23:59'),
    });
    // 09:00 < earliest → fora; sobra 09:30.
    expect(slots.map((s) => s.toISOString())).toEqual([
      at('09:30').toISOString(),
    ]);
  });

  it('respeita a antecedência máxima (latest)', () => {
    const slots = computeAvailableSlots({
      workingIntervals: [iv('09:00', '11:00')],
      busyIntervals: [],
      serviceDurationMinutes: 30,
      slotIntervalMinutes: 30,
      earliest: at('00:00'),
      latest: at('10:00'),
    });
    expect(slots.map((s) => s.toISOString())).toEqual([
      at('09:00').toISOString(),
      at('09:30').toISOString(),
      at('10:00').toISOString(),
    ]);
  });

  it('lida com múltiplas janelas (ex.: manhã e tarde com almoço)', () => {
    const slots = computeAvailableSlots({
      workingIntervals: [iv('09:00', '10:00'), iv('14:00', '15:00')],
      busyIntervals: [],
      serviceDurationMinutes: 60,
      slotIntervalMinutes: 60,
      ...wide,
    });
    expect(slots.map((s) => s.toISOString())).toEqual([
      at('09:00').toISOString(),
      at('14:00').toISOString(),
    ]);
  });

  it('retorna vazio para duração inválida', () => {
    expect(
      computeAvailableSlots({
        workingIntervals: [iv('09:00', '10:00')],
        busyIntervals: [],
        serviceDurationMinutes: 0,
        slotIntervalMinutes: 30,
        ...wide,
      }),
    ).toEqual([]);
  });
});
