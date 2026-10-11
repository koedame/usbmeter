---
name: usbmeter-analysis
description: Analyse a USB Meter Web recording from a Bluetooth USB tester such as the J7-C, given as the export ZIP (README.md and readings.csv) or a usb-meter CSV with voltage_v, current_a and power_w columns.
---

# How to analyse a USB Meter Web recording

[USB Meter Web](https://github.com/koedame/usbmeter) records what a Bluetooth USB tester (J7-C,
ATorch UD18 and relatives, ATorch AC and DC meters) sends, a reading every second or so. Its
**Export for AI** button downloads a ZIP with two files:

- `README.md`: what was recorded (meter, purpose, notes, a summary of the rows), followed by
  this guide
- `readings.csv`: one row per reading

## Start here

1. Read "This recording" and "Summary of the rows" in the export's `README.md`. They say which
   meter it was, what the person was measuring and what they want you to know. With only a CSV
   and no README, ask what was measured, or work it out from the data and say that you did.
2. Load `readings.csv` with code when you can run code, and compute; do not estimate sums by
   eye. When you cannot run code, rely on the summary in `README.md` and say that the numbers
   come from there.
3. Do the analysis under the heading that matches "What was measured" (see "Analyses").
4. Write the answer as described under "Report".

If "Readings" says the rows were made up by the page's demo, say so before anything else. Demo
rows show what an export looks like; they measure nothing.

## Columns of readings.csv

Plain CSV, UTF-8, one header row. An empty cell means that this kind of meter does not report
the quantity.

| Column | Unit | Meaning |
|---|---|---|
| `time` | ISO 8601, UTC | When the page received the reading |
| `elapsed_s` | s | Seconds since the recording started. The page keeps the latest 100,000 rows, so a very long recording starts above 0 and `README.md` has a "Start missing" row |
| `voltage_v` | V | Voltage at the meter |
| `current_a` | A | Current through the meter |
| `power_w` | W | USB and DC meters: voltage × current of that row. AC meters: real power as the meter measured it |
| `energy_wh` | Wh | The meter's energy counter. Empty for DC meters |
| `capacity_ah` | Ah | The meter's charge counter. USB meters only |
| `temperature_c` | °C | Sensor inside the meter |
| `d_plus_v`, `d_minus_v` | V | Voltage on the USB data lines D+ and D−. USB meters only |
| `frequency_hz`, `power_factor` | Hz, none | AC meters only |

## What the numbers can and cannot tell

- **Where the meter sits.** It sees the voltage at its own position and the current through
  it. The device gets less voltage than the meter shows by the drop in whatever comes after
  the meter; the charger puts out more by the drop in whatever comes before it.
- **Steps.** USB meters report in steps of 0.01 V, 0.01 A, 0.001 Ah, 0.01 Wh and 1 °C. AC
  meters: 0.1 V, 0.001 A, 0.1 W, and an energy counter that moves in steps of 10 Wh. DC meters:
  0.1 V and 0.001 A. A current below one step reads 0, so a USB meter cannot measure sleep
  currents of a few milliamps. Do not report more digits than the steps carry.
- **A reading every second or so.** `README.md` gives the usual interval of the recording.
  Each row is the value at that moment, not an average. Anything shorter than a few seconds
  (inrush, ripple, the handshake of a fast-charging protocol) does not show.
- **The meter is part of the circuit.** A J7-C takes 10 to 20 mA for itself and adds about
  0.1 Ω to the path, so at 3 A the voltage after it is about 0.3 V lower than before it.
- **Small currents are rough.** A J7-C that was tested stayed within 0.02 A up to 3 A, which
  is a large share of a reading below 0.1 A.
- **The counters are the meter's own.** `energy_wh` and `capacity_ah` keep counting across
  recordings until someone resets them on the meter, so use differences between rows, never
  the absolute value. A counter that goes back was reset. For a total over the whole recording
  prefer the counter difference when there is one; for a part of the recording, or when the
  counter was reset or its step is too coarse, add up `power_w` (or `current_a`) times the time
  between rows.
- **Pauses.** A jump in `time` means rows are missing, because Bluetooth dropped or the page
  was disconnected for a while. A meter that stayed powered kept counting meanwhile, so the
  counters cover a pause while the rows do not.
- **Temperature** is the inside of the meter, which warms with the current through it. It is a
  trend, not the temperature of the charger, the cable or the battery.
- **Only what flows through the meter is measured.** A charger rated 65 W shows 18 W when the
  device asks for 18 W. What a charger or a cable *can* deliver only shows under a load that
  asks for it.

## What D+ and D− say (USB meters)

Before USB Power Delivery, chargers told devices how much current they may draw through the
voltages on the two data lines, and some fast-charging schemes ask for a higher voltage there.

