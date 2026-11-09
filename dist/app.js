import {createState, setFlow, setActivity, advance, gardenHealth, isWasting} from './flow-model.mjs';
const $ = id => document.getElementById(id);
let state = createState();
let lastTime = performance.now();
let previousMessage = '';
let knownBadges = new Set();
let toastTimer, celebrationTimer;
const badgeNames = {brush:'Brush hero',gentle:'Gentle flow',away:'Tap checker'};
function notify(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').classList.add('visible');
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 5000);
}
function celebrate(name) {
  clearTimeout(celebrationTimer);
  $('celebration').classList.remove('pop');
  void $('celebration').offsetWidth;
  $('celebration').classList.add('pop');
  celebrationTimer = setTimeout(() => $('celebration').classList.remove('pop'), 2000);
  notify(`You earned the ${name} badge! Great job!`);
}
function integrateNow() {
  const now = performance.now();
  if (!document.hidden) advance(state, Math.min((now-lastTime)/1000, 1));
  lastTime = now;
}
function changeFlow(value) {
  integrateNow();
  setFlow(state, value);
  render();
}
function render() {
  const flowing = state.flow > 0;
  const wasting = isWasting(state);
  const health = gardenHealth(state);
  const dry = 1 - health / 100;
  document.body.classList.toggle('flowing', flowing);
  document.body.classList.toggle('wasting', wasting);
  document.body.classList.toggle('stressed', health < 60);
  document.documentElement.style.setProperty('--dryness', dry.toFixed(3));
  $('flow-value').textContent = state.flow.toFixed(1);
  $('used-value').textContent = state.used.toFixed(2);
  $('wasted-value').textContent = state.wasted.toFixed(2);
  $('flow-meter').value = state.flow;
  $('flow-slider').value = state.flow;
  $('flow-slider').setAttribute('aria-valuetext', `${state.flow} litres per minute in the game`);
  $('slider-value').textContent = `${state.flow} L/min`;
  $('nature-health').value = health;
  $('nature-health').textContent = `${health}%`;
  $('health-number').textContent = `${health}%`;
  const level = state.flow === 0 ? 'MIN' : state.flow === 12 ? 'MAX' : state.flow <= 3 ? 'LOW' : state.flow <= 8 ? 'MEDIUM' : 'HIGH';
  $('tap-action').textContent = `${level} · ${state.flow} L/min`;
  $('tap-state').textContent = `${level} FLOW`;
  $('tap-message').textContent = wasting ? 'Try less water!' : flowing ? 'Use what you need.' : state.hasRun ? 'Back to MIN!' : 'Ready to play?';
  $('tap-help').textContent = wasting ? 'Move toward MIN when the water is not needed.' : flowing ? 'Try a little flow. Move to MIN when you’re done.' : 'Move the slider between MIN and MAX.';
  const missions = {
    brushing:'Your mission: move the flow to MIN while you brush!',
    washing:'Your mission: wash with a gentle flow (3 L/min or less) for 2 seconds.',
    away:'Your mission: move the flow to MIN before walking away!'
  };
  const badge = state.activity === 'brushing' ? 'brush' : state.activity === 'washing' ? 'gentle' : 'away';
  const mission = state.badges.has(badge) ? `Mission complete! You earned ${badgeNames[badge]}. Try another activity!` : missions[state.activity];
  if ($('mission').textContent !== mission) $('mission').textContent = mission;
  let buddyTitle, buddyMessage;
  if (wasting) {
    buddyTitle = 'Oops! We’re wasting water!';
    buddyMessage = state.activity === 'brushing' ? 'Your teeth need brushing, but the water can wait. Try MIN!' : 'Nobody is using this water. Choose MIN before you go!';
  } else if (flowing) {
    buddyTitle = state.flow <= 3 ? 'Nice gentle flow!' : 'Let’s wash our hands!';
    buddyMessage = state.flow <= 3 ? 'You’re using water for a reason. Turn it off when you’re done.' : 'Water helps wash your hands. Can you try a smaller flow?';
  } else if (state.hasRun) {
    buddyTitle = 'Great job! Back to MIN.';
    buddyMessage = health < 100 ? 'The waste has stopped. Watch your pretend garden grow back!' : 'Use the water you need. Then move to MIN. You’ve got this!';
  } else {
    buddyTitle = 'Ready to choose your flow?';
    buddyMessage = 'Choose what you’re doing. Then move the flow slider!';
  }
  const key = buddyTitle + buddyMessage;
  if (key !== previousMessage) {
    $('buddy-title').textContent = buddyTitle;
    $('buddy-message').textContent = buddyMessage;
    previousMessage = key;
  }
  $('buddy-mouth').setAttribute('d', wasting ? 'M30 76Q40 65 50 76' : 'M30 69Q40 80 50 69');
  const natureStage = health < 30 ? 'dry' : health < 75 ? 'thirsty' : 'healthy';
  const worldTitle = natureStage === 'dry' ? 'Our world is drying.' : natureStage === 'thirsty' ? 'Nature is getting thirsty.' : flowing && !wasting ? 'Water helps us all.' : 'Nature is happy!';
  $('world-title').textContent = worldTitle;
  const worldDescription = wasting ? 'Water left running is water we don’t need to use. Choose MIN!' : !flowing && health < 100 ? 'You stopped the waste! Your pretend world is growing back.' : 'Use the water you need. Choose MIN when no water is needed.';
  $('world-description').textContent = worldDescription;
  $('world-tag').textContent = wasting ? '💧 WATER LEFT RUNNING' : flowing ? '🧼 WATER BEING USED' : '🌱 YOUR PRETEND WORLD';
  $('flower-label').textContent = natureStage === 'healthy' ? '🌼 Happy flowers' : natureStage === 'thirsty' ? '🌼 Thirsty flowers' : '🥀 Dry flowers';
  $('tree-label').textContent = natureStage === 'healthy' ? '🌳 Green trees' : natureStage === 'thirsty' ? '🌳 Thirsty trees' : '🍂 Dry trees';
  $('children-label').textContent = natureStage === 'healthy' ? '😊 Happy children' : '😟 Quiet children';
  const alt = natureStage === 'healthy' ? 'A healthy forest, colorful flowers, a flowing river, and laughing children.' : natureStage === 'thirsty' ? 'The pretend forest is fading toward a dry world with thirsty plants and quiet children.' : 'A dry pretend forest, wilted flowers, an empty riverbed and quiet children.';
  $('landscape').setAttribute('aria-label', alt);
  document.querySelector('.access-photo').setAttribute('aria-label', alt + ' An illustrative game, not a drinking-water safety assessment.');
  const mainTitle = $('home-world-title');
  if (mainTitle.dataset.stage !== natureStage) {
    mainTitle.dataset.stage = natureStage;
    const lines = natureStage === 'dry'
      ? ['Flowers are fading.', 'Rivers are drying.', 'Choose a smaller flow.']
      : natureStage === 'thirsty'
      ? ['Water is precious.', 'Nature is thirsty.', 'Every drop matters.']
      : ['Healthy children.', 'Thriving nature.', 'Water connects us.'];
    const emphasis = document.createElement('em'); emphasis.textContent = lines[2];
    mainTitle.replaceChildren(document.createTextNode(lines[0]), document.createElement('br'), document.createTextNode(lines[1]), document.createElement('br'), emphasis);
  }
  $('home-flow-slider').value = state.flow;
  $('home-flow-slider').setAttribute('aria-valuetext', `${level}, ${state.flow} litres per minute in the game`);
  $('home-flow-value').textContent = `${state.flow.toFixed(1)} L/min`;
  document.documentElement.style.setProperty('--stream', String(state.flow / 12));
  document.querySelector('.home-flow').dataset.level = level.toLowerCase();
  const mainStatus = `${level} · ${state.flow.toFixed(1)} L/min`;
  if ($('home-tap-status').textContent !== mainStatus) $('home-tap-status').textContent = mainStatus;
  const mainHelp = state.flow === 12 ? 'MAX uses the most water. Move toward MIN when that water is not needed.'
    : flowing ? 'A smaller stream uses less water. Use only what you need.'
    : health < 100 ? 'Back at MIN! Watch the pretend forest grow back.'
    : 'Drag toward MAX to use more water. Move back to MIN when you don’t need it.';
  if ($('home-tap-help').textContent !== mainHelp) $('home-tap-help').textContent = mainHelp;

  for (const id of Object.keys(badgeNames)) {
    const earned = state.badges.has(id);
    $(`badge-${id}`).classList.toggle('earned', earned);
    $(`badge-${id}`).setAttribute('aria-label', `${badgeNames[id]} badge: ${earned?'earned':'not earned'}`);
    if (earned && !knownBadges.has(id)) celebrate(badgeNames[id]);
  }
  if (knownBadges.size !== state.badges.size) $('badge-count').textContent = `${state.badges.size} of 3 earned`;
  knownBadges = new Set(state.badges);

}
$('home-flow-slider').addEventListener('input', event => changeFlow(Number(event.target.value)));
$('flow-slider').addEventListener('input', event => changeFlow(Number(event.target.value)));
for (const radio of document.querySelectorAll('input[name=activity]')) radio.addEventListener('change', () => {
  integrateNow();
  setActivity(state, radio.value);
  render();
});
$('reset-demo').addEventListener('click', () => {
  state = createState();
  knownBadges = new Set();
  previousMessage = '';
  lastTime = performance.now();
  $('badge-count').textContent = '0 of 3 earned';
  document.querySelector('input[value=brushing]').checked = true;
  clearTimeout(celebrationTimer);
  $('celebration').classList.remove('pop');
  render();
  notify('Fresh start! Can you earn all three badges?');
});
document.addEventListener('visibilitychange', () => {lastTime = performance.now();});
setInterval(() => {
  integrateNow();render();
}, 200);
$('download-scene').addEventListener('click', async () => {
  const button = $('download-scene');
  if (button.disabled) return;
  button.disabled = true;
  const dry = 1 - gardenHealth(state)/100;
  try {
    notify('Getting your picture ready…');
    const healthy = document.querySelector('.healthy-scene');
    const drought = document.querySelector('.drought-scene');
    await Promise.all([healthy.decode(),drought.decode()]);
    const canvas = document.createElement('canvas');canvas.width=3840;canvas.height=2160;
    const ctx=canvas.getContext('2d');
    if (!ctx) throw new Error('No canvas');
    ctx.imageSmoothingQuality='high';
    function draw(source) {
      const scale=Math.max(3840/source.naturalWidth,2160/source.naturalHeight);
      const width=source.naturalWidth*scale,height=source.naturalHeight*scale;
      ctx.drawImage(source,(3840-width)/2,(2160-height)/2,width,height);
    }
    draw(healthy);ctx.globalAlpha=dry;draw(drought);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.95));
    if (!blob) throw new Error('No image');
    const url=URL.createObjectURL(blob), link=document.createElement('a');
    link.href=url;link.download='every-drop-your-world-3840x2160.jpg';
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    notify('Picture saved! 4K size, enlarged from the original artwork.');
  } catch {notify('Oops! Your picture did not save. Try again.');}
  finally {button.disabled=false;}
});
render();

