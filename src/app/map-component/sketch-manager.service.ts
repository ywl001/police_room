import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import Graphic from "@arcgis/core/Graphic";
import { BaseLayer } from "./layers.ts/base-layer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { MessageService } from "../message.service";
import { AttributeDialog } from "../attribute-dialog/attribute-dialog";
import MapView from "@arcgis/core/views/MapView";
import { Injectable } from "@angular/core";
import { first } from "rxjs";

/**
 * SketchManagerService
 * 用于统一管理绘制与编辑操作
 */
@Injectable({ providedIn: 'root' })
export class SketchManagerService {

    private sketchVM!: SketchViewModel;
    private targetLayer?: BaseLayer;
    private graphic?: __esri.Graphic;

    /**对应与目标的一些属性，并充当传递一些其他数据的作用（例如新建时打开弹窗时使用的其他数据）
     * 其他数据报错的key以__开头，便于区分
     */
    private attributes: Record<string, any> = {};

    constructor(private message: MessageService) {}

    init(mapView: MapView) {
        this.sketchVM = new SketchViewModel({
            view: mapView,
            updateOnGraphicClick: false,
            pointSymbol: { type: 'simple-marker', color: 'blue', size: '8px' },
            polylineSymbol: { type: 'simple-line', color: 'red', width: 2 },
            polygonSymbol: { type: 'simple-fill', color: [0, 0, 255, 0.3], outline: { color: 'blue', width: 1 } },
        });

        this._bindEvents();
    }

    /** 设置目标图层与属性 */
    setAttributes(key: string, value: any) {
        this.attributes[key] = value
    }

    /** 开始绘制 */
    startCreate(geometryType: "point" | "polyline" | "polygon", targetLayer: BaseLayer) {
        this.targetLayer = targetLayer;
        this.sketchVM.layer = targetLayer;
        if (!this.targetLayer) throw new Error("SketchManager: 未指定 targetLayer");
        this.sketchVM.create(geometryType);
    }

    /** 开始编辑 */
    startEdit(graphic: __esri.Graphic) {
        this.targetLayer = graphic.layer as any;
        this.sketchVM.layer = this.targetLayer as GraphicsLayer
        this.sketchVM.update([graphic]);
    }

    /** 绑定Sketch事件 */
    private _bindEvents() {
        this.sketchVM.on("create", (event) => {
            if (event.state === "complete" && event.graphic) {
                const graphic = event.graphic;
                //发送信息绘制完成，等待属性
                if (this.targetLayer) {
                    graphic.layer = this.targetLayer
                    this.message.createGeoComplete(graphic)
                }
            }
        });

        this.sketchVM.on("update", (event) => {
            if (event.state === "complete" && event.graphics?.length) {
                this.graphic = event.graphics[0];
                console.log('update complete')
                this.message.updeateGeoComplete(this.graphic)
            }
        });
    }

}
