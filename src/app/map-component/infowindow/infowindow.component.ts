import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ComponentRef, ElementRef, EventEmitter, Input, Output, Type, ViewChild, ViewContainerRef } from '@angular/core';
import Point from '@arcgis/core/geometry/Point';
import MapView from '@arcgis/core/views/MapView';
import elementResizeDetectorMaker from 'element-resize-detector';
import { Arrow, drawInfowindowBorder } from './canvas-utils';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import { fromEventPattern, debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-infowindow',
  templateUrl: './infowindow.component.html',
  standalone:true,
  imports:[CommonModule],
  styleUrls: ['./infowindow.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // 使用 OnPush 策略优化性能
})
export class InfowindowComponent {
  // 模板引用，用于访问 DOM 元素
  @ViewChild('root', { static: false }) rootDiv!: ElementRef<HTMLDivElement>;
  @ViewChild('bgCanvas', { static: false }) bgCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('mainContainer', { static: false }) mainContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('contentContainer', { read: ViewContainerRef }) contentContainer!: ViewContainerRef;

  // 输入属性，允许外部控制标题和标题显示
  @Input() title: string = '';
  @Input() isShowTitle: boolean = true;
  // 输出事件，通知外部关闭事件
  @Output() closed = new EventEmitter<void>();

  // 箭头方向，带 getter 和 setter
  private _direction: Arrow = Arrow.left;
  get direction(): Arrow { return this._direction; }
  set direction(value: Arrow) {
    if (this._direction !== value) {
      this._direction = value;
      console.log('Direction changed to:', this._direction); // 调试日志
      this.updateMargins(); // 更新边距
      this.updateDimensions(); // 更新尺寸
      this.drawBorder(); // 重绘边框
      this.cdr.markForCheck(); // 标记需要检查
    }
  }

  // 样式参数，控制边框和箭头
  lineWidth = 2;
  @Input() arrowHeight: number = 10; // 允许外部控制箭头高度
  @Input() arrowWidth: number = 10; // 允许外部控制箭头宽度

  // 尺寸和位置
  private width = 0;
  private height = 0;
  private xPos = 0;
  private yPos = 0;
  visible = false;

  // 地图相关
  private acchorPoint: Point | null = null;
  private mapView: MapView | null = null;
  private watchHandle: __esri.Handle | null = null;

