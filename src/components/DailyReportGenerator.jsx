import { useMemo, useState } from 'react';
import { CalendarDays, ClipboardCopy, History, Loader, Trash2, Plus, Minus, Save, Printer } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { buildText, formatDateDDMMYYYY, todayInputValue, reformatText, nextLinePrefix } from '../utils/dailyReport';

const STATUS_OPTIONS = [
  { value: 'progress', label: 'ON Progress' },
  { value: 'done', label: 'Done' },
  { value: 'pending', label: 'Pending' },
  { value: 'custom', label: 'Custom...' },
  { value: 'none', label: 'Tanpa Status' },
];

const FORMAT_TOOLS = [
  { key: 'bold', label: 'B', title: 'Bold baris pertama' },
  { key: 'bullet', label: '\u00b7', title: 'Bullet (\u00b7 )' },
  { key: 'sub', label: '\u2013', title: 'Sub bullet (- )' },
  { key: 'number', label: '1.', title: 'Numbering (1. 2. 3.)' },
];

const makeId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

const emptyActivity = () => ({ id: makeId(), text: '', status: 'progress', customText: '' });

const emptyBlock = () => ({
  id: makeId(),
  start: '8.00',
  end: '12.00',
  activities: [emptyActivity()],
});

const normalizeBlocks = (blocks) => (blocks || []).map((block) => ({
  id: block.id || makeId(),
  start: block.start || '',
  end: block.end || '',
  activities: (block.activities || []).map((act) => ({
    id: act.id || makeId(),
    text: act.text || '',
    status: act.status || 'progress',
    customText: act.customText || '',
})),
}));

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const toHtml = (t) => esc(t).replace(/\n/g, '<br>');

