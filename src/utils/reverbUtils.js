/**
 * createImpulseResponse
 * @param {AudioContext} context
 * @param {number} durationSeconds
 * @param {number} decay - decay exponent
 * @param {number} channels
 * @returns {AudioBuffer}
 */
export function createImpulseResponse(context, durationSeconds = 2.0, decay = 2.0, channels = 2) {
  const sampleRate = context.sampleRate;
  const length = Math.floor(sampleRate * durationSeconds);
  const irBuffer = context.createBuffer(channels, length, sampleRate);

  for (let channel = 0; channel < channels; channel++) {
    const channelData = irBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // noise-based exponential decay
      const n = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      channelData[i] = n;
    }
  }

  return irBuffer;
}
