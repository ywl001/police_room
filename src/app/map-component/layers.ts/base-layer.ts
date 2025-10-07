import { AppState } from './../../app.state';
import { HttpClient } from "@angular/common/http";
import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import Polyline from "@arcgis/core/geometry/Polyline";
import * as projection from "@arcgis/core/geometry/projection";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import MapView from "@arcgis/core/views/MapView";
import { AppInjector } from "../../app-injector";
import { SymbolService } from "../../symbol.service";
import { first, firstValueFrom, Observable, Subject, takeUntil } from "rxjs";
import { MessageService } from "../../message.service";
import { Type } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { GeomUtils } from '../../GemoUtils';

export abstract class BaseLayer extends GraphicsLayer {

    priority = 0; // 统一优先级

    // private static layers = new Map<string, BaseLayer>();

    private highlightObjects = []

    private highlightHandle: any | null = null;

    public layerView!: __esri.GraphicsLayerView;

    /** 当前选中的要素（用于编辑） */
    public selectedGraphic: Graphic | null = null;

    http: HttpClient

    mapView: MapView

    symbolService: SymbolService
    message: MessageService

    newGraphic!: Graphic

    private dialog: MatDialog
    appState:AppState

    destroy$ = new Subject<void>();

    protected dataLoaded$ = new Subject<any[]>();

    constructor(mapView: MapView) {
        super();
        this.mapView = mapView
        const appInjector = AppInjector.getInjector()
        this.http = appInjector.get(HttpClient)
        this.symbolService = appInjector.get(SymbolService)
        this.message = appInjector.get(MessageService)
        this.dialog = appInjector.get(MatDialog)
        this.appState = appInjector.get(AppState)

        this.on("layerview-create", (event) => {
            this.layerView = event.layerView as __esri.GraphicsLayerView;
        });

        this.message.createGeoComplete$
            .pipe(takeUntil(this.destroy$))
            .subscribe(g => {
                if (g.layer === this) {
                    this.createFeature(g)
                }
            })

        this.message.updeateGeoComplete$
            .pipe(takeUntil(this.destroy$))
            .subscribe(g => {
                if (g.layer === this) {
                    this.editGeometry(g)
                }
            })

        this.message.editAttributes$
            .pipe(takeUntil(this.destroy$))
            .subscribe(g => {
                if (g.layer === this) {
                    this.editAttributes(g)
                }
            })

        this.message.delFeature$
            .pipe(takeUntil(this.destroy$))
            .subscribe(g => {
                if (g.layer === this) {
                    this.deleteFeature(g)
                }
            })
    }

    async init(): Promise<void> {
        this.removeAll()
        const data = await firstValueFrom(this.getInitData());
        console.log(data)
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

        // BaseLayer.layers.set(this.layerName, this)
    }

    // getLayer<T extends BaseLayer>(name: string): T | null {
    //     return (BaseLayer.layers.get(name) as T) || null;
    // }

    abstract getInitData(): Observable<any[]>;
    abstract getGeometry(item: any): __esri.Geometry
    abstract getSymbol(item: any): any

    abstract layerName: string;

    /** 单击事件 */
    onClick(graphic: Graphic, event: __esri.ViewClickEvent) {
    };

    /** 双击事件 */
    onDoubleClick?(graphic: Graphic, event: __esri.ViewDoubleClickEvent): void;

    /** 右键事件 */
    onRightClick?(graphic: Graphic, event: __esri.ViewClickEvent): void;

    onMouseOver(graphic: Graphic, event: __esri.ViewPointerMoveEvent) { };

    onMouseOut(graphic: Graphic, event: __esri.ViewPointerMoveEvent) { };

    getCreateUrl?(): string

    /**
   * ✅ 子类可以选择性重写，指定属性对话框组件
   */
    getAttributeDialogComponent?(): Type<any>
    /**
  * ✅ 子类可以选择性重写，准备对话框的数据
  */
    // getAttributeDialogData?(): any;

    getUpdateApiUrl?(id: number): string;