| D+ | D− | What it usually is |
|---|---|---|
| about 2.0 V | about 2.0 V | Apple charger, 0.5 A |
| about 2.0 V | about 2.7 V | Apple charger, 1 A |
| about 2.7 V | about 2.0 V | Apple charger, 2.1 A |
| about 2.7 V | about 2.7 V | Apple charger, 2.4 A |
| about 1.2 V | about 1.2 V | Samsung charger for tablets |
| about 0.6 V | about 0 V | Quick Charge 2.0 or 3.0 asking for 5 V |
| about 3.3 V | about 0.6 V | Quick Charge asking for 9 V |
| about 0.6 V | about 0.6 V | Quick Charge asking for 12 V |
| about 3.3 V | about 3.3 V | Quick Charge asking for 20 V (class B chargers) |
| about 0.6 V | about 3.3 V | Quick Charge 3.0 continuous mode (voltage moves in 0.2 V steps) |
| equal and clearly above 0 V, at any other voltage | | Lines tied together: a dedicated charging port (USB BC 1.2), up to 1.5 A |
| about 0 V | about 0 V | Nothing is signalled on the data lines |

The Quick Charge rows count only together with the voltage they ask for. 0.6 V on both lines
while `voltage_v` stays at 5 V is a dedicated charging port (the tied lines carry the device's
own detection voltage), not a request for 12 V.

USB Power Delivery negotiates on the CC wire of a USB-C cable, which these meters do not show.
A voltage of 9, 12, 15 or 20 V with quiet data lines points to Power Delivery; say that this is
an inference. Treat the table as a hint and name the voltages you saw. The manual of the J7-C
gives 0 to 2.999 V as its range for the data lines, so a 3.3 V level may read as about 3 V.

## Analyses

Pick the heading that matches "What was measured". Every analysis starts the same way: plot or
scan voltage, current and power over time, find the stretches where they hold steady and the
moments where they step, and note pauses.

### Charging a device

The person wants to know how the charge went: how fast, how long, how much went in, and
whether it finished.

- **Voltage levels.** List the levels the voltage settled on (5, 9, 12, 15, 20 V or something
  in between) with the time spent at each. A step up shortly after the start is a fast-charging
  handshake that succeeded; staying at 5 V means no higher voltage was agreed.
- **Phases.** Find the stretch of highest power, the point where the current starts to fall
  steadily (the battery is getting full and the device tapers the charge) and the point where
  the current settles near zero or at a small steady value (finished, or only running the
  device). Give the time and the power at each.
- **Totals.** Energy (Wh) and charge (Ah) that went through the meter, peak and mean power.
- **Milestones.** Time until half and until 80 % of the total energy was delivered. This
  tracks the battery level only when the recording covers a whole charge from nearly empty to
  full; say when it does not.
- **Reading it right.** The energy went into the device, not all of it into the battery: part
  runs the device and part is lost as heat while charging. Ah at 9 V are not Ah of a 3.8 V
  battery. To compare with a battery's rating, compare Wh with Wh (rated Wh, or rated mAh ×
  nominal cell voltage ÷ 1000), and expect the delivered Wh to be higher than what the battery
  stores.

### Testing a charger or power supply

The person wants to know whether the charger delivers what it promises and holds its voltage.

- **Voltage under load.** Relate voltage to current across the rows: the voltage at the lowest
  and at the highest current, and the slope between them in mΩ (the output resistance of the
  charger plus everything up to the meter). For a 5 V output, compare with the 4.75 to 5.25 V
  that USB 2.0 and BC 1.2 allow at the charger (USB-C allows up to 5.5 V).
- **Sustained power.** The highest power it held, for how long, and whether power steps down
  later while the load should still be asking (thermal throttling often shows as a step down
  after some minutes). A few minutes do not prove that a charger sustains a load; an hour at a
  steady load does.
- **Stability.** How much the voltage moves while the current is steady.
- **Protocol.** What D+ and D− say, and which voltage levels appeared.
- **Reading it right.** The recording shows what the load drew. It can show that a charger
  failed to hold a load, not that it could have delivered more than was asked. A phone changes
  what it draws all the time; a steady load (an electronic load or a resistor) tests a charger
  far better. Check the notes for what the load was.

### Measuring a power bank or battery

The person wants the real capacity and how it compares with the label.

- **Which direction.** Work out from the notes whether the power bank was being discharged
  into a load (meter on its output) or charged (meter at the charger, the cable to the power
  bank after it).
- **Discharge.** Energy (Wh) and charge (Ah) from the start until the power bank switched its
  output off. A meter that is fed by the power bank loses power at that moment, so the rows
  simply end; they do not show the current falling to zero. A steady current with a sagging
  voltage before the end means it ran empty. A current that had fallen to a small value means
  the load stopped asking, and many power banks switch off below a small current, so that is
  not the whole capacity. Neither is a recording that someone stopped while current still
  flowed. The notes should say which it was; ask when they do not.
- **Against the label.** The mAh on a power bank count charge at the cell voltage (about 3.7 V),
  not at the 5 V or more of the output, so comparing mAh with mAh makes every power bank look
  bad: about 70 % of the printed mAh at a 5 V output is as much as a good one delivers. Compare
  energy instead: rated Wh (printed, or rated mAh × 3.7 ÷ 1000) against delivered Wh, and give
  the ratio.