// An illustrated clean-water journey, separate from the conservation mini-game.
const explored = new Set();
const accessSteps = {
  source: {title:'Enough water, close to home.',text:'A protected, reliable source can reduce long journeys. The water still needs safety checks and, where needed, treatment.'},
  treatment: {title:'Looks clear? It still needs checks.',text:'Trained people test water and use suitable treatment for harmful germs and other contamination. Looking at it is not enough.'},
  storage: {title:'Keep safe water safe.',text:'Store drinking water in a clean, covered container. Keep dirty hands and used wash water out of it.'},
  care: {title:'It takes teamwork over time.',text:'Communities need repairs, funding, trained workers and fair access. A working tap needs lasting care.'}
};
function renderJourney(lastStep) {
  for (const button of document.querySelectorAll('[data-step]')) {
    const complete = explored.has(button.dataset.step);
    button.setAttribute('aria-pressed', String(complete));
    button.querySelector('.step-mark').textContent = complete ? '✓' : '＋';
    $(`route-${button.dataset.step}`).classList.toggle('complete', complete);
  }
  $('journey-progress').value = explored.size;
  $('journey-progress').textContent = `${explored.size} of 4`;
  $('journey-count').textContent = `${explored.size} of 4 explored`;
  document.querySelector('.access-experience').classList.toggle('journey-complete', explored.size === 4);
  if (explored.size === 4) {
    $('access-feedback-title').textContent = 'The whole journey matters!';
    $('access-feedback-text').textContent = 'Safe, reliable water takes all four parts—and people working together. Saving water is another way to care for it.';
  } else if (lastStep && explored.has(lastStep)) {
    $('access-feedback-title').textContent = accessSteps[lastStep].title;
    $('access-feedback-text').textContent = accessSteps[lastStep].text;
  } else {
    $('access-feedback-title').textContent = 'Meet the whole water journey.';
    $('access-feedback-text').textContent = 'A tap is only the last part. Let’s discover what comes before it!';
  }
}
for (const button of document.querySelectorAll('[data-step]')) button.addEventListener('click', () => {
  const step = button.dataset.step;
  const wasComplete = explored.size === 4;
  if (explored.has(step)) explored.delete(step); else explored.add(step);
  renderJourney(step);
  if (explored.size === 4 && !wasComplete) {
    clearTimeout(celebrationTimer);
    $('celebration').classList.remove('pop');
    void $('celebration').offsetWidth;
    $('celebration').classList.add('pop');
    celebrationTimer=setTimeout(()=>$('celebration').classList.remove('pop'),2000);
    notify('Journey complete! Clean water takes teamwork.');
  }
});
$('journey-reset').addEventListener('click', () => {explored.clear();renderJourney();});
$('look-closer').addEventListener('click', () => {
  const zoom = $('look-closer').getAttribute('aria-pressed') !== 'true';
  $('look-closer').setAttribute('aria-pressed',String(zoom));
  $('bucket-art').classList.toggle('magnified',zoom);
  $('look-closer').textContent=zoom ? '↩ Look normally' : '⌕ Look closer';
  $('bucket-result').textContent=zoom
    ? 'Surprise! This pretend water has germs. Real germs can be too tiny to see. Clear-looking water is not always safe.'
    : 'Can you tell whether water is safe just by looking?';
  $('bucket-art').setAttribute('aria-label',zoom
    ? 'The illustrated clear-water bucket now shows cartoon germs, drawn larger than real germs.'
    : 'An illustrated bucket of clear-looking water');
});
const impactStories = {
  families:{symbol:'🏡',title:'Every child deserves a healthy start.',text:'Unsafe water can make people seriously ill and can be deadly. Safe water, toilets and handwashing help protect families. A reliable supply also means less time spent collecting water.',hope:'Access is a shared responsibility—not a family’s fault.'},
  animals:{symbol:'🐑',title:'Animals need water—and food.',text:'Drought can dry up drinking water and the grass that farm animals eat. When animals suffer, families who depend on them for food and income can suffer, too.',hope:'Protecting water sources and preparing for drought helps people and animals.'},
  trees:{symbol:'🌳',title:'Healthy trees support a living world.',text:'Trees use water to grow. Long droughts can weaken or kill them. Trees produce oxygen, give shade and shelter wildlife. Rivers, soil, forests and water all connect.',hope:'Caring for ecosystems matters alongside safe water services for people.'}
};
function selectImpact(key, focus=false) {
  const story=impactStories[key];
  for(const tab of document.querySelectorAll('[data-impact]')) {
    const selected=tab.dataset.impact===key;
    tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
    if(selected&&focus)tab.focus();
  }
  $('impact-panel').setAttribute('aria-labelledby',`tab-${key}`);
  $('impact-symbol').textContent=story.symbol;$('impact-title').textContent=story.title;
  $('impact-description').textContent=story.text;$('impact-hope').textContent=story.hope;
}
const impactTabs=[...document.querySelectorAll('[data-impact]')];
for(const [index,tab] of impactTabs.entries()) {
  tab.addEventListener('click',()=>selectImpact(tab.dataset.impact));
  tab.addEventListener('keydown',event=>{
    let next;
    if(event.key==='ArrowRight')next=(index+1)%impactTabs.length;
    else if(event.key==='ArrowLeft')next=(index+impactTabs.length-1)%impactTabs.length;
    else if(event.key==='Home')next=0;else if(event.key==='End')next=impactTabs.length-1;
    if(next!==undefined){event.preventDefault();selectImpact(impactTabs[next].dataset.impact,true);}
  });
}
for(const link of document.querySelectorAll('[data-open-game]'))link.addEventListener('click',event=>{
  event.preventDefault();$('tap-game').open=true;
  $('tap-game').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
});
