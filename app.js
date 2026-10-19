/* HA Automation Builder
   Elk onderdeel heeft een type met velden, een naar()-functie (formulier -> YAML-object) en een van()-functie (YAML-object -> formulier of null).
   Onbekende onderdelen blijven bewaard als 'raw' YAML. */
const ENTS = ['light.living_room', 'light.kitchen', 'light.hallway', 'switch.coffee_machine', 'binary_sensor.motion_hallway', 'binary_sensor.front_door', 'person.me', 'device_tracker.phone',
  'sensor.washing_machine_power', 'sensor.outside_temperature', 'sensor.living_room_temperature', 'climate.living_room', 'cover.living_room_blinds', 'media_player.tv', 'scene.movie_night', 'script.good_night',
  'input_boolean.guest_mode', 'zone.home', 'sun.sun', 'alarm_control_panel.home', 'lock.front_door', 'fan.bedroom'];
$('#ents').innerHTML = ENTS.map((e) => `<option value="${e}">`).join('');
const DAGEN = [['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'], ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun']];
/* veldsoorten: e = entiteit, t = tekst, n = getal, d = duur (hh:mm:ss), tijd, sel:[..], dagen, y = yaml */
const dur = (v) => (v && String(v).trim()) || undefined;
const num = (v) => (v === '' || v == null || isNaN(+v) ? undefined : +v);
const lijst = (v) => { const a = String(v || '').split(',').map((x) => x.trim()).filter(Boolean); return a.length > 1 ? a : a[0]; };
const nietLeeg = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)));
const yamlObj = (t) => { if (!String(t || '').trim()) return undefined; try { return jsyaml.load(t); } catch (e) { return undefined; } };
const yamlTxt = (o) => (o == null ? '' : jsyaml.dump(o, { lineWidth: 120 }).trim());

