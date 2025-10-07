export enum Arrow {
  left = 'left',
  top = 'top',
  right = 'right',
  bottom = 'bottom'
}

// canvas-utils.ts
export function drawInfowindowBorder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  direction: Arrow,
  options: { lineWidth: number; arrowWidth: number; arrowHeight: number; radius?: number }
) {
  const { lineWidth, arrowWidth, arrowHeight, radius = 8 } = options;

  const minArrowSize = 10;
  const safeArrowWidth = Math.max(options.arrowWidth, minArrowSize);
  const safeArrowHeight = Math.max(options.arrowHeight, minArrowSize);
  
  const halfLineWidth = lineWidth / 2;

  const xmin = halfLineWidth;
  const xmax = width - halfLineWidth;
  const ymin = halfLineWidth;
  const ymax = height - halfLineWidth;

  const xHalf = width / 2;
  const xLessHalf = xHalf - arrowWidth / 2;
  const xMoreHalf = xHalf + arrowWidth / 2;

  const yHalf = height / 2;
  const yLessHalf = yHalf - arrowWidth / 2;
  const yMoreHalf = yHalf + arrowWidth / 2;

  console.log(arrowWidth, arrowHeight, xLessHalf, xMoreHalf)

  ctx.beginPath();
  ctx.strokeStyle = 'black';
  ctx.fillStyle = 'white';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  switch (direction) {
    case Arrow.top:
      ctx.moveTo(xmin + radius, arrowHeight);
      ctx.lineTo(xLessHalf, arrowHeight);
      ctx.lineTo(xHalf, ymin);
      ctx.lineTo(xMoreHalf, arrowHeight);
      ctx.lineTo(xmax - radius, arrowHeight);
      ctx.arcTo(xmax, arrowHeight, xmax, arrowHeight + radius, radius);
      ctx.lineTo(xmax, ymax - radius);
      ctx.arcTo(xmax, ymax, xmax - radius, ymax, radius);
      ctx.lineTo(xmin + radius, ymax);
      ctx.arcTo(xmin, ymax, xmin, ymax - radius, radius);
      ctx.lineTo(xmin, arrowHeight + radius);
      ctx.arcTo(xmin, arrowHeight, xmin + radius, arrowHeight, radius);
      break;

    case Arrow.right:
      ctx.moveTo(xmin + radius, ymin);
      ctx.lineTo(xmax - arrowHeight - radius, ymin);
      ctx.arcTo(xmax - arrowHeight, ymin, xmax - arrowHeight, ymin + radius, radius);
      ctx.lineTo(xmax - arrowHeight, yLessHalf);
      ctx.lineTo(xmax, yHalf);
      ctx.lineTo(xmax - arrowHeight, yMoreHalf);
      ctx.lineTo(xmax - arrowHeight, ymax - radius);
      ctx.arcTo(xmax - arrowHeight, ymax, xmax - arrowHeight - radius, ymax, radius);
      ctx.lineTo(xmin + radius, ymax);
      ctx.arcTo(xmin, ymax, xmin, ymax - radius, radius);
      ctx.lineTo(xmin, ymin + radius);
      ctx.arcTo(xmin, ymin, xmin + radius, ymin, radius);
      break;

    case Arrow.bottom:
      ctx.moveTo(xmin + radius, ymin);
      ctx.lineTo(xmax - radius, ymin);
      ctx.arcTo(xmax, ymin, xmax, ymin + radius, radius);
      ctx.lineTo(xmax, ymax - arrowHeight - radius);
      ctx.arcTo(xmax, ymax - arrowHeight, xMoreHalf, ymax - arrowHeight, radius);
      ctx.lineTo(xMoreHalf, ymax - arrowHeight);
      ctx.lineTo(xHalf, ymax);
      ctx.lineTo(xLessHalf, ymax - arrowHeight);
      ctx.lineTo(xmin + radius, ymax - arrowHeight);
      ctx.arcTo(xmin, ymax - arrowHeight, xmin, ymax - arrowHeight - radius, radius);
      ctx.lineTo(xmin, ymin + radius);
      ctx.arcTo(xmin, ymin, xmin + radius, ymin, radius);
      break;

    case Arrow.left:
      ctx.moveTo(xmin + arrowHeight, yLessHalf);
      ctx.lineTo(xmin, yHalf);
      ctx.lineTo(xmin + arrowHeight, yMoreHalf);
      ctx.lineTo(xmin + arrowHeight, ymax - radius);
      ctx.arcTo(xmin + arrowHeight, ymax, xmin + arrowHeight + radius, ymax, radius);
      ctx.lineTo(xmax - radius, ymax);
      ctx.arcTo(xmax, ymax, xmax, ymax - radius, radius);
      ctx.lineTo(xmax, ymin + radius);
      ctx.arcTo(xmax, ymin, xmax - radius, ymin, radius);
      ctx.lineTo(xmin + arrowHeight + radius, ymin);
      ctx.arcTo(xmin + arrowHeight, ymin, xmin + arrowHeight, ymin + radius, radius);
      break;
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