- **Charge and discharge together.** With recordings of both, energy out ÷ energy in is the
  round-trip efficiency. Energy in is measured at the charger and includes the loss in the
  cable to the power bank, so the ratio is a lower bound.
- **Reading it right.** The result depends on the load: a higher current gives less energy.
  Name the mean current and voltage the test ran at.

### Checking a cable

The person wants to know how much voltage a cable loses, or which of two cables is better.

- **Where the meter was.** Find out from the notes first. A meter sees the loss in a cable
  only when the cable comes before it: charger, cable, meter, load. That needs a meter with an
  input socket for the cable (a J7-C has USB-C and micro-USB inputs besides its plug). A meter
  plugged straight into the charger has the cable after it; then the loss in the cable does
  not show in `voltage_v` at all.
- **Cable before the meter, two recordings** with the same charger and the same load, one with
  the cable and one without: the difference in voltage at the same current, divided by that
  current, is the resistance of the cable. Against a reference cable instead of none, it is
  the extra resistance over that cable. Give it in mΩ and as the drop at 1 A and at 3 A.
- **Cable before the meter, one recording** with a load that varies: the slope of voltage
  against current is the resistance of everything before the meter, charger included. That is
  an upper bound for the cable, unless the charger raises its voltage with the current.
- **Cable after the meter.** Compare what the same device draws through each cable from the
  same battery level: a lower current, or a step down from a fast-charging voltage, points to
  the weaker cable. This ranks cables; it gives no resistance.
- **Reading it right.** One step of 0.01 V at 1 A is 10 mΩ, so small differences between good
  cables drown in the steps. Use the highest steady current available and average many rows.
  Some chargers raise their voltage with the current to make up for cable loss, and a weak
  charger sags by itself; either distorts the result, so a comparison ranks cables more
  reliably than it measures one.

### Power draw of a device or project

The person wants to know how much a device draws: on average, at peak and when idle.

- **Levels.** Mean, peak and the typical idle power and current. When the draw switches between
  states (idle, active, transmitting), find the levels and the share of time spent in each.
- **Supply.** The lowest voltage and what the current was at that moment. A dip that comes with
  a current peak points to a weak supply or cable (a Raspberry Pi, for one, warns of
  undervoltage a little above 4.6 V).
- **Cycles.** If the pattern repeats, its period and the energy of one cycle.
- **Projections.** Energy per hour and per day. Runtime on a battery: battery Wh × an honest
  conversion efficiency ÷ mean power; ask for the battery size when it is not in the notes.
- **Reading it right.** Currents below the meter's step read 0, so sleep modes look like no
  draw at all, and a mean that includes such stretches is too low. Say which part of the answer
  rests on rows at or near zero.

### Power use of an appliance

AC meters. The person wants to know what an appliance costs to run.

- **Levels.** Mean and peak power, and standby power when the appliance was idle during part of
  the recording.
- **Cycles.** For appliances that switch on and off (fridge, heater, pump): on-time share and
  the power while on.
- **Energy.** Wh over the recording, added up from `power_w` (the meter's counter moves in
  steps of 10 Wh, too coarse for short recordings), and projected to a day and a year. Give the
  cost when the notes contain a price per kWh; otherwise ask or leave it out.
- **Power factor**, when it is far from 1, and what that means for the current drawn.
- **Reading it right.** A projection from a short recording assumes the appliance keeps doing
  what it did. Say how long the recording was and whether it covered whole cycles.

### Something else

Describe what the recording shows (levels, steps, trends, totals), point out what stands out,
and ask what the person wants to find out.

## Report

- Answer in the language the person writes in.
- Start with the answer to their question in one or two sentences, with the numbers that carry
  it and their units.
- Then a small table of the key figures, and a chart of voltage, current and power over time
  with the phases marked, when you can draw one.
- Then how you got there, briefly: which rows, which totals, which assumptions.
- End with what the recording cannot tell, and how to measure next time to find out.
- Keep inferences apart from measurements. "The voltage rose to 9 V after 2 s" is measured;
  "the charger uses Quick Charge" is inferred.

## Where the figures come from

- Data-line voltages of Apple, Samsung and BC 1.2 chargers: Infineon AN92554, table 1
  (<https://www.infineon.com/dgdl/Infineon-AN92554_Implementing_Battery_Charging_Features_using_HX3-ApplicationNotes-v03_00-EN.pdf>)
  and Texas Instruments SLVA520 (<https://ti.com/lit/pdf/slva520>).
- Quick Charge levels: onsemi NCP4371 datasheet, table 4
  (<https://www.onsemi.com/pdf/datasheet/ncp4371-d.pdf>).
- The J7-C's own draw, resistance and accuracy: a review with measurements at
  <https://lygte-info.dk/review/USBmeter%20USB%20Digital%20Tester%20J7-c%20UK.html>.
- The 70 % figure for power banks: <https://lygte-info.dk/info/usbPowerSupplyTestHow%20UK.html>.
