import { parseSRT, findCaptionAt, formatMillis, timeStringToMillis } from '@shared/utils/media';

describe('timeStringToMillis', () => {
  it('converts SRT timestamps', () => {
    expect(timeStringToMillis('00:00:04,639')).toBe(4639);
    expect(timeStringToMillis('01:02:03.004')).toBe(3723004);
  });
});

describe('parseSRT', () => {
  const srt = '1\r\n00:00:01,000 --> 00:00:02,500\r\nHello\r\n\r\n2\r\n00:00:03,000 --> 00:00:04,000\r\nMulti\r\nline\r\n';

  it('parses blocks with CRLF line endings', () => {
    expect(parseSRT(srt)).toEqual([
      { start: 1000, end: 2500, text: 'Hello' },
      { start: 3000, end: 4000, text: 'Multi\nline' },
    ]);
  });

  it('handles blocks without an index line and empty input', () => {
    expect(parseSRT('00:00:00,000 --> 00:00:01,000\nNo index')).toEqual([
      { start: 0, end: 1000, text: 'No index' },
    ]);
    expect(parseSRT('')).toEqual([]);
    expect(parseSRT(null)).toEqual([]);
  });

  it('finds the caption for a playback position', () => {
    const captions = parseSRT(srt);
    expect(findCaptionAt(captions, 1500)).toBe('Hello');
    expect(findCaptionAt(captions, 2500)).toBe('');
    expect(findCaptionAt(captions, 3999)).toBe('Multi\nline');
  });
});

describe('formatMillis', () => {
  it('formats as MM:SS', () => {
    expect(formatMillis(0)).toBe('00:00');
    expect(formatMillis(65999)).toBe('01:05');
    expect(formatMillis(undefined)).toBe('00:00');
    expect(formatMillis(-10)).toBe('00:00');
  });
});
