import { describe, it, expect } from 'vitest';

describe('Analytics Calculations & Metrics Logic', () => {
  it('debe calcular la variación porcentual positiva correctamente', () => {
    const current = 150;
    const previous = 100;
    const change = Math.round(((current - previous) / previous) * 1000) / 10;
    expect(change).toBe(50);
  });

  it('debe calcular la variación porcentual negativa correctamente', () => {
    const current = 80;
    const previous = 100;
    const change = Math.round(((current - previous) / previous) * 1000) / 10;
    expect(change).toBe(-20);
  });

  it('debe retornar 100% cuando no existían datos en el período anterior pero hay en el actual', () => {
    const current = 45;
    const previous = 0;
    const change = previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : (current > 0 ? 100 : 0);
    expect(change).toBe(100);
  });

  it('debe calcular la distribución porcentual de plataformas adecuadamente', () => {
    const fb = 75;
    const ig = 25;
    const total = fb + ig;

    const fbPct = Math.round((fb / total) * 1000) / 10;
    const igPct = Math.round((ig / total) * 1000) / 10;

    expect(fbPct).toBe(75);
    expect(igPct).toBe(25);
    expect(fbPct + igPct).toBe(100);
  });
});
