// Inspection content for every clickable component. Ids match the 3D scene.

export type Kind = 'tank' | 'pump' | 'pipe' | 'filter' | 'sensor' | 'valve' | 'roof' | 'panel' | 'gutter' | 'generic';

export interface Info {
  title: string;
  group: string;
  kind: Kind;
  purpose: string;
  how: string;
  connects: string;
  io: string;
  hardware: string;
  sensors: string;
  principle: string;
  failures: string;
}

const houseInfo = (base: string, n: number): Info | undefined => {
  const h = `House ${n}`;
  switch (base) {
    case 'ug-tank':
      return {
        title: `${h} underground household tank`,
        group: 'Individual house',
        kind: 'tank',
        purpose: `Local buffer for ${h}. It holds the water this house is allowed to use, supplied from the community tank.`,
        how: 'Filled by its own branch pipeline when its valve is open. Drained by the household pump that lifts water to the rooftop tank.',
        connects: `Branch pipeline (from manifold), household pump ${n} (suction side), level sensor ${n}.`,
        io: 'In: branch pipeline from the community system. Out: suction line to household pump.',
        hardware: 'Reinforced concrete or HDPE tank, approx. 2,000 L (demonstration size).',
        sensors: `Ultrasonic level sensor mounted on the tank lid (ug-sensor-${n}).`,
        principle: 'Stored water is a gravity-free reservoir: the pump, not elevation, provides the pressure needed to reach the roof.',
        failures: 'Leakage, sediment build-up, algae growth if uncovered, contamination through a cracked lid.',
      };
    case 'ug-sensor':
      return {
        title: `${h} underground tank level sensor`,
        group: 'Individual house',
        kind: 'sensor',
        purpose: 'Measures the water level in the underground household tank so the controller knows when to open the valve or stop the pump.',
        how: 'Emits an ultrasonic pulse downward and times the echo from the water surface. Distance is converted to a percentage level.',
        connects: `ESP32 controller (I²C / digital input), valve ${n} and household pump ${n} logic.`,
        io: 'Out: distance (cm) → level (%) to the ESP32.',
        hardware: 'HC-SR04 class ultrasonic transducer or waterproof JSN-SR04T.',
        sensors: 'Self (ultrasonic).',
        principle: 'Time-of-flight: distance = speed of sound × echo time ÷ 2.',
        failures: 'Foam or condensation can absorb the echo; sensor fouling; wiring fault reads as "empty".',
      };
    case 'hpump':
      return {
        title: `${h} household distribution pump`,
        group: 'Individual house',
        kind: 'pump',
        purpose: `Lifts water from the underground tank of ${h} up to its rooftop tank. Each house has its own pump.`,
        how: 'Switched by the relay when the rooftop tank is low and the underground tank has water. Stops at high rooftop level.',
        connects: `Suction from ug-tank-${n}; rising main (lift-${n}) to roof-tank-${n}; relay channel.`,
        io: 'In: water from underground tank. Out: pressurised water up to the rooftop tank.',
        hardware: 'Submersible or self-priming centrifugal pump (≈0.5 HP class), 12 V / 230 V through relay.',
        sensors: 'Rooftop level sensor and underground level sensor provide the run conditions.',
        principle: 'Centrifugal impeller adds pressure to lift water against gravity to the roof height (≈4 m here).',
        failures: 'Dry running, blocked suction strainer, air lock, motor overheating, check valve failure.',
      };
    case 'nrv':
      return {
        title: `${h} non-return valve`,
        group: 'Individual house',
        kind: 'valve',
        purpose: 'Stops water flowing back down the rising main when the pump is switched off, so the rooftop tank does not drain back.',
        how: 'A spring- or flap-loaded disc opens only in the forward direction.',
        connects: `Discharge of hpump-${n}, on lift-${n}.`,
        io: 'In: pump discharge. Out: rising main to rooftop.',
        hardware: 'Brass or PVC check valve, 20 mm.',
        sensors: 'None.',
        principle: 'Pressure difference opens the disc forward; reverse flow closes it mechanically.',
        failures: 'Stuck open (pump loses prime) or stuck closed (no flow).',
      };
    case 'valve':
      return {
        title: `${h} automatic control valve (solenoid)`,
        group: 'Individual house',
        kind: 'valve',
        purpose: `Controls the supply of water from the main pipeline into the underground tank of ${h}. Opens when ${h} needs water.`,
        how: 'The ESP32 drives a relay that energises the solenoid coil; the plunger lifts and water flows. Spring returns it closed when de-energised.',
        connects: `Branch pipeline ${n} (branch-${n}); ug-tank-${n} inlet; ESP32 relay channel.`,
        io: 'In: control signal from ESP32 (open/close). Out: flow to underground tank when open.',
        hardware: 'Normally-closed 12 V DC solenoid valve, 20 mm, with relay driver.',
        sensors: `Tank level sensor ${n} decides when to open/close.`,
        principle: 'Electromagnetic force moves a plunger against a return spring, opening the seat.',
        failures: 'Coil burnout, debris stuck in seat, low supply voltage causing partial opening.',
      };
    case 'lift':
      return {
        title: `${h} underground-to-rooftop pipeline`,
        group: 'Individual house',
        kind: 'pipe',
        purpose: `Carries water from the underground tank of ${h} to its rooftop tank through its own pump and non-return valve.`,
        how: 'Suction → pump → non-return valve → rising main along the outside wall → rooftop tank inlet.',
        connects: `ug-tank-${n}, hpump-${n}, nrv-${n}, roof-tank-${n}.`,
        io: 'In: underground water. Out: rooftop tank.',
        hardware: 'PVC pipe, 20–25 mm, with pipe clips and roof penetration sealed.',
        sensors: 'Flow sensor optional on this line (not in demo).',
        principle: 'Pressurised flow in a pipe; head loss is overcome by the pump.',
        failures: 'Leaks at joints, pipe burst under pump pressure, air pockets.',
      };
    case 'roof-tank':
      return {
        title: `${h} rooftop storage tank`,
        group: 'Individual house',
        kind: 'tank',
        purpose: `Gravity-fed supply for the bathrooms and kitchen of ${h}.`,
        how: 'Refilled by its own pump. Water flows down by gravity to household outlets when taps open.',
        connects: `lift-${n} inlet, roof-sensor-${n}, household outlets.`,
        io: 'In: pumped water from the underground tank. Out: gravity supply to taps.',
        hardware: 'Polyethylene (PE) water tank, 1,000 L (demonstration size), on a steel stand.',
        sensors: `Ultrasonic level sensor on the lid (roof-sensor-${n}).`,
        principle: 'Water pressure equals the height of the water column above the outlet.',
        failures: 'Overflow when float valve fails, algae under direct sunlight, structural load on roof.',
      };
    case 'roof-sensor':
      return {
        title: `${h} rooftop tank level sensor`,
        group: 'Individual house',
        kind: 'sensor',
        purpose: `Tells the controller when the rooftop tank of ${h} needs filling or is full.`,
        how: 'Ultrasonic time-of-flight measurement from the tank lid.',
        connects: `ESP32, hpump-${n} run logic.`,
        io: 'Out: level (%) to ESP32.',
        hardware: 'Waterproof ultrasonic sensor.',
        sensors: 'Self.',
        principle: 'Echo timing.',
        failures: 'Condensation on lid, sensor wiring failure.',
      };
    case 'outlets':
      return {
        title: `${h} household water outlets`,
        group: 'Individual house',
        kind: 'generic',
        purpose: 'Taps, shower and kitchen supply points fed by gravity from the rooftop tank.',
        how: 'Opening a tap draws water from the rooftop tank. Demand is simulated with the demand toggle.',
        connects: `roof-tank-${n} outlet pipe.`,
        io: 'In: rooftop tank. Out: bathrooms and kitchen.',
        hardware: 'Brass taps, PPR/PVC distribution pipe.',
        sensors: 'Demand is inferred from the rooftop level trend.',
        principle: 'Gravity head from the rooftop tank.',
        failures: 'Leaking taps, pressure loss on upper floors.',
      };
    case 'house-body':
      return {
        title: `${h} residence`,
        group: 'Individual house',
        kind: 'generic',
        purpose: `Residential building ${n}. Roof collects rain; the rooftop tank supplies the household.`,
        how: 'Rain falls on the roof, runs into the gutter and downpipe to the common collection line.',
        connects: `Rooftop collection (rain-${n}), rooftop tank (roof-tank-${n}).`,
        io: 'In: rainfall. Out: rainwater to gutter.',
        hardware: 'Masonry walls, RCC slab, sloping roof.',
        sensors: 'None.',
        principle: 'Roof surface collects rain; slope directs it to the gutter.',
        failures: 'Roof leaks, blocked gutters, bird droppings contaminating catchment.',
      };
    case 'rain':
      return {
        title: `Rainwater collection pipeline – House ${n}`,
        group: 'Rainwater collection',
        kind: 'pipe',
        purpose: `Carries rain from the roof of House ${n}, through the gutter, downpipe and first-flush diverter, to the common filter.`,
        how: 'Rooftop → gutter → downpipe → first-flush → trunk line under the village → filter inlet.',
        connects: `gutters, downpipes, first-flush, common trunk, filter.`,
        io: 'In: roof runoff. Out: filter inlet.',
        hardware: 'PVC pipes and fittings.',
        sensors: 'Flow sensor on trunk line (flow-sensor).',
        principle: 'Gravity drainage along a slight downward slope.',
        failures: 'Blockage by leaves, pipe cracks, sagging joints.',
      };
    case 'branch':
      return {
        title: `Branch pipeline to House ${n} underground tank`,
        group: 'Community distribution',
        kind: 'pipe',
        purpose: `One of three independent branches from the main distribution manifold. It supplies only House ${n}.`,
        how: 'Pressurised by the main distribution pump. Flow is enabled only when valve ' + n + ' is open.',
        connects: `Manifold, valve-${n}, ug-tank-${n}.`,
        io: 'In: manifold. Out: House ' + n + ' underground tank.',
        hardware: 'Buried PVC/HDPE pipe.',
        sensors: 'Flow monitored by the ESP32 (demo).',
        principle: 'Pump head drives water through the pipe to the valve.',
        failures: 'Burst pipe, valve not closing, ground settlement damage.',
      };
    default:
      return undefined;
  }
};

