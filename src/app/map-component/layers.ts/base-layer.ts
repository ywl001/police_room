import { HttpClient } from "@angular/common/http";
import { Type } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import MapView from "@arcgis/core/views/MapView";
import { first, firstValueFrom, Observable, Subject } from "rxjs";
import { AppInjector } from "../../app-injector";
import { AppEventType, EventBus } from "../../event.bus";
import { GeomUtils } from '../../GemoUtils';
import { SymbolService } from "../../symbol.service";
import { AppState } from './../../app.state';

/**
 * ✅ BaseLayer
 * 
 * 所有业务图层的抽象基类：
 * - 提供统一的数据加载逻辑；
 * - 封装图层与服务（Http、Message、Symbol）的注入；
 * - 提供创建、编辑、删除要素的通用方法；
 * - 支持事件响应（点击 / 双击 / 悬停 / 右键）；
 * - 管理高亮状态与资源释放；
 */
export abstract class BaseLayer extends GraphicsLayer {
    /** 图层优先级（由 MapEventManager 用于 hitTest 判定） */
    priority = 0;

    /** 当前图层对应的 LayerView（由 layerview-create 获取） */
    public layerView!: __esri.GraphicsLayerView;

    /** 当前选中的要素（可用于编辑、属性面板等） */
    public selectedGraphic: Graphic | null = null;

    /** 数据加载完成流（可供外部订阅） */
    protected dataLoaded$ = new Subject<any[]>();

    /** RxJS 销毁标志 */
    destroy$ = new Subject<void>();

    /** 工具/服务依赖（通过全局 AppInjector 获取） */
    protected http: HttpClient;
    protected mapView: MapView;
    protected symbolService: SymbolService;
    // protected message: MessageService;
    protected dialog: MatDialog;
    protected appState: AppState;

    /** 高亮句柄 */
    private highlightHandle: IHandle | null = null;

    eventBus: EventBus

    constructor(mapView: MapView) {
        super();
        this.mapView = mapView;

        // ✅ 全局依赖注入
        const injector = AppInjector.getInjector();
        this.http = injector.get(HttpClient);
        this.symbolService = injector.get(SymbolService);
        // this.message = injector.get(MessageService);
        this.dialog = injector.get(MatDialog);
        this.appState = injector.get(AppState);
        this.eventBus = injector.get(EventBus)

        // ✅ 监听 layerView 创建事件（ArcGIS 内部触发）
        this.on("layerview-create", (e) => {
            this.layerView = e.layerView as __esri.GraphicsLayerView;
        });

        // ✅ 订阅全局消息流，实现通用交互（新增 / 更新 / 删除 / 编辑属性）
        this.eventBus.on(AppEventType.CreateGeoComplete, g => g.layer === this && this.createFeature(g))
        this.eventBus.on(AppEventType.UpdateGeoComplete, g => g.layer === this && this.editGeometry(g))
        this.eventBus.on(AppEventType.EditAttributes, g => g.layer === this && this.editAttributes(g))
        this.eventBus.on(AppEventType.DeleteFeature, g => g.layer === this && this.deleteFeature(g))
    }

    /**
     * ✅ 初始化图层：加载数据并绘制 Graphic
     */
    async init(): Promise<void> {
        this.removeAll();

        const data = await firstValueFrom(this.getInitData());
        this.dataLoaded$.next(data);
        this.dataLoaded$.complete();

        data.forEach(item => {
            const { geom, ...rest } = item;
            const graphic = new Graphic({
                geometry: this.getGeometry(item),
                symbol: this.getSymbol(item),
                attributes: rest,
            });
            this.add(graphic);
        });
    }

    // --------------------------- 抽象定义 ---------------------------

    /** 子类必须实现：请求接口数据 */
    abstract getInitData(): Observable<any[]>;

    /** 子类必须实现：从接口数据构造 Geometry */
    abstract getGeometry(item: any): __esri.Geometry;

    /** 子类必须实现：获取符号 Symbol */
    abstract getSymbol(item: any): any;

