export interface ScoreData {
  mode: 'daily' | 'quick';
  correct: number;
  total: number;
  points: number;
  results: boolean[];
  streak?: number;
}

const C = {
  bg: '#0f1729',
  card: '#1a2744',
  border: '#1e3a5f',
  green: '#22c55e',
  red: '#ef4444',
  amber: '#f59e0b',
  text: '#f1f5f9',
  muted: '#64748b',
  faint: '#334155',
} as const;

export function buildShareText(data: ScoreData): string {
  const emoji = data.results.map((r) => (r ? '🟩' : '🟥')).join('');
  const label = data.mode === 'daily' ? 'Daily Challenge' : 'Quick Play';
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const lines = [
    `⚽ WorldCupIQ – ${label}`,
    date,
    '',
    emoji,
    '',
    `${data.correct}/${data.total} correct  ·  +${data.points} pts`,
  ];
  if (data.mode === 'daily' && (data.streak ?? 0) > 0) lines.push(`🔥 ${data.streak} day streak`);
  lines.push('', 'Play at worldcupiq.com');
  return lines.join('\n');
}

export async function shareScoreCard(data: ScoreData, onCopied?: () => void): Promise<void> {
  const canvas = drawCanvas(data);
  const text = buildShareText(data);

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        await textFallback(text, onCopied);
        resolve();
        return;
      }

      const file = new File([blob], 'worldcupiq-score.png', { type: 'image/png' });

      if (typeof navigator !== 'undefined' && navigator.share) {
        const canShareFile = navigator.canShare?.({ files: [file] }) ?? false;
        try {
          if (canShareFile) {
            await navigator.share({ files: [file], title: 'WorldCupIQ Score', text });
          } else {
            await navigator.share({ title: 'WorldCupIQ Score', text });
          }
          resolve();
          return;
        } catch (e) {
          if ((e as Error).name === 'AbortError') { resolve(); return; }
        }
      }

      downloadBlob(blob);
      resolve();
    }, 'image/png');
  });
}

async function textFallback(text: string, onCopied?: () => void) {
  try {
    await navigator.clipboard.writeText(text);
    onCopied?.();
  } catch {}
}

function downloadBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'worldcupiq-score.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function drawCanvas(data: ScoreData): HTMLCanvasElement {
  const W = 600, H = 360, DPR = 2;
  const canvas = document.createElement('canvas');
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(DPR, DPR);
  const cx = W / 2;

  // Background
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Inner card
  rr(ctx, 28, 28, W - 56, H - 56, 16);
  ctx.fillStyle = C.card;
  ctx.fill();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  // App name
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = C.green;
  ctx.fillText('⚽  WorldCupIQ', cx, 82);

  // Mode + date
  const label = data.mode === 'daily' ? 'Daily Challenge' : 'Quick Play';
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = C.muted;
  ctx.fillText(`${label}  ·  ${dateStr}`, cx, 106);

  // Big score
  ctx.font = 'bold 68px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = C.text;
  ctx.fillText(`${data.correct}/${data.total}`, cx, 188);

  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = C.muted;
  ctx.fillText('correct answers', cx, 212);

  // Answer grid
  const sq = 26, gap = 8;
  const gridW = data.results.length * (sq + gap) - gap;
  let gx = cx - gridW / 2;
  const gy = 232;
  for (const correct of data.results) {
    rr(ctx, gx, gy, sq, sq, 5);
    ctx.fillStyle = correct ? C.green : C.red;
    ctx.fill();
    gx += sq + gap;
  }

  // Stats
  const pct = Math.round((data.correct / data.total) * 100);
  const hasStreak = data.mode === 'daily' && (data.streak ?? 0) > 0;
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  if (hasStreak) {
    ctx.fillStyle = C.text;
    ctx.textAlign = 'right';
    ctx.fillText(`${pct}% accuracy`, cx - 12, 296);
    ctx.fillStyle = C.amber;
    ctx.textAlign = 'left';
    ctx.fillText(`🔥 ${data.streak} day streak`, cx + 12, 296);
    ctx.textAlign = 'center';
  } else {
    ctx.fillStyle = C.text;
    ctx.fillText(`${pct}% accuracy  ·  +${data.points} pts`, cx, 296);
  }

  // CTA
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = C.faint;
  ctx.fillText('worldcupiq.com', cx, H - 32);

  return canvas;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