const FIXED: Record<string, Info> = {
  rooftop: {
    title: 'Rooftop catchment',
    group: 'Rainwater collection',
    kind: 'roof',
    purpose: 'Large sloped surface that receives rainfall and sends it to the gutters.',
    how: 'Rain runs down the sloped sheet roof to the eaves, where the gutter catches it.',
    connects: 'Gutters at each eave.',
    io: 'In: rainfall. Out: runoff to gutters.',
    hardware: 'Galvanised or RCC roof, sloped at about 20–30°.',
    sensors: 'Rain sensor on the site mast detects rainfall.',
    principle: 'Runoff coefficient: the roof area × rainfall intensity gives harvested volume.',
    failures: 'Dirty roof surface, roof leaks, debris accumulation.',
  },
  gutters: {
    title: 'Gutters',
    group: 'Rainwater collection',
    kind: 'gutter',
    purpose: 'Channel along the eave that collects roof runoff and directs it to the downpipe.',
    how: 'Slope along the gutter carries water toward the downpipe outlet.',
    connects: 'Rooftop → downpipe.',
    io: 'In: roof runoff. Out: downpipe.',
    hardware: 'Half-round PVC or galvanised gutter with leaf guard.',
    sensors: 'None.',
    principle: 'Gravity drainage with a slope of about 1:200.',
    failures: 'Leaves blocking, sagging brackets, overflow in heavy rain.',
  },
  downpipes: {
    title: 'Downpipes',
    group: 'Rainwater collection',
    kind: 'pipe',
    purpose: 'Vertical pipes that carry gutter water down the wall to ground level.',
    how: 'Water falls under gravity inside the vertical PVC pipe.',
    connects: 'Gutter → first-flush diverter.',
    io: 'In: gutter. Out: first-flush diverter.',
    hardware: 'PVC pipe, 75 mm.',
    sensors: 'None.',
    principle: 'Gravity drop.',
    failures: 'Joint separation, blockage at elbows.',
  },
  'first-flush': {
    title: 'First-flush diverter',
    group: 'Rainwater collection',
    kind: 'valve',
    purpose: 'Diverts the dirty first rain (dust, bird droppings, debris) away from the storage so it is not stored.',
    how: 'A standpipe fills first; a floating ball seals the outlet once the stand is full, so later clean water flows on.',
    connects: 'Downpipe → trunk line.',
    io: 'In: downpipe water. Out: clean water to trunk; first flush discharged to drain.',
    hardware: 'Vertical PVC tube with a float ball and drain valve.',
    sensors: 'None (mechanical).',
    principle: 'Standpipe volume determines how much dirty water is diverted before clean flow starts.',
    failures: 'Float stuck, standpipe full of sediment, diverter not emptying.',
  },
  'filter-mesh': {
    title: 'Mesh filter (screen)',
    group: 'Filtration',
    kind: 'filter',
    purpose: 'Removes leaves, twigs and large debris before water reaches the sand and gravel layers.',
    how: 'Water passes through a fine stainless-steel mesh on top of the chamber.',
    connects: 'Filter inlet → sand layer.',
    io: 'In: raw rainwater. Out: screened water.',
    hardware: 'Stainless-steel mesh (around 1 mm aperture).',
    sensors: 'None.',
    principle: 'Physical screening (sieving).',
    failures: 'Clogging: needs periodic cleaning.',
  },
  'filter-sand': {
    title: 'Sand filtration layer',
    group: 'Filtration',
    kind: 'filter',
    purpose: 'Removes fine suspended solids and turbidity.',
    how: 'Water percolates slowly through graded sand; particles are trapped in the pore spaces.',
    connects: 'Mesh → gravel.',
    io: 'In: screened water. Out: clearer water.',
    hardware: 'Clean river sand, 0.3–0.8 mm.',
    sensors: 'None.',
    principle: 'Depth filtration and biological activity in the top layer.',
    failures: 'Clogging, channelling, loss of sand if flow is too fast.',
  },
  'filter-gravel': {
    title: 'Gravel support layer',
    group: 'Filtration',
    kind: 'filter',
    purpose: 'Supports the sand and lets water drain evenly into the outlet.',
    how: 'Graded gravel, coarsest at the bottom, so sand does not wash out.',
    connects: 'Sand → charcoal.',
    io: 'In: sand-filtered water. Out: distributed water.',
    hardware: 'Graded gravel, 2–20 mm.',
    sensors: 'None.',
    principle: 'Graded support prevents migration of finer material.',
    failures: 'Gravel mixing into outlet if support is poorly graded.',
  },
  'filter-charcoal': {
    title: 'Activated charcoal layer',
    group: 'Filtration',
    kind: 'filter',
    purpose: 'Adsorbs odour, colour and some organic chemicals.',
    how: 'Porous carbon surface adsorbs dissolved organics as water passes.',
    connects: 'Gravel → filter outlet.',
    io: 'In: water from gravel. Out: polished water.',
    hardware: 'Granular activated carbon.',
    sensors: 'None.',
    principle: 'Adsorption onto a very high surface area carbon matrix.',
    failures: 'Exhausted carbon (needs replacement), bacterial growth if left wet.',
  },
  'filter-body': {
    title: 'Filtration chamber',
    group: 'Filtration',
    kind: 'filter',
    purpose: 'Common filter housing shared by all three houses. Rainwater from all roofs enters here before the community tank.',
    how: 'Layers are stacked inside a cylindrical housing: mesh (top), sand, gravel, charcoal (bottom).',
    connects: 'Trunk inlet and outlet to community tank.',
    io: 'In: raw rainwater. Out: filtered water.',
    hardware: 'GRP or concrete housing with access lid.',
    sensors: 'None.',
    principle: 'Multi-stage filtration: screening → depth filtration → adsorption.',
    failures: 'Clogged media, short-circuiting, lid leaking.',
  },
  'filter-outlet': {
    title: 'Filter outlet',
    group: 'Filtration',
    kind: 'pipe',
    purpose: 'Delivers filtered water from the chamber into the underground community tank.',
    how: 'Gravity outflow through the bottom outlet pipe.',
    connects: 'Filter chamber → community tank.',
    io: 'In: filtered water. Out: community tank.',
    hardware: 'PVC pipe with a gate valve.',
    sensors: 'None.',
    principle: 'Gravity outflow.',
    failures: 'Blockage, valve left closed.',
  },
  'filter-out': {
    title: 'Filter-to-community-tank pipeline',
    group: 'Filtration',
    kind: 'pipe',
    purpose: 'Carries filtered water from the chamber into the main underground tank.',
    how: 'Gravity flow from filter outlet to the tank wall inlet.',
    connects: 'Filter → community tank.',
    io: 'In: filter outlet. Out: community tank.',
    hardware: 'PVC pipe.',
    sensors: 'None.',
    principle: 'Gravity.',
    failures: 'Leaks at joints.',
  },
  'main-tank': {
    title: 'Main underground community tank',
    group: 'Community storage',
    kind: 'tank',
    purpose: 'Large shared reservoir that stores harvested rainwater for all three houses. It is separate from the six household tanks.',
    how: 'Receives filtered water from the chamber and releases it to the main pump line.',
    connects: 'Filter outlet (in), main line to pump (out), overflow pipe, main level sensor.',
    io: 'In: filtered rainwater. Out: main distribution line.',
    hardware: 'Buried RCC tank, approx. 20,000 L (demonstration size).',
    sensors: 'Ultrasonic level sensor on the top (main-sensor).',
    principle: 'Storage buffer that balances rainfall (variable) and demand (variable).',
    failures: 'Structural cracks, water quality decline, roots damaging walls.',
  },
  'main-sensor': {
    title: 'Main tank water-level sensor',
    group: 'Community storage',
    kind: 'sensor',
    purpose: 'Measures the level of the community tank so the pump is only run when water is available.',
    how: 'Ultrasonic echo from the water surface; the ESP32 converts the reading to a percentage.',
    connects: 'ESP32, main pump logic, valve logic.',
    io: 'Out: level (%).',
    hardware: 'Waterproof ultrasonic sensor on a mount.',
    sensors: 'Self.',
    principle: 'Echo timing.',
    failures: 'Sensor fouling, misreads from foam.',
  },
  overflow: {
    title: 'Overflow pipe',
    group: 'Community storage',
    kind: 'pipe',
    purpose: 'Safely releases surplus water if the community tank is full, so it does not pressurise or damage the tank.',
    how: 'Opens at the top of the tank and discharges to a drain.',
    connects: 'Main tank top → drain.',
    io: 'In: excess water. Out: drain.',
    hardware: 'PVC pipe, 50 mm.',
    sensors: 'None.',
    principle: 'Gravity overflow above the design water level.',
    failures: 'Blockage by insects or debris.',
  },
  'main-pump': {
    title: 'Main distribution pump',
    group: 'Community storage',
    kind: 'pump',
    purpose: 'Moves water from the community tank into the main line that branches to the three houses.',
    how: 'Starts when any household valve is open and the community tank has water. Stops when all valves close.',
    connects: 'Main tank → main line → manifold → three branch pipelines.',
    io: 'In: community tank. Out: pressurised main line.',
    hardware: 'Centrifugal pump, 1 HP class, 230 V through relay.',
    sensors: 'Flow sensor downstream (flow-sensor).',
    principle: 'Impeller adds kinetic energy and pressure to the water.',
    failures: 'Dry run, cavitation, seal failure, relay fault.',
  },
  'main-line': {
    title: 'Main distribution line & manifold',
    group: 'Community distribution',
    kind: 'pipe',
    purpose: 'Carries water from the community tank to the manifold, from which the three independent branches start.',
    how: 'Tank outlet → main pump → manifold. Branches split from the manifold.',
    connects: 'Main tank, main pump, branch-1, branch-2, branch-3.',
    io: 'In: community tank. Out: manifold.',
    hardware: 'PVC/HDPE pipe with a manifold tee.',
    sensors: 'Flow sensor on this line.',
    principle: 'Pressurised pipe flow.',
    failures: 'Leaks, pressure loss over long run.',
  },
  'flow-sensor': {
    title: 'Flow sensor',
    group: 'IoT infrastructure',
    kind: 'sensor',
    purpose: 'Measures how fast water is moving in the main line and in the rainwater trunk.',
    how: 'Hall-effect paddle wheel spins with flow; pulses per litre give the flow rate.',
    connects: 'ESP32 digital input; main line and trunk.',
    io: 'Out: pulses → litres per minute.',
    hardware: 'YF-S201-type Hall-effect flow sensor (demo).',
    sensors: 'Self.',
    principle: 'Pulse count proportional to flow.',
    failures: 'Air bubbles, scale on paddle, low flow below sensor threshold.',
  },
  'rain-sensor': {
    title: 'Rain sensor',
    group: 'IoT infrastructure',
    kind: 'sensor',
    purpose: 'Detects whether it is raining so the controller can start rainwater collection logic.',
    how: 'Resistive grid across the surface: water bridges the tracks and reduces resistance.',
    connects: 'ESP32 analogue input.',
    io: 'Out: wet/dry signal.',
    hardware: 'Resistive rain-drop sensor board.',
    sensors: 'Self.',
    principle: 'Conductivity of water changes resistance between tracks.',
    failures: 'Dirt or salt on grid, false triggers from dew.',
  },
  esp32: {
    title: 'ESP32 controller & IoT unit',
    group: 'IoT infrastructure',
    kind: 'panel',
    purpose: 'Reads all sensors, runs the control logic, drives relays, and publishes data to the dashboard over Wi-Fi.',
    how: 'Reads level and flow sensors, applies threshold logic, switches relays, publishes JSON telemetry.',
    connects: 'All sensors, relay module, pump circuit, solenoid valves, Wi-Fi network.',
    io: 'In: sensor signals. Out: relay commands, telemetry.',
    hardware: 'ESP32 DevKit (dual-core, Wi-Fi + Bluetooth).',
    sensors: 'Reads all level, flow, rain sensors.',
    principle: 'Closed-loop control: measure → compare with thresholds → actuate.',
    failures: 'Power loss, Wi-Fi drop (local logic keeps running), sensor disconnect.',
  },
  relay: {
    title: 'Relay module',
    group: 'IoT infrastructure',
    kind: 'panel',
    purpose: 'Lets the low-voltage ESP32 switch the high-current pumps and solenoid valves safely.',
    how: 'The ESP32 pulls a relay coil; the contacts close and power the device.',
    connects: 'ESP32 GPIO → relay → pumps and valves.',
    io: 'In: GPIO. Out: switched supply.',
    hardware: 'Opto-isolated multi-channel relay module.',
    sensors: 'None.',
    principle: 'Electromagnetic switching with galvanic isolation.',
    failures: 'Contact welding, coil driver fault.',
  },
  'pump-circuit': {
    title: 'Pump control circuit',
    group: 'IoT infrastructure',
    kind: 'panel',
    purpose: 'Power electronics and protection that drive the four pumps (main + three household).',
    how: 'Contactors/relays with overload protection; status is read back by the ESP32.',
    connects: 'Relay module, all pumps, ESP32 status inputs.',
    io: 'In: control signals. Out: pump supply.',
    hardware: 'Contactors, thermal overload, fuses, MCB.',
    sensors: 'Current sensing (optional, not in demo).',
    principle: 'Interlocks prevent dry running and simultaneous conflicting commands.',
    failures: 'Overload trip, contactor failure.',
  },
  wifi: {
    title: 'Wi-Fi connectivity',
    group: 'IoT infrastructure',
    kind: 'panel',
    purpose: 'Sends telemetry to the monitoring dashboard and receives remote commands.',
    how: 'ESP32 joins the local Wi-Fi network and publishes MQTT messages to a broker.',
    connects: 'ESP32 → Wi-Fi router → MQTT broker → dashboard.',
    io: 'Out: telemetry. In: commands.',
    hardware: 'Built-in ESP32 Wi-Fi radio.',
    sensors: 'None.',
    principle: 'IEEE 802.11 radio link.',
    failures: 'Weak signal, router reboot, broker down (device keeps local control).',
  },
};

