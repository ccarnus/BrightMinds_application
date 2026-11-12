/** 2161737 -> "2.2M", 298405 -> "298K", 950 -> "950". */
export const formatCount = (value) => {
  const number = Number(value) || 0;
  if (number >= 1e6) {
    const millions = number / 1e6;
    return `${millions >= 10 ? Math.round(millions) : millions.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (number >= 1e3) return `${Math.round(number / 1e3)}K`;
  return String(number);
};

const worksOf = (topic) => Number(topic?.metrics?.openalex?.worksLast12Months) || 0;

/**
 * Topics of a lab with their research level (0-1) among them, on a log scale, busiest first.
 * The size of a topic is the research done on it over the last 12 months, like labs on the map.
 * Topics with no figure sit at 0 without squeezing the others.
 */
export const rankTopics = (topics) => {
  const known = topics.map(worksOf).filter((works) => works > 0);
  const lowest = Math.log10(Math.min(...known) + 1);
  const highest = Math.log10(Math.max(...known) + 1);
  const levelOf = (works) => {
    if (works <= 0) return 0;
    return highest === lowest ? 0.6 : (Math.log10(works + 1) - lowest) / (highest - lowest);
  };
  return topics
    .map((topic) => ({ topic, level: levelOf(worksOf(topic)) }))
    .sort(
      (a, b) =>
        worksOf(b.topic) - worksOf(a.topic) || (b.topic.castCount || 0) - (a.topic.castCount || 0)
    );
};