export default function DailyReportGenerator({ reports = [], onSaveReport, onDeleteReport }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [date, setDate] = useState(todayInputValue());
  const [blocks, setBlocks] = useState(() => [emptyBlock()]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const sortedReports = useMemo(
    () => [...reports].sort((a, b) => b.dateVal.localeCompare(a.dateVal)),
    [reports]
  );

  const updateBlock = (blockId, patch) =>
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, ...patch } : b)));

  const updateActivity = (blockId, actId, patch) =>
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, activities: b.activities.map((a) => (a.id === actId ? { ...a, ...patch } : a)) }
          : b
      )
    );

  const addBlock = () => setBlocks((prev) => [...prev, emptyBlock()]);
  const removeBlock = (blockId) => setBlocks((prev) => prev.filter((b) => b.id !== blockId));

  const addActivity = (blockId) =>
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, activities: [...b.activities, emptyActivity()] } : b))
    );

  const removeActivity = (blockId, actId) =>
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, activities: b.activities.filter((a) => a.id !== actId) } : b
      )
    );

  const autoGrow = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleEnterKey = (e, blockId, actId) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    e.preventDefault();
    const el = e.target;
    const { selectionStart, selectionEnd } = el;
    const lineStart = el.value.lastIndexOf('\n', selectionStart - 1) + 1;
    const currentLine = el.value.slice(lineStart, selectionStart);
    const prefix = nextLinePrefix(currentLine);
    const next = el.value.slice(0, selectionStart) + '\n' + prefix + el.value.slice(selectionEnd);
    updateActivity(blockId, actId, { text: next });
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = selectionStart + 1 + prefix.length;
    });
  };

  const handlePrintPdf = () => {
    const win = window.open('', '_blank', 'width=820,height=1100');
    if (!win) {
      showToast('Popup diblokir. Izinkan popup lalu coba lagi.', 'error');
      return;
    }
    const displayName = (name || '').trim() || '-';
    const populated = (blocks || []).filter((b) => (b.activities || []).some((a) => (a.text || '').trim()));
    const rows = [];
    populated.forEach((b) => {
      const start = (b.start || '').trim();
      const end = (b.end || '').trim();
      if (start || end) rows.push(`<p class="jam">${esc(start)} - ${esc(end)}</p>`);
      (b.activities || []).forEach((a) => {
        if (!(a.text || '').trim()) return;
        const label = statusLabel(a.status, a.customText);
        rows.push(`<p class="act">${toHtml(a.text)}${label ? ` <span class="status">(${esc(label)})</span>` : ''}</p>`);
      });
    });
    const outputs = [];
    populated.forEach((b) => {
      (b.activities || []).forEach((a) => {
        if (!(a.text || '').trim()) return;
        const label = statusLabel(a.status, a.customText);
        outputs.push(`<p class="act">${toHtml(a.text)}${label ? ` <span class="status">(${esc(label)})</span>` : ''}</p>`);
      });
    });
    const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Daily Report ${formatDateDDMMYYYY(date)}</title>
<style>
  body { font-family: 'Courier New', Consolas, monospace; color: #111; background: #fff; padding: 40px; font-size: 13px; line-height: 1.6; }
  h1 { font-size: 16px; margin: 0 0 16px; }
  h2 { font-size: 14px; margin: 24px 0 8px; }
  p  { margin: 2px 0; }
  .jam { font-weight: bold; margin-top: 10px; }
  .status { color: #555; }
  @media print { body { padding: 0; } }
</style></head><body>
  <h1>MEASURING DAILY WORK</h1>
  <p>Name : ${esc(displayName)}</p>
  <p>Date : ${formatDateDDMMYYYY(date)}</p>
  <h2>Today Activities</h2>
  ${rows.join('')}
  <h2>Output</h2>
  ${outputs.join('')}
</body></html>`;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleCopy = async () => {
    const text = buildText(name, date, blocks);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    showToast('Text copied for WhatsApp.');
    setTimeout(() => setCopied(false), 1600);
  };

  const handleSave = () => {
    onSaveReport({ dateVal: date || todayInputValue(), name: name.trim(), blocks });
    setSaved(true);
    showToast('Daily report saved.');
    setTimeout(() => setSaved(false), 1600);
  };

  const handleLoad = (entry) => {
    setName(entry.name || user?.name || '');
    setDate(entry.dateVal || todayInputValue());
    setBlocks(normalizeBlocks(entry.blocks));
    setHistoryOpen(false);
    showToast(`Loaded report for ${formatDateDDMMYYYY(entry.dateVal)}.`);
  };

  const handleDelete = (dateVal) => {
    onDeleteReport(dateVal);
    showToast('Report deleted.', 'info');
  };

  const previewText = buildText(name, date, blocks);

  const summaryCount = (entry) =>
    entry.blocks.reduce((n, b) => n + (b.activities || []).filter((a) => (a.text || '').trim()).length, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
      <div className="lg:col-span-3 space-y-4">
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 mb-4">Daily Report</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama"
                className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {blocks.map((block) => (
              <div key={block.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">Jam Kerja</span>
                  <button
                    onClick={() => removeBlock(block.id)}
                    disabled={blocks.length === 1}
                    className="text-[11px] text-slate-400 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Hapus blok
                  </button>
                </div>

                <div className="flex items-center gap-2.5 mb-3">
                  <input
                    type="text"
                    value={block.start}
                    onChange={(e) => updateBlock(block.id, { start: e.target.value })}
                    placeholder="8.00"
                    className="flex-1 h-10 px-3 text-[13px] bg-white dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <span className="text-slate-400 text-[13px]">–</span>
                  <input
                    type="text"
                    value={block.end}
                    onChange={(e) => updateBlock(block.id, { end: e.target.value })}
                    placeholder="12.00"
                    className="flex-1 h-10 px-3 text-[13px] bg-white dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div className="space-y-2.5">
                  {block.activities.map((act) => (
                    <div key={act.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-start">
                      <div className="min-w-0">
                        <textarea
                          ref={(el) => autoGrow(el)}
                          rows={1}
                          value={act.text}
                          onChange={(e) => updateActivity(block.id, act.id, { text: e.target.value })}
                          onInput={(e) => autoGrow(e.target)}
                          onKeyDown={(e) => handleEnterKey(e, block.id, act.id)}
                          placeholder="mis. PIS 55406-KK350 (Enter = baris baru)"
                          className="w-full min-h-10 px-3 py-2.5 text-[13px] bg-white dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none overflow-hidden"
                        />
                        <div className="mt-1.5 flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-0.5">Fmt</span>
                          {FORMAT_TOOLS.map((tool) => (
                            <button
                              key={tool.key}
                              type="button"
                              onClick={() => updateActivity(block.id, act.id, { text: reformatText(act.text, tool.key) })}
                              title={tool.title}
                              className="min-w-7 h-7 px-1.5 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              {tool.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={act.status}
                          onChange={(e) => updateActivity(block.id, act.id, { status: e.target.value })}
                          className="h-10 px-2.5 text-[12.5px] bg-white dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeActivity(block.id, act.id)}
                          disabled={block.activities.length === 1}
                          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          title="Hapus aktivitas"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                      {act.status === 'custom' && (
                        <input
                          type="text"
                          value={act.customText}
                          onChange={(e) => updateActivity(block.id, act.id, { customText: e.target.value })}
                          placeholder="Tulis keterangan sendiri, mis. Revisi 2x"
                          className="w-full h-10 px-3 text-[13px] bg-white dark:bg-slate-700 dark:text-slate-200 border border-blue-300 dark:border-blue-500 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => addActivity(block.id)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 h-9 border border-dashed border-slate-300 dark:border-slate-600 text-emerald-600 dark:text-emerald-400 hover:border-emerald-400 text-[12.5px] font-medium rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Aktivitas
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addBlock}
            className="mt-3 w-full flex items-center justify-center gap-1.5 h-10 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-[13px] font-medium rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Jam Kerja
          </button>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleSave}
              className={`h-10 px-4 text-[13px] font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${saved
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              <Save className="w-4 h-4" />
              {saved ? 'Tersimpan!' : 'Simpan Laporan Hari Ini'}
            </button>
            <button
              onClick={handleCopy}
              className={`h-10 px-4 text-[13px] font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${copied
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
            >
              <ClipboardCopy className="w-4 h-4" />
              {copied ? 'Tersalin!' : 'Salin Teks untuk WhatsApp'}
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="mt-2.5 w-full h-10 px-4 text-[13px] font-medium border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Cetak / Export PDF
          </button>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <button
            onClick={() => setHistoryOpen((prev) => !prev)}
            className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left cursor-pointer"
          >
            <span className="flex items-center gap-2 text-[13.5px] font-semibold text-slate-700 dark:text-slate-200">
              <History className="w-4 h-4 text-blue-500" />
              Riwayat Laporan
            </span>
            <span className="text-[12px] text-slate-400 dark:text-slate-500">
              {sortedReports.length ? `${sortedReports.length} tersimpan` : ''}
            </span>
          </button>
          {historyOpen && (
            <div className="px-5 pb-4 space-y-2">
              {sortedReports.length ? sortedReports.map((entry) => (
                <div key={entry.dateVal} className="flex items-center justify-between gap-3 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{formatDateDDMMYYYY(entry.dateVal)}</p>
                    <p className="text-[11.5px] text-slate-400 dark:text-slate-500 truncate">
                      {entry.name || '-'} · {summaryCount(entry)} aktivitas
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleLoad(entry)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:text-emerald-500 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors cursor-pointer"
                      title="Muat"
                    >
                      <Loader className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.dateVal)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:text-red-500 hover:border-red-300 dark:hover:border-red-600 transition-colors cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <p className="py-6 text-center text-[13px] text-slate-400 dark:text-slate-500">Belum ada laporan tersimpan.</p>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-24">
        <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-800 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            <p className="text-[12px] font-semibold text-slate-300">Preview WhatsApp</p>
          </div>
          <div className="bg-[#005c4b] rounded-lg px-4 py-3 whitespace-pre-wrap text-[13px] leading-relaxed text-[#e9edef]">
            {previewText}
            <div className="mt-1.5 text-right text-[10.5px] text-[#e9edef]/60">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Teks disalin persis seperti tampilan preview di atas, siap tempel ke WhatsApp.
        </p>
      </div>
    </div>
  );
}