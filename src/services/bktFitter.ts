import type { InteractionSignal } from '../store/performanceStore';
import type { BKTFittedParams } from './knowledgeEngine';

const GRID_P_L0 = [0.05, 0.10, 0.15, 0.20, 0.30, 0.40];
const GRID_P_T = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40];
const GRID_P_G = [0.05, 0.10, 0.15, 0.20, 0.25];
const GRID_P_S = [0.05, 0.10, 0.15, 0.20];
const MIN_SAMPLES = 10;

export function forwardLogLikelihood(obs: boolean[], params: BKTFittedParams): number {
  let pL = params.pL0;
  let ll = 0;
  for (const correct of obs) {
    const pObs = correct
      ? pL * (1 - params.pSlip) + (1 - pL) * params.pGuess
      : pL * params.pSlip + (1 - pL) * (1 - params.pGuess);

    if (pObs <= 0) return -Infinity;
    ll += Math.log(pObs);

    pL = correct
      ? (pL * (1 - params.pSlip)) / pObs
      : (pL * params.pSlip) / pObs;

    pL = pL + (1 - pL) * params.pLearn;
  }
  return ll;
}

function gridSearch(observations: boolean[]): BKTFittedParams {
  let bestLL = -Infinity;
  let best: BKTFittedParams = { pGuess: 0.15, pSlip: 0.10, pLearn: 0.18, pL0: 0.15, pForget: 0.05 };

  for (const pL0 of GRID_P_L0) {
    for (const pT of GRID_P_T) {
      for (const pG of GRID_P_G) {
        for (const pS of GRID_P_S) {
          const ll = forwardLogLikelihood(observations, { pGuess: pG, pSlip: pS, pLearn: pT, pL0 });
          if (ll > bestLL) {
            bestLL = ll;
            best = { pGuess: pG, pSlip: pS, pLearn: pT, pL0, pForget: 0.05 };
          }
        }
      }
    }
  }
  return best;
}

export function fitParameters(signals: InteractionSignal[]): Record<string, BKTFittedParams> {
  const grouped: Record<string, boolean[]> = {};
  for (const s of signals) {
    if (!grouped[s.topic]) grouped[s.topic] = [];
    grouped[s.topic].push(s.answeredCorrect);
  }

  const results: Record<string, BKTFittedParams> = {};
  for (const [topic, obs] of Object.entries(grouped)) {
    if (obs.length < MIN_SAMPLES) continue;
    results[topic] = gridSearch(obs);
  }
  return results;
}