const BASE_REGEX = /^(.+)-(\d)$/;

export function getInfo(id: string): Info | undefined {
  if (FIXED[id]) return FIXED[id];
  const m = id.match(BASE_REGEX);
  if (!m) return undefined;
  const base = m[1];
  const n = Number(m[2]);
  // Solenoid valves are named valve-N; they are hardware-level solenoids.
  if (base === 'valve' || base === 'ug-tank' || base === 'ug-sensor' || base === 'hpump' || base === 'nrv' ||
      base === 'lift' || base === 'roof-tank' || base === 'roof-sensor' || base === 'outlets' ||
      base === 'house-body' || base === 'rain' || base === 'branch') {
    return houseInfo(base, n);
  }
  return undefined;
}

/** Pipelines (flow path ids) that should glow when a component is selected. */
export function connectedPaths(id: string): string[] {
  const m = id.match(BASE_REGEX);
  if (m) {
    const base = m[1];
    const n = m[2];
    switch (base) {
      case 'ug-tank':
        return [`branch-${n}`, `lift-${n}`];
      case 'ug-sensor':
        return [`branch-${n}`];
      case 'valve':
        return [`branch-${n}`];
      case 'hpump':
      case 'nrv':
      case 'roof-tank':
      case 'roof-sensor':
      case 'lift':
        return [`lift-${n}`];
      case 'rain':
        return [`rain-${n}`];
      case 'branch':
        return [`branch-${n}`];
      default:
        return [];
    }
  }
  switch (id) {
    case 'rooftop':
    case 'gutters':
    case 'downpipes':
    case 'first-flush':
      return ['rain-1', 'rain-2', 'rain-3'];
    case 'filter-mesh':
    case 'filter-sand':
    case 'filter-gravel':
    case 'filter-charcoal':
    case 'filter-body':
    case 'filter-outlet':
    case 'filter-out':
      return ['rain-1', 'rain-2', 'rain-3', 'filter-out'];
    case 'main-tank':
    case 'main-sensor':
    case 'main-pump':
    case 'main-line':
    case 'overflow':
      return ['main-line', 'branch-1', 'branch-2', 'branch-3'];
    case 'flow-sensor':
      return ['main-line'];
    default:
      return [];
  }
}

export const INSPECTABLE_IDS = [
  'rooftop', 'gutters', 'downpipes', 'first-flush',
  'filter-mesh', 'filter-sand', 'filter-gravel', 'filter-charcoal', 'filter-outlet',
  'main-tank', 'main-sensor', 'overflow', 'main-pump', 'main-line', 'flow-sensor',
  'esp32', 'relay', 'pump-circuit', 'wifi', 'rain-sensor',
];
