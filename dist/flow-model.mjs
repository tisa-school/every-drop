export const MAX_FLOW = 12;
export const GARDEN_CAPACITY = 1.5; // Deliberately accelerated illustration, in demo litres.
export const activities = new Set(['brushing', 'washing', 'away']);
export function createState() {
  return { flow:0, activity:'brushing', used:0, wasted:0, exposure:0, gentleSeconds:0, hasRun:false, badges:new Set() };
}
export function isWasting(state) { return state.flow > 0 && state.activity !== 'washing'; }
export function gardenHealth(state) { return Math.round(Math.max(0, 1 - state.exposure / GARDEN_CAPACITY) * 100); }
export function setFlow(state, value) {
  const next = Number(value);
  if (!Number.isFinite(next)) return;
  const flow = Math.max(0, Math.min(MAX_FLOW, next));
  if (state.flow > 0 && flow === 0) {
    if (state.activity === 'brushing') state.badges.add('brush');
    if (state.activity === 'away') state.badges.add('away');
  }
  state.flow = flow;
  if (flow > 0) state.hasRun = true;
  if (!(state.activity === 'washing' && flow > 0 && flow <= 3)) state.gentleSeconds = 0;
}
export function setActivity(state, activity) {
  if (!activities.has(activity)) return;
  if (state.activity !== activity) state.gentleSeconds = 0;
  state.activity = activity;
}
export function advance(state, seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  const litres = state.flow * seconds / 60;
  state.used += litres;
  if (isWasting(state)) {
    state.wasted += litres;
    state.exposure = Math.min(GARDEN_CAPACITY, state.exposure + litres);
  } else if (state.flow === 0) {
    state.exposure = Math.max(0, state.exposure - seconds * 0.12);
  }
  if (state.activity === 'washing' && state.flow > 0 && state.flow <= 3) {
    state.gentleSeconds += seconds;
    if (state.gentleSeconds >= 2) state.badges.add('gentle');
  }
}