    /** 子类必须定义：图层名称（用于接口 URL 拼接） */
    abstract layerName: string;

    // --------------------------- 事件回调 ---------------------------

    onClick?(graphic: Graphic, event: __esri.ViewClickEvent): void;
    onDoubleClick?(graphic: Graphic, event: __esri.ViewDoubleClickEvent): void;
    onRightClick?(graphic: Graphic, event: __esri.ViewClickEvent): void;
    onMouseOver?(graphic: Graphic, event: __esri.ViewPointerMoveEvent): void;
    onMouseOut?(graphic: Graphic, event: __esri.ViewPointerMoveEvent): void;

    // --------------------------- 数据接口定义 ---------------------------

    getCreateApiUrl?(): string;
    getUpdateApiUrl?(id: number): string;
    getDeleteApiUrl?(id: number): string;
    getAttributeDialogComponent?(): Type<any>;

    // --------------------------- 通用业务逻辑 ---------------------------

    /** ✅ 创建要素：打开属性对话框 + 插入数据库 */
    async createFeature(newGraphic: Graphic) {
        const dialogComponent = this.getAttributeDialogComponent?.();
        if (!dialogComponent) return;

        const data = { editType: this.layerName };
        this.dialog.open(dialogComponent, { data })
            .afterClosed()
            .pipe(first())
            .subscribe(attr => {
                if (!attr) {
                    newGraphic.destroy();
                    return;
                }
                const postData = {
                    geom: GeomUtils.toMysqlAuto(newGraphic.geometry),
                    ...attr
                };
                this.insertDb(postData);
            });
    }

    /** ✅ 编辑几何：更新坐标字段 */
    async editGeometry(graphic: Graphic) {
        const id = graphic.attributes?.id;
        if (!id) return console.error("缺少 id，无法更新");

        const wkt = GeomUtils.toMysqlAuto(graphic.geometry);
        this.updateDb(id, { geom: wkt });
    }

    /** ✅ 编辑属性：弹出表单修改属性 */
    editAttributes(graphic: Graphic) {
        const dialogComponent = this.getAttributeDialogComponent?.();
        if (!dialogComponent) return;

        const data = { attributes: graphic.attributes, editType: this.layerName };

        this.dialog.open(dialogComponent, { data })
            .afterClosed()
            .pipe(first())
            .subscribe(attr => {
                if (!attr) return;
                const id = graphic.attributes.id;
                this.updateDb(id, attr);
            });
    }

    /** ✅ 删除要素：调用接口 + 从图层移除 */
    deleteFeature(g: Graphic) {
        const id = g.attributes?.id;
        if (!id) return console.warn("该要素没有 id，无法删除");
        this.deleteDb(id)
    }

    // --------------------------- 高亮管理 ---------------------------

    highlight(graphic: Graphic) {
        this.clearHighlight();
        if (!graphic || !this.layerView) return;
        this.highlightHandle = this.layerView.highlight(graphic);
    }

    clearHighlight() {
        if (this.highlightHandle) {
            this.highlightHandle.remove();
            this.highlightHandle = null;
        }
    }

    // --------------------------- 数据操作 ---------------------------

    private insertDb(data: any) {
        const url = this.getCreateApiUrl?.();
        if (!url) return;

        this.http.post(url, data).subscribe({
            next: (res: any) => {
                console.log("create success", res);
                this.init();
            },
            error: (err) => console.error(err)
        });
    }

    private updateDb(id: number, data: any) {
        const url = this.getUpdateApiUrl?.(id);
        if (!url) return;

        this.http.put(url, data).subscribe({
            next: (res: any) => {
                console.log(`${this.layerName} update success`, res.id);
                this.init();
            },
            error: (err) => console.error(err)
        });
    }

    private deleteDb(id: number) {
        const url = this.getDeleteApiUrl?.(id);
        if (!url) return;

        this.http.delete(url).subscribe({
            next: (res: any) => {
                console.log(`${this.layerName} delete success`, res.id);
                this.init();
            },
            error: (err) => console.error(err)
        });
    }

    // --------------------------- 销毁 ---------------------------

    override destroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
