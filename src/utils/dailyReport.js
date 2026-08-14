export const TODAY_STR = () => {
  const d = new Date();
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

export const todayInputValue = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export const formatDateDDMMYYYY = (dateInput) => {
  if (!dateInput) return TODAY_STR();
  const [y, m, d] = dateInput.split('-');
  return `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
};

export const statusLabel = (status, customText) => {
  if (status === 'done') return 'Done';
  if (status === 'progress') return 'ON Progress';
  if (status === 'pending') return 'Pending';
  if (status === 'custom') return (customText || '').trim();
  return '';
};

const cleanLine = (line) => line.replace(/^(\*|·\s|-\s|\d+\.\s)+/, '').replace(/\*/g, '');

export const reformatText = (text, style) => {
  let numberIndex = 1;
  return String(text || '')
    .split('\n')
    .map((line) => {
      const content = cleanLine(line).trim();
      if (style === 'bold') return content ? `*${content}*` : '';
      if (!content) return '';
      if (style === 'bullet') return `· ${content}`;
      if (style === 'sub') return `- ${content}`;
      if (style === 'number') return `${numberIndex++}. ${content}`;
      return line;
    })
    .join('\n');
};

export const nextLinePrefix = (line) => {
  const numbered = line.match(/^(\d+)\.\s/);
  if (numbered) return `${parseInt(numbered[1], 10) + 1}. `;
  const marker = line.match(/^(·\s|-\s)/);
  return marker ? marker[1] : '';
};

const bulletLines = (text) => {
  const parts = String(text || '').trim().split('\n').filter((l) => l.trim());
  if (!parts.length) return '';
  const first = /^(·\s|-\s|\d+\.\s)/.test(parts[0]) ? parts[0] : `· ${parts[0]}`;
  return [first, ...parts.slice(1)].join('\n');
};

export const buildText = (name, dateVal, blocks) => {
  const displayName = (name || '').trim() || '-';
  const lines = [
    'MEASURING DAILY WORK',
    '',
    `Name : ${displayName}`,
    `Date : ${formatDateDDMMYYYY(dateVal)}`,
    'Today Activities',
    '',
  ];

  const allActivities = [];
  const populatedBlocks = (blocks || []).filter((block) =>
    (block.activities || []).some((act) => (act.text || '').trim())
  );

  populatedBlocks.forEach((block) => {
    const start = (block.start || '').trim();
    const end = (block.end || '').trim();
    if (start || end) lines.push(`${start} - ${end}`);
    lines.push('');
    block.activities.forEach((act) => {
      if ((act.text || '').trim()) {
        lines.push(bulletLines(act.text));
        allActivities.push(act);
      }
    });
    lines.push('');
  });

  lines.push('Output');
  lines.push('');
  allActivities.forEach((act) => {
    const label = statusLabel(act.status, act.customText);
    lines.push(`${bulletLines(act.text)}${label ? ` (${label})` : ''}`);
  });

  return lines.join('\n').replace(/\n\n\n+/g, '\n\n');
};