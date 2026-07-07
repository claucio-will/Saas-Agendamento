/** Intervalo de tempo absoluto (UTC). */
export interface Interval {
  start: Date;
  end: Date;
}

export interface SlotEngineInput {
  /** Janelas de trabalho do profissional já resolvidas para tempo absoluto. */
  workingIntervals: Interval[];
  /** Períodos ocupados (agendamentos ativos + bloqueios). */
  busyIntervals: Interval[];
  /** Duração do serviço em minutos. */
  serviceDurationMinutes: number;
  /** Granularidade dos horários oferecidos (ex.: de 15 em 15 min). */
  slotIntervalMinutes: number;
  /** Mínimo: agora + antecedência mínima do tenant. */
  earliest: Date;
  /** Máximo: agora + antecedência máxima (ou fim da janela pedida). */
  latest: Date;
}

/**
 * Motor de cálculo de horários disponíveis — função PURA (sem I/O, sem fuso).
 * A resolução de fuso (jornada local → intervalos absolutos) é feita na camada
 * de aplicação. Ver PRD 2.9. Esta é a peça mais crítica do produto.
 */
export function computeAvailableSlots(input: SlotEngineInput): Date[] {
  const {
    workingIntervals,
    busyIntervals,
    serviceDurationMinutes,
    slotIntervalMinutes,
    earliest,
    latest,
  } = input;

  if (serviceDurationMinutes <= 0 || slotIntervalMinutes <= 0) return [];

  const durationMs = serviceDurationMinutes * 60_000;
  const stepMs = slotIntervalMinutes * 60_000;
  const earliestMs = earliest.getTime();
  const latestMs = latest.getTime();
  const slots: Date[] = [];

  for (const win of workingIntervals) {
    const winEnd = win.end.getTime();
    for (let t = win.start.getTime(); t + durationMs <= winEnd; t += stepMs) {
      const slotEnd = t + durationMs;
      if (t < earliestMs || t > latestMs) continue;
      if (overlapsAny(t, slotEnd, busyIntervals)) continue;
      slots.push(new Date(t));
    }
  }

  return slots.sort((a, b) => a.getTime() - b.getTime());
}

/** Sobreposição meia-aberta [start, end): back-to-back não conflita. */
function overlapsAny(
  startMs: number,
  endMs: number,
  busy: Interval[],
): boolean {
  return busy.some(
    (b) => startMs < b.end.getTime() && endMs > b.start.getTime(),
  );
}