const TRIG = {
  state: { naam: 'Entity changes state', ic: 'mdi-swap-horizontal', f: [['entity_id', 'Entity', 'e'], ['to', 'To state', 't', 'on'], ['from', 'From state (optional)', 't'], ['for', 'For (hh:mm:ss, optional)', 'd']],
    naar: (v) => nietLeeg({ entity_id: lijst(v.entity_id), from: v.from || undefined, to: v.to || undefined, for: dur(v.for) }), van: (o) => o.entity_id !== undefined && !('above' in o) && !('below' in o) && { entity_id: [].concat(o.entity_id).join(', '), from: o.from ?? '', to: o.to ?? '', for: typeof o.for === 'string' ? o.for : '' } },
  time: { naam: 'Time of day', ic: 'mdi-clock-outline', f: [['at', 'At (HH:MM)', 'tijd', '07:00']], naar: (v) => ({ at: v.at.length === 5 ? v.at + ':00' : v.at }), van: (o) => typeof o.at === 'string' && { at: o.at.slice(0, 5) } },
  sun: { naam: 'Sunrise / sunset', ic: 'mdi-weather-sunset', f: [['event', 'Event', ['sunset', 'sunrise']], ['offset', 'Offset (e.g. -00:30:00)', 'd']], naar: (v) => nietLeeg({ event: v.event, offset: dur(v.offset) }), van: (o) => o.event && { event: o.event, offset: o.offset || '' } },
  numeric_state: { naam: 'Value goes above / below', ic: 'mdi-chart-bell-curve', f: [['entity_id', 'Entity', 'e'], ['above', 'Above', 'n'], ['below', 'Below', 'n'], ['for', 'For (hh:mm:ss, optional)', 'd']],
    naar: (v) => nietLeeg({ entity_id: lijst(v.entity_id), above: num(v.above), below: num(v.below), for: dur(v.for) }), van: (o) => o.entity_id && { entity_id: [].concat(o.entity_id).join(', '), above: o.above ?? '', below: o.below ?? '', for: typeof o.for === 'string' ? o.for : '' } },
  zone: { naam: 'Enter / leave a zone', ic: 'mdi-map-marker-radius', f: [['entity_id', 'Person', 'e', 'person.me'], ['zone', 'Zone', 'e', 'zone.home'], ['event', 'Event', ['enter', 'leave']]],
    naar: (v) => ({ entity_id: lijst(v.entity_id), zone: v.zone, event: v.event }), van: (o) => o.zone && { entity_id: [].concat(o.entity_id).join(', '), zone: o.zone, event: o.event || 'enter' } },
  time_pattern: { naam: 'Every … (time pattern)', ic: 'mdi-timer-sync-outline', f: [['hours', 'Hours (e.g. /2)', 't'], ['minutes', 'Minutes (e.g. /15)', 't', '/15'], ['seconds', 'Seconds', 't']],
    naar: (v) => nietLeeg({ hours: v.hours || undefined, minutes: v.minutes || undefined, seconds: v.seconds || undefined }), van: (o) => ({ hours: o.hours ?? '', minutes: o.minutes ?? '', seconds: o.seconds ?? '' }) },
  homeassistant: { naam: 'Home Assistant starts', ic: 'mdi-home-assistant', f: [['event', 'Event', ['start', 'shutdown']]], naar: (v) => ({ event: v.event }), van: (o) => ({ event: o.event || 'start' }) },
  event: { naam: 'Event fired', ic: 'mdi-broadcast', f: [['event_type', 'Event type', 't', 'my_event'], ['event_data', 'Event data (YAML, optional)', 'y']], naar: (v) => nietLeeg({ event_type: v.event_type, event_data: yamlObj(v.event_data) }), van: (o) => o.event_type && { event_type: o.event_type, event_data: yamlTxt(o.event_data) } },
  webhook: { naam: 'Webhook', ic: 'mdi-webhook', f: [['webhook_id', 'Webhook ID', 't', 'my-secret-webhook-id']], naar: (v) => ({ webhook_id: v.webhook_id, allowed_methods: ['POST', 'PUT'], local_only: true }), van: (o) => o.webhook_id && { webhook_id: o.webhook_id } },
};
const COND = {
  state: { naam: 'Entity is in state', ic: 'mdi-equal', f: [['entity_id', 'Entity', 'e'], ['state', 'State', 't', 'on'], ['for', 'For at least (optional)', 'd']],
    naar: (v) => nietLeeg({ entity_id: lijst(v.entity_id), state: v.state, for: dur(v.for) }), van: (o) => o.entity_id !== undefined && o.state !== undefined && { entity_id: [].concat(o.entity_id).join(', '), state: [].concat(o.state).join(', '), for: typeof o.for === 'string' ? o.for : '' } },
  time: { naam: 'Time and weekdays', ic: 'mdi-calendar-clock', f: [['after', 'After (HH:MM)', 'tijd'], ['before', 'Before (HH:MM)', 'tijd'], ['weekday', 'Days', 'dagen']],
    naar: (v) => nietLeeg({ after: v.after ? v.after + ':00' : undefined, before: v.before ? v.before + ':00' : undefined, weekday: v.weekday && v.weekday.length && v.weekday.length < 7 ? v.weekday : undefined }),
    van: (o) => ({ after: (o.after || '').slice(0, 5), before: (o.before || '').slice(0, 5), weekday: [].concat(o.weekday || []) }) },
  sun: { naam: 'Sun is up / down', ic: 'mdi-weather-sunny', f: [['when', 'When', ['after sunset (dark)', 'after sunrise (light)']]],
    naar: (v) => (v.when.startsWith('after sunset') ? { after: 'sunset', before: 'sunrise' } : { after: 'sunrise', before: 'sunset' }), van: (o) => (o.after === 'sunset' || o.after === 'sunrise') && { when: o.after === 'sunset' ? 'after sunset (dark)' : 'after sunrise (light)' } },
  numeric_state: { naam: 'Value is above / below', ic: 'mdi-chart-bell-curve', f: [['entity_id', 'Entity', 'e'], ['above', 'Above', 'n'], ['below', 'Below', 'n']], naar: (v) => nietLeeg({ entity_id: lijst(v.entity_id), above: num(v.above), below: num(v.below) }), van: (o) => o.entity_id && { entity_id: [].concat(o.entity_id).join(', '), above: o.above ?? '', below: o.below ?? '' } },
  zone: { naam: 'Person is in zone', ic: 'mdi-map-marker-check', f: [['entity_id', 'Person', 'e', 'person.me'], ['zone', 'Zone', 'e', 'zone.home']], naar: (v) => ({ entity_id: lijst(v.entity_id), zone: v.zone }), van: (o) => o.zone && { entity_id: [].concat(o.entity_id).join(', '), zone: o.zone } },
  template: { naam: 'Template', ic: 'mdi-code-braces', f: [['value_template', 'Template (true/false)', 'y', "{{ states('sensor.outside_temperature') | float(0) < 10 }}"]], naar: (v) => ({ value_template: v.value_template }), van: (o) => o.value_template && { value_template: o.value_template } },
};
/* Acties zijn allemaal 'action calls' behalve delay/wait; naar() geeft een volledig object terug */
const ACT = {
  light_on: { naam: 'Turn on light', ic: 'mdi-lightbulb-on-outline', f: [['entity_id', 'Light(s)', 'e', 'light.living_room'], ['brightness_pct', 'Brightness % (optional)', 'n'], ['color_temp_kelvin', 'Colour temperature K (optional)', 'n'], ['transition', 'Fade seconds (optional)', 'n']],
    naar: (v) => ({ action: 'light.turn_on', target: { entity_id: lijst(v.entity_id) }, data: nietLeeg({ brightness_pct: num(v.brightness_pct), color_temp_kelvin: num(v.color_temp_kelvin), transition: num(v.transition) }) }),
    van: (o) => o.action === 'light.turn_on' && { entity_id: doel(o), brightness_pct: o.data?.brightness_pct ?? '', color_temp_kelvin: o.data?.color_temp_kelvin ?? '', transition: o.data?.transition ?? '' } },
  turn_off: { naam: 'Turn off', ic: 'mdi-power', f: [['entity_id', 'Entity / entities', 'e', 'light.living_room']], naar: (v) => ({ action: 'homeassistant.turn_off', target: { entity_id: lijst(v.entity_id) } }), van: (o) => /\.turn_off$/.test(o.action || '') && !o.data && { entity_id: doel(o) } },
  turn_on: { naam: 'Turn on (switch, fan, …)', ic: 'mdi-toggle-switch-outline', f: [['entity_id', 'Entity / entities', 'e', 'switch.coffee_machine']], naar: (v) => ({ action: 'homeassistant.turn_on', target: { entity_id: lijst(v.entity_id) } }), van: (o) => /^(homeassistant|switch|fan|input_boolean)\.turn_on$/.test(o.action || '') && !o.data && { entity_id: doel(o) } },
  toggle: { naam: 'Toggle', ic: 'mdi-swap-horizontal-variant', f: [['entity_id', 'Entity / entities', 'e']], naar: (v) => ({ action: 'homeassistant.toggle', target: { entity_id: lijst(v.entity_id) } }), van: (o) => /\.toggle$/.test(o.action || '') && !o.data && { entity_id: doel(o) } },
  scene: { naam: 'Activate scene', ic: 'mdi-palette-outline', f: [['entity_id', 'Scene', 'e', 'scene.movie_night']], naar: (v) => ({ action: 'scene.turn_on', target: { entity_id: lijst(v.entity_id) } }), van: (o) => o.action === 'scene.turn_on' && { entity_id: doel(o) } },
  script: { naam: 'Run script', ic: 'mdi-script-text-outline', f: [['entity_id', 'Script', 'e', 'script.good_night']], naar: (v) => ({ action: 'script.turn_on', target: { entity_id: lijst(v.entity_id) } }), van: (o) => o.action === 'script.turn_on' && { entity_id: doel(o) } },
  notify: { naam: 'Send notification', ic: 'mdi-message-badge-outline', f: [['service', 'Notify action', 't', 'notify.mobile_app_my_phone'], ['title', 'Title (optional)', 't'], ['message', 'Message', 't', 'Hello from Home Assistant']],
    naar: (v) => ({ action: v.service.includes('.') ? v.service : 'notify.' + v.service, data: nietLeeg({ title: v.title || undefined, message: v.message }) }), van: (o) => /^notify\./.test(o.action || '') && o.data?.message !== undefined && { service: o.action, title: o.data.title || '', message: o.data.message } },
  climate: { naam: 'Set thermostat', ic: 'mdi-thermostat', f: [['entity_id', 'Thermostat', 'e', 'climate.living_room'], ['temperature', 'Temperature', 'n', '20']],
    naar: (v) => ({ action: 'climate.set_temperature', target: { entity_id: lijst(v.entity_id) }, data: { temperature: num(v.temperature) } }), van: (o) => o.action === 'climate.set_temperature' && { entity_id: doel(o), temperature: o.data?.temperature ?? '' } },
  cover: { naam: 'Open / close cover', ic: 'mdi-blinds', f: [['entity_id', 'Cover', 'e', 'cover.living_room_blinds'], ['what', 'Action', ['close_cover', 'open_cover', 'stop_cover']]],
    naar: (v) => ({ action: 'cover.' + v.what, target: { entity_id: lijst(v.entity_id) } }), van: (o) => /^cover\.(open|close|stop)_cover$/.test(o.action || '') && { entity_id: doel(o), what: o.action.split('.')[1] } },
  delay: { naam: 'Wait (delay)', ic: 'mdi-timer-sand', f: [['delay', 'Duration (hh:mm:ss)', 'd', '00:05:00']], naar: (v) => ({ delay: v.delay }), van: (o) => typeof o.delay === 'string' && Object.keys(o).length === 1 && { delay: o.delay } },
  wait_state: { naam: 'Wait until state', ic: 'mdi-timer-sand-paused', f: [['entity_id', 'Entity', 'e'], ['to', 'To state', 't', 'off'], ['for', 'For (optional)', 'd'], ['timeout', 'Give up after (optional)', 'd']],
    naar: (v) => nietLeeg({ wait_for_trigger: [{ trigger: 'state', ...nietLeeg({ entity_id: lijst(v.entity_id), to: v.to, for: dur(v.for) }) }], timeout: dur(v.timeout), continue_on_timeout: v.timeout ? true : undefined }),
    van: (o) => Array.isArray(o.wait_for_trigger) && o.wait_for_trigger.length === 1 && (o.wait_for_trigger[0].trigger || o.wait_for_trigger[0].platform) === 'state' && { entity_id: [].concat(o.wait_for_trigger[0].entity_id).join(', '), to: o.wait_for_trigger[0].to ?? '', for: o.wait_for_trigger[0].for || '', timeout: o.timeout || '' } },
  call: { naam: 'Any action (advanced)', ic: 'mdi-code-tags', f: [['action', 'Action', 't', 'media_player.volume_set'], ['entity_id', 'Target entity (optional)', 'e'], ['data', 'Data (YAML, optional)', 'y', 'volume_level: 0.3']],
    naar: (v) => nietLeeg({ action: v.action, target: v.entity_id ? { entity_id: lijst(v.entity_id) } : undefined, data: yamlObj(v.data) }), van: (o) => typeof o.action === 'string' && { action: o.action, entity_id: doel(o), data: yamlTxt(o.data) } },
};
function doel(o) { const e = o.target?.entity_id ?? o.entity_id ?? o.data?.entity_id; return e ? [].concat(e).join(', ') : ''; }
const SOORT = { triggers: TRIG, conditions: COND, actions: ACT };
const nieuw = (sec, type, waarden = {}) => { const d = SOORT[sec][type], v = { type }; d.f.forEach(([k, , s, def]) => { v[k] = waarden[k] ?? (s === 'dagen' ? [] : def ?? ''); }); return v; };

