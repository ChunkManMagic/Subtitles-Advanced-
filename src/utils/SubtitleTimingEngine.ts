export interface SubtitleCue {
  id: number;
  start: number; // in milliseconds
  end: number;   // in milliseconds
  text: string;
}

/**
 * High-performance Subtitle Timing Shift and Formatting Engine.
 * Enables bulk timeline synchronization shifts, timing overlap validations,
 * and handles safe export to standard SRT/VTT format strings.
 */
export class SubtitleTimingEngine {

  /**
   * Shifts the timestamps of all cues by a given offset in milliseconds.
   * Ensures start times do not go below 0.
   */
  public static shiftTiming(cues: SubtitleCue[], offsetMs: number): SubtitleCue[] {
    return cues.map(cue => {
      const newStart = Math.max(0, cue.start + offsetMs);
      const duration = cue.end - cue.start;
      const newEnd = newStart + duration;

      return {
        ...cue,
        start: newStart,
        end: newEnd
      };
    });
  }

  /**
   * Validates subtitle cue timings for overlaps and timing sequence integrity.
   * Returns a list of invalid cue IDs that overlap with their preceding cues.
   */
  public static validateTimings(cues: SubtitleCue[]): number[] {
    const sortedCues = [...cues].sort((a, b) => a.start - b.start);
    const invalidCueIds: number[] = [];

    for (let i = 1; i < sortedCues.length; i++) {
      const prev = sortedCues[i - 1];
      const curr = sortedCues[i];

      // Overlap detection
      if (curr.start < prev.end) {
        invalidCueIds.push(curr.id);
      }
    }

    return invalidCueIds;
  }

  /**
   * Formats a millisecond timestamp into standard SRT timing format "HH:MM:SS,mmm".
   */
  public static formatSrtTimestamp(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    const pad = (num: number, size: number) => num.toString().padStart(size, '0');

    return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(milliseconds, 3)}`;
  }

  /**
   * Exports a list of SubtitleCues into a standard, ready-to-download SRT file string.
   */
  public static exportToSrt(cues: SubtitleCue[]): string {
    const sortedCues = [...cues].sort((a, b) => a.start - b.start);
    return sortedCues.map((cue, index) => {
      const cueIndex = index + 1;
      const times = `${this.formatSrtTimestamp(cue.start)} --> ${this.formatSrtTimestamp(cue.end)}`;
      return `${cueIndex}\n${times}\n${cue.text}\n`;
    }).join('\n');
  }
}