  // 缓存绘制状态，优化性能
  private lastDrawnState: { width: number; height: number; direction: Arrow } | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private host: ElementRef
  ) { }

  ngAfterViewInit() {
    // 使用 element-resize-detector 监听容器大小变化
    const erm = elementResizeDetectorMaker();
    erm.listenTo(this.mainContainer.nativeElement, () => {
      this.updateArrowSize()
      this.updateDimensions();
      this.setPosition();

    });
    this.hide(); // 初始化时隐藏
  }

  ngOnDestroy() {
    // 清理资源
    this.watchHandle?.remove();
    this.contentContainer?.clear();
  }

  // 显示信息窗口，加载动态组件
  show<T>(mapView: MapView, point: Point, component: Type<T>): ComponentRef<T> {
    this.acchorPoint = point;
    this.mapView = mapView;

    this.watchHandle?.remove();
    this.watchHandle = this.watchExtent(mapView, () => this.setPosition());

    this.contentContainer.clear();
    const ref = this.contentContainer.createComponent(component);
    this.rootDiv.nativeElement.classList.add('visible');

    // 延迟调用 setPosition，确保动态组件渲染完成
    setTimeout(() => {
      this.setPosition();
    }, 0);

    return ref;
  }

  // 隐藏信息窗口
  hide() {
    this.rootDiv?.nativeElement.classList.remove('visible');
    this.visible = false;
    // this.acchorPoint = null;
    // this.watchHandle?.remove();
    // if (this.contentContainer) {
    //   this.contentContainer.clear();
    // }
    // if (this.bgCanvas) {
    //   const ctx = this.bgCanvas.nativeElement.getContext('2d');
    //   if (ctx) {
    //     ctx.clearRect(0, 0, this.bgCanvas.nativeElement.width, this.bgCanvas.nativeElement.height);
    //   }
    // }
    // this.cdr.detectChanges();
  }

  // 关闭按钮点击事件
  onClose() {
    this.closed.emit();
    this.hide();
  }

  // 动态调整箭头大小
  private updateArrowSize() {
    const el = this.mainContainer.nativeElement;
    const contentWidth = el.clientWidth;
    const contentHeight = el.clientHeight;

    // 箭头宽度最大不超过内容宽度的 1/3
    this.arrowWidth = Math.min(this.arrowWidth, contentWidth / 2);
    // 箭头高度最大不超过内容高度的 1/4
    this.arrowHeight = Math.min(this.arrowHeight, contentHeight / 2);

    // const arrowW = Math.max(10, Math.min(this.arrowWidth, contentWidth / 2));
    // const arrowH = Math.max(10, Math.min(this.arrowHeight, contentHeight / 2));
  }

  // 更新信息窗口的宽高
  private updateDimensions() {
    // this.updateArrowSize(); // 动态调整箭头大小
    const el = this.mainContainer.nativeElement;
    const arrowOffset = this.arrowHeight + this.lineWidth;
    const defaultOffset = this.lineWidth;

    this.width = el.clientWidth + defaultOffset * 2;
    this.height = el.clientHeight + defaultOffset * 2;

    if (this.direction === Arrow.left || this.direction === Arrow.right) {
      this.width += arrowOffset;
    }
    if (this.direction === Arrow.top || this.direction === Arrow.bottom) {
      this.height += arrowOffset;
    }
    console.log('Dimensions updated:', { width: this.width, height: this.height });
  }

  // 更新 CSS 变量，控制内容区域的边距
  private updateMargins() {
    const arrowOffset = this.arrowHeight + this.lineWidth;
    const defaultOffset = this.lineWidth;
    this.host.nativeElement.style.setProperty('--margin-left', this.direction === Arrow.left ? `${arrowOffset}px` : `${defaultOffset}px`);
    this.host.nativeElement.style.setProperty('--margin-right', this.direction === Arrow.right ? `${arrowOffset}px` : `${defaultOffset}px`);
    this.host.nativeElement.style.setProperty('--margin-top', this.direction === Arrow.top ? `${arrowOffset}px` : `${defaultOffset}px`);
    this.host.nativeElement.style.setProperty('--margin-bottom', this.direction === Arrow.bottom ? `${arrowOffset}px` : `${defaultOffset}px`);
  }

  private lastDirection: Arrow = this.direction;


  // 更新信息窗口的位置
  private setPosition() {
    if (!this.acchorPoint || !this.mapView) return;

    // this.updateArrowSize();
    this.updateDimensions(); // 确保每次位置更新时重新计算宽高
    // const sp = this.mapService.toScreenPoint(this.mapView, this.acchorPoint);
    const sp = this.mapView.toScreen(this.acchorPoint) as Point;

    this.setDirection(sp);
    this.xPos = this.calcX(sp.x);
    this.yPos = this.calcY(sp.y);
    // 跳动效果
    // this.yPos = this.calcY(sp.y)+10;
    // setTimeout(() => {
    //   this.yPos -= 10;
    //   this.cdr.markForCheck();
    // }, 0);

    requestAnimationFrame(() => {
      this.visible = true;
      this.cdr.markForCheck();
    });

    this.drawBorder();
    this.cdr.markForCheck(); // 标记需要检查
  }

  // 计算 X 坐标
  private calcX(value: number): number {
    switch (this.direction) {
      case Arrow.left:
        return value;
      case Arrow.right:
        return value - this.width - this.lineWidth;
      case Arrow.top:
      case Arrow.bottom:
        return value - this.width / 2;
      default:
        return value - this.width / 2;
    }
  }

  // 计算 Y 坐标
  private calcY(value: number): number {
    switch (this.direction) {
      case Arrow.top:
        return value;
      case Arrow.bottom:
        return value - this.height - this.lineWidth;
      case Arrow.left:
      case Arrow.right:
        return value - this.height / 2;
      default:
        return value - this.height / 2;
    }
  }

  // 根据屏幕坐标计算箭头方向
  private setDirection(p: __esri.ScreenPoint) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const distances = [
      { label: Arrow.left, value: p.x },
      { label: Arrow.right, value: w - p.x },
      { label: Arrow.top, value: p.y },
      { label: Arrow.bottom, value: h - p.y }
    ];
    const newDirection = distances.reduce((min, curr) => curr.value < min.value ? curr : min).label;
    console.log('Calculated new direction:', newDirection, 'based on distances:', distances);
    this.direction = newDirection;
  }

  // 绘制边框和箭头，使用缓存优化性能
  private drawBorder() {
    const canvas = this.bgCanvas.nativeElement;
    const currentState = { width: this.width, height: this.height, direction: this.direction };

    // 如果状态未变，跳过重绘
    if (
      this.lastDrawnState &&
      this.lastDrawnState.width === currentState.width &&
      this.lastDrawnState.height === currentState.height &&
      this.lastDrawnState.direction === currentState.direction
    ) {
      return;
    }

    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawInfowindowBorder(ctx, this.width, this.height, this.direction, {
      lineWidth: this.lineWidth,
      arrowWidth: this.arrowWidth,
      arrowHeight: this.arrowHeight
    });

    this.lastDrawnState = currentState; // 更新缓存状态
    console.log('Drawing border with direction:', this.direction);
  }

  get x(): number { return this.xPos; }
  get y(): number { return this.yPos; }



  watchExtent(view: MapView, callback: () => void): __esri.Handle {
    const handler = reactiveUtils.watch(
      () => view.extent,
      () => callback()
    );

    // 使用 RxJS 防抖，减少频繁触发
    const subscription = fromEventPattern(
      (handler) => handler(),
      () => handler.remove()
    )
      .pipe(debounceTime(100)) // 100ms 防抖
      .subscribe(() => callback());

    return {
      remove: () => {
        handler.remove();
        subscription.unsubscribe();
      }
    };
  }
}