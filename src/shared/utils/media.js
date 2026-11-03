// Converts an SRT timestamp ("00:00:04,639") to milliseconds.
export const timeStringToMillis = (timeString) => {
  const [hours, minutes, seconds, millis] = timeString.split(/[:,.]/).map((part) => parseInt(part, 10));
  return hours * 3600000 + minutes * 60000 + seconds * 1000 + millis;
};

// Parses an SRT file into [{ start, end, text }] (times in milliseconds).
export const parseSRT = (data) => {
  if (!data) return [];
  const captions = [];
  data
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .forEach((block) => {
      const lines = block.split('\n').filter((line) => line.trim() !== '');
      const timeLineIndex = lines.findIndex((line) => line.includes('-->'));
      if (timeLineIndex === -1) return;
      const match = lines[timeLineIndex].match(
        /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/
      );
      if (!match) return;
      captions.push({
        start: timeStringToMillis(match[1]),
        end: timeStringToMillis(match[2]),
        text: lines.slice(timeLineIndex + 1).join('\n'),
      });
    });
  return captions;
};

export const findCaptionAt = (captions, positionMillis) => {
  const caption = captions.find((cap) => positionMillis >= cap.start && positionMillis < cap.end);
  return caption ? caption.text : '';
};

// Formats milliseconds as "MM:SS".
export const formatMillis = (millis) => {
  const totalSeconds = Math.max(0, Math.floor((millis || 0) / 1000));
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`;
};
