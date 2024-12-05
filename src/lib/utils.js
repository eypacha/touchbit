import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function calculateSampleRate(targetBPM = 120, operand = 4, operator = '>>') {
  const samplesPerCycle = 256;
  
  let cyclesPerMinute;
  if (operator === '>>') {
    cyclesPerMinute = targetBPM * Math.pow(2, operand);
  } else if (operator === '/') {
    cyclesPerMinute = targetBPM * operand;
  }
  
  const samplesPerSecond = (cyclesPerMinute * samplesPerCycle) / 60;
  const cyclesPerSecond = samplesPerSecond / samplesPerCycle;
  
  console.log({
    bpm: eval(`${cyclesPerMinute} ${operator} ${operand}`),
    expression: `t ${operand} ${operator}`,
    cps: cyclesPerSecond,
    cpm: cyclesPerMinute,
    samplerate: samplesPerSecond,
  });

  return samplesPerSecond;
}

export function calculateBPM(samplesPerSecond = 8000, operand = 4, operator = '>>') {
  // Calculamos los ciclos basados en el sample rate
  const samplesPerCycle = 256;
  const cyclesPerSecond = samplesPerSecond / samplesPerCycle;
  const cyclesPerMinute = cyclesPerSecond * 60;
  
  const bpmCalculated = eval(`${cyclesPerMinute} ${operator} ${operand}`);

    console.log({
      samplerate: samplesPerSecond,
      cps: cyclesPerSecond,
      cpm: cyclesPerMinute,
      expression: `t ${operand} ${operator}`,
      bpm: bpmCalculated,
    });
  
  return bpmCalculated;
}