    /** ---------------------------
   * 数据操作接口
   * --------------------------- */

    /** 创建要素（新建） */
    async createFeature(newGraphic: Graphic) {
        console.log('create feature', newGraphic)
        // 1. 打开对话框，添加属性
        // let data: any = this.getAttributeDialogData?.()
        const dialogComponent = this.getAttributeDialogComponent?.()
        const data={
            editType:'room'
        }

        if (dialogComponent) {
            this.dialog.open(dialogComponent,{data})
                .afterClosed()
                .pipe(first())
                .subscribe(attr => {
                    console.log(attr)
                    if (!attr) {
                        console.log("用户取消");
                        newGraphic.destroy();
                        return;
                    }
                    const data = {
                        geom: GeomUtils.toMysqlAuto(newGraphic.geometry), ...attr
                    }
                    this.insertDb(data)
                })
        }
    }


    /** 编辑几何（修改位置/形状） */
    async editGeometry(graphic: Graphic) {
        let geom = graphic.geometry as __esri.Geometry;
        // 2. 生成 WKT
        const wkt = GeomUtils.toMysqlAuto(graphic.geometry);
        const data = { geom: wkt }

        // 4. 更新数据库
        const id = graphic.attributes?.id; // 每个要素必须有 id
        if (!id) {
            console.error("要素缺少 id，无法更新数据库");
            return;
        }
        this.updateDb(id, data)
    }

    /** 编辑属性（弹窗/表单提交后调用） */
    editAttributes(graphic: Graphic) {
        // 1、打开对话框
        const dialogComponent = this.getAttributeDialogComponent?.()
        // let data = this.getAttributeDialogData?.() || {};
        const data={
            attributes:graphic.attributes,
            editType:this.layerName
        }
        this.message.clearOutline()

        if (dialogComponent) {
            this.dialog.open(dialogComponent, { data })
                .afterClosed()
                .pipe(first())
                .subscribe(attr => {
                    console.log(attr)
                    if (!attr) {
                        console.log("用户取消");
                        return;
                    }
                    const id = graphic.attributes.id
                    const data = attr;
                    this.updateDb(id, data)
                })
        }
    }

    deleteFeature(g: Graphic) {
        // this.remove(g);
        // 2. 获取数据库主键 id
        const id = g.attributes?.id;
        if (!id) {
            console.warn("该要素没有 id 属性，无法删除数据库记录");
            return;
        }

        // 3. 调用后端接口
        const apiUrl = `http://localhost:3000/api/${this.layerName}/${id}`
        if (this.layerName && id) {
            this.http.delete(apiUrl).subscribe({
                next: (value: any) => {
                    console.log('delete success', value.id)
                    this.remove(g)
                    this.message.clearOutline()
                },
                error(err) {
                    console.log(err)
                }
            })
        }
    }

    /** 高亮（可选通用逻辑） */
    highlight(graphic: Graphic) {
        // TODO: 可以使用 Graphic.symbol 修改颜色或添加效果
        this.clearHighlight()
        if (!graphic) return;
        this.highlightHandle = this.layerView.highlight(graphic)
    }

    /** 清除高亮 */
    clearHighlight() {
        // TODO: 清除所有高亮效果
        this.highlightObjects = [];
        if (this.highlightHandle) {
            this.highlightHandle.remove();
            this.highlightHandle = null;
        }
    }

    private insertDb(data:any) {
        if (this.getCreateUrl) {
            this.http.post(this.getCreateUrl(), data).subscribe({
                next: (value: any) => {
                    console.log('create success', value)
                    this.init()
                },
                error(err) {
                    console.log(err)
                }
            })
        }
    }

    private updateDb(id: number, data: any) {
        const apiUrl = this.getUpdateApiUrl?.(id)
        if (apiUrl) {
            this.http.put(apiUrl, data).subscribe({
                next: (value: any) => {
                    console.log(this.layerName + 'update success', value.id)
                    this.init()
                },
                error(err) {
                    console.log(err)
                }
            })
        }
    }

    override destroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}