const VB = [
  ['Lights on at sunset', 'mdi-weather-sunset-down', 'When someone is home', () => ({ alias: 'Lights on at sunset', mode: 'single', triggers: [nieuw('triggers', 'sun', { event: 'sunset', offset: '-00:15:00' })], conditions: [nieuw('conditions', 'numeric_state', { entity_id: 'zone.home', above: '0' })], actions: [nieuw('actions', 'light_on', { entity_id: 'light.living_room', brightness_pct: '70' })] })],
  ['Motion light', 'mdi-motion-sensor', 'On with motion, off after 2 min', () => ({ alias: 'Hallway motion light', mode: 'restart', triggers: [nieuw('triggers', 'state', { entity_id: 'binary_sensor.motion_hallway', to: 'on' })], conditions: [nieuw('conditions', 'sun', { when: 'after sunset (dark)' })],
    actions: [nieuw('actions', 'light_on', { entity_id: 'light.hallway', brightness_pct: '60' }), nieuw('actions', 'wait_state', { entity_id: 'binary_sensor.motion_hallway', to: 'off', for: '00:02:00' }), nieuw('actions', 'turn_off', { entity_id: 'light.hallway' })] })],
  ['Washing machine done', 'mdi-washing-machine', 'Power drops below 5 W', () => ({ alias: 'Washing machine done', mode: 'single', triggers: [nieuw('triggers', 'numeric_state', { entity_id: 'sensor.washing_machine_power', below: '5', for: '00:03:00' })], conditions: [],
    actions: [nieuw('actions', 'notify', { service: 'notify.mobile_app_my_phone', title: 'Laundry', message: 'The washing machine is done 🧺' })] })],
  ['Everything off when leaving', 'mdi-home-export-outline', 'Last person leaves home', () => ({ alias: 'Everything off when leaving', mode: 'single', triggers: [nieuw('triggers', 'zone', { entity_id: 'person.me', zone: 'zone.home', event: 'leave' })], conditions: [],
    actions: [nieuw('actions', 'turn_off', { entity_id: 'light.living_room, light.kitchen, media_player.tv' }), nieuw('actions', 'climate', { entity_id: 'climate.living_room', temperature: '16' })] })],
  ['Door open too long', 'mdi-door-open', 'Notify after 5 minutes', () => ({ alias: 'Front door open too long', mode: 'single', triggers: [nieuw('triggers', 'state', { entity_id: 'binary_sensor.front_door', to: 'on', for: '00:05:00' })], conditions: [],
    actions: [nieuw('actions', 'notify', { service: 'notify.mobile_app_my_phone', title: 'Front door', message: 'The front door has been open for 5 minutes' })] })],
  ['Wake-up light', 'mdi-alarm', 'Weekdays at 06:45, slow fade', () => ({ alias: 'Wake-up light', mode: 'single', triggers: [nieuw('triggers', 'time', { at: '06:45' })], conditions: [nieuw('conditions', 'time', { weekday: ['mon', 'tue', 'wed', 'thu', 'fri'] })],
    actions: [nieuw('actions', 'light_on', { entity_id: 'light.bedroom', brightness_pct: '100', color_temp_kelvin: '4000', transition: '900' })] })],
  ['Close blinds when hot', 'mdi-blinds', 'Outside above 25 °C', () => ({ alias: 'Close blinds when hot', mode: 'single', triggers: [nieuw('triggers', 'numeric_state', { entity_id: 'sensor.outside_temperature', above: '25' })], conditions: [nieuw('conditions', 'sun', { when: 'after sunrise (light)' })],
    actions: [nieuw('actions', 'cover', { entity_id: 'cover.living_room_blinds', what: 'close_cover' })] })],
];
const leeg = () => ({ alias: '', desc: '', mode: 'single', syntax: 'new', triggers: [nieuw('triggers', 'state', { entity_id: 'binary_sensor.motion_hallway', to: 'on' })], conditions: [], actions: [nieuw('actions', 'light_on')] });
let a = (() => { try { const h = location.hash.match(/#a=(.+)/); if (h) return JSON.parse(decodeURIComponent(escape(atob(h[1])))); } catch (e) { /* */ } return opslag.lees('auto.v1', null) || { ...VB[1][3](), desc: '', syntax: 'new' }; })();

function veld(sec, i, [k, l, s, def]) {
  const v = a[sec][i][k] ?? '', at = `data-s="${sec}" data-i="${i}" data-k="${k}"`;
  if (Array.isArray(s)) return `<div class="fld"><label>${l}</label><select ${at}>${s.map((o) => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
  if (s === 'dagen') return `<div class="fld wide"><label>${l} <span>(none selected = every day)</span></label><div class="dagen">${DAGEN.map(([d, n]) => `<label><input type="checkbox" ${at} data-dag="${d}" ${(v || []).includes(d) ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div></div>`;
  if (s === 'y') return `<div class="fld wide"><label>${l}</label><textarea class="code" rows="3" ${at} placeholder="${esc(def || '')}">${esc(v)}</textarea></div>`;
  const type = s === 'n' ? 'number' : s === 'tijd' ? 'time' : 'text';
  return `<div class="fld${s === 'e' && /entities|\(s\)/.test(l) ? ' wide' : ''}"><label>${l}</label><input type="${type}" ${at} value="${esc(v)}" ${s === 'e' ? 'list="ents" autocomplete="off"' : ''} placeholder="${esc(s === 'd' ? '00:05:00' : def || '')}"></div>`;
}
function items(sec) {
  $('#' + sec).innerHTML = a[sec].map((it, i) => {
    if (it.type === 'raw') return `<div class="it"><div class="it-head"><i class="mdi mdi-code-braces ti"></i><b style="flex:1">Raw YAML (kept as-is)</b>${knoppen(sec, i)}</div><textarea class="code" rows="4" data-s="${sec}" data-i="${i}" data-k="yaml">${esc(it.yaml)}</textarea></div>`;
    const d = SOORT[sec][it.type];
    return `<div class="it"><div class="it-head"><i class="mdi ${d.ic} ti"></i><select data-s="${sec}" data-i="${i}" data-type>${Object.entries(SOORT[sec]).map(([k, x]) => `<option value="${k}" ${k === it.type ? 'selected' : ''}>${x.naam}</option>`).join('')}</select>${knoppen(sec, i)}</div>
      <div class="form">${d.f.map((f) => veld(sec, i, f)).join('')}</div></div>`;
  }).join('') || `<p class="hint" style="margin:0">${sec === 'conditions' ? 'No conditions: the actions always run.' : 'Nothing yet.'}</p>`;
  const top = { triggers: ['state', 'time', 'sun', 'numeric_state', 'zone'], conditions: ['state', 'time', 'sun', 'numeric_state', 'zone'], actions: ['light_on', 'turn_off', 'notify', 'delay', 'scene', 'call'] }[sec];
  $(`.addrow[data-add="${sec}"]`).innerHTML = top.map((k) => `<button type="button" data-s="${sec}" data-new="${k}"><i class="mdi mdi-plus"></i> ${SOORT[sec][k].naam}</button>`).join('');
}
const knoppen = (sec, i) => `<button type="button" class="ib" data-s="${sec}" data-up="${i}" ${i ? '' : 'disabled'} title="Move up"><i class="mdi mdi-arrow-up"></i></button><button type="button" class="ib" data-s="${sec}" data-del="${i}" title="Remove"><i class="mdi mdi-delete-outline"></i></button>`;

function bouw() {
  const oud = a.syntax === 'old';
  const tr = a.triggers.map((t) => t.type === 'raw' ? yamlObj(t.yaml) : (oud ? { platform: t.type, ...TRIG[t.type].naar(t) } : { trigger: t.type, ...TRIG[t.type].naar(t) }));
  const co = a.conditions.map((c) => c.type === 'raw' ? yamlObj(c.yaml) : { condition: c.type, ...COND[c.type].naar(c) });
  const ac = a.actions.map((x) => {
    if (x.type === 'raw') return yamlObj(x.yaml);
    let o = ACT[x.type].naar(x); if (o.data && !Object.keys(o.data).length) delete o.data;
    if (oud && o.action) { const { action, ...rest } = o; o = { service: action, ...rest }; }
    if (oud && o.wait_for_trigger) o.wait_for_trigger = o.wait_for_trigger.map(({ trigger, ...r }) => ({ platform: trigger, ...r }));
    return o;
  });
  const obj = nietLeeg({ alias: a.alias || 'New automation', description: a.desc || undefined });
  obj.mode = a.mode;
  obj[oud ? 'trigger' : 'triggers'] = tr.filter(Boolean); obj[oud ? 'condition' : 'conditions'] = co.filter(Boolean); obj[oud ? 'action' : 'actions'] = ac.filter(Boolean);
  return obj;
}
function yaml() { return jsyaml.dump(bouw(), { lineWidth: 120, noRefs: true, quotingType: '"' }); }
function kleur(t) { return esc(t).replace(/^(\s*-?\s*)([\w.]+):/gm, '$1<span class="k">$2</span>:').replace(/(&quot;.*?&quot;|'.*?')/g, '<span class="s">$1</span>'); }
function controle() {
  const w = [];
  if (!a.triggers.length) w.push('Add at least one trigger, otherwise the automation never runs.');
  if (!a.actions.length) w.push('Add at least one action.');
  const ents = [...a.triggers, ...a.conditions, ...a.actions].flatMap((x) => [x.entity_id, x.zone].filter(Boolean)).join(',');
  if (/(\.living_room|\.kitchen|\.hallway|\.bedroom|motion_hallway|front_door|mobile_app_my_phone|person\.me\b)/.test(ents + JSON.stringify(a.actions))) w.push('Replace the example entity IDs with your own (Settings → Devices & services → Entities).');
  a.triggers.concat(a.conditions).forEach((x) => { if (x.type === 'numeric_state' && x.above === '' && x.below === '') w.push('A "value above / below" needs at least an above or a below.'); });
  ['triggers', 'conditions', 'actions'].forEach((s) => a[s].forEach((x) => { if (x.type === 'raw' && yamlObj(x.yaml) === undefined) w.push('One of the raw YAML blocks is not valid YAML.'); }));
  $('#warn').innerHTML = w.map((x) => `<div>${esc(x)}</div>`).join('');
  $('#samen').textContent = `${a.triggers.length} trigger${a.triggers.length === 1 ? '' : 's'} · ${a.conditions.length} condition${a.conditions.length === 1 ? '' : 's'} · ${a.actions.length} action${a.actions.length === 1 ? '' : 's'}`;
}
function teken() { try { $('#yaml').innerHTML = kleur(yaml()); } catch (e) { $('#yaml').textContent = '# ' + e.message; } controle(); opslag.schrijf('auto.v1', a); }
function alles() { $('#alias').value = a.alias; $('#desc').value = a.desc || ''; $('#mode').value = a.mode; $('#syntax').value = a.syntax || 'new'; ['triggers', 'conditions', 'actions'].forEach(items); teken(); }

$('#vb').innerHTML = VB.map(([n, ic, sub], i) => `<button type="button" data-vb="${i}"><i class="mdi ${ic}"></i><span><b>${n}</b><small>${sub}</small></span></button>`).join('');
$('#vb').onclick = (e) => { const b = e.target.closest('[data-vb]'); if (!b) return; a = { desc: '', syntax: a.syntax || 'new', ...VB[+b.dataset.vb][3]() }; alles(); toast('Example loaded, now swap in your own entities'); };
for (const [id, k] of [['alias', 'alias'], ['desc', 'desc']]) $('#' + id).oninput = (e) => { a[k] = e.target.value; teken(); };
$('#mode').onchange = (e) => { a.mode = e.target.value; teken(); };
$('#syntax').onchange = (e) => { a.syntax = e.target.value; teken(); };
document.querySelector('.cols').addEventListener('input', (e) => {
  const d = e.target.dataset; if (!d.s || d.i == null) return; const it = a[d.s][+d.i];
  if ('type' in d) { a[d.s][+d.i] = nieuw(d.s, e.target.value, it); items(d.s); }
  else if (d.dag) { const set = new Set(it[d.k] || []); e.target.checked ? set.add(d.dag) : set.delete(d.dag); it[d.k] = DAGEN.map(([x]) => x).filter((x) => set.has(x)); }
  else it[d.k] = e.target.value;
  teken();
});
document.querySelector('.cols').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-s]'); if (!b) return; const s = b.dataset.s;
  if (b.dataset.new) a[s].push(nieuw(s, b.dataset.new));
  else if (b.dataset.del != null) a[s].splice(+b.dataset.del, 1);
  else if (b.dataset.up != null) { const i = +b.dataset.up; [a[s][i - 1], a[s][i]] = [a[s][i], a[s][i - 1]]; }
  else return;
  items(s); teken();
});
$('#copy').onclick = () => kopieer(yaml(), 'Automation YAML copied');
$('#dl').onclick = () => download(`${(a.alias || 'automation').toLowerCase().replace(/[^a-z0-9]+/g, '_')}.yaml`, yaml(), 'text/yaml;charset=utf-8');
$('#deel').onclick = () => kopieer(location.href.split('#')[0] + '#a=' + btoa(unescape(encodeURIComponent(JSON.stringify(a)))), 'Share link copied');
$('#nieuw').onclick = () => { if (confirm('Start with an empty automation?')) { a = leeg(); alles(); } };
$('#plak').onclick = () => { $('#plakbox').hidden = !$('#plakbox').hidden; $('#plaktekst').focus(); };
$('#laad').onclick = () => {
  try {
    let o = jsyaml.load($('#plaktekst').value);
    if (Array.isArray(o)) o = o[0];
    if (!o || typeof o !== 'object') throw new Error('This does not look like an automation.');
    const tr = [].concat(o.triggers ?? o.trigger ?? []), co = [].concat(o.conditions ?? o.condition ?? []), ac = [].concat(o.actions ?? o.action ?? []);
    if (!tr.length && !ac.length) throw new Error('No triggers or actions found.');
    const lees = (sec, x, soortVan) => {
      const s = soortVan(x), d = SOORT[sec][s];
      const v = d && d.van({ ...x, ...(sec === 'actions' && x.service ? { action: x.service } : {}) });
      if (v) return nieuw(sec, s, v);
      return { type: 'raw', yaml: jsyaml.dump(x, { lineWidth: 120 }).trim() };
    };
    const actSoort = (x) => { const s = x.service || x.action; for (const [k, d] of Object.entries(ACT)) { if (k === 'call') continue; if (d.van({ ...x, action: s })) return k; } return typeof s === 'string' ? 'call' : 'raw'; };
    a = { alias: o.alias || '', desc: o.description || '', mode: o.mode || 'single', syntax: o.trigger && !o.triggers ? 'old' : 'new',
      triggers: tr.map((x) => lees('triggers', x, (y) => y.trigger || y.platform)), conditions: co.map((x) => typeof x === 'string' ? { type: 'raw', yaml: x } : lees('conditions', x, (y) => y.condition)),
      actions: ac.map((x) => lees('actions', x, actSoort)) };
    $('#plakbox').hidden = true; $('#plakfout').textContent = ''; alles(); toast('Automation loaded');
  } catch (err) { $('#plakfout').textContent = err.message.split('\n')[0]; }
};
alles();
