import { Injectable } from "@angular/core";
import Graphic from "@arcgis/core/Graphic";
import MapView from "@arcgis/core/views/MapView";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import { AppEventType, EventBus } from "../event.bus";
import { BaseLayer } from "./layers.ts/base-layer";

/**
 * SketchManagerService
 * 用于统一管理地图绘制与编辑逻辑
 */
@Injectable({ providedIn: 'root' })
export class SketchManagerService {

    private sketchVM!: SketchViewModel;
    constructor(private eventBus:EventBus) { }

    /** 初始化并绑定事件 */
    init(view: MapView) {
        this.sketchVM = new SketchViewModel({
            view,
            updateOnGraphicClick: false,
            pointSymbol: { type: "simple-marker", color: "blue", size: "8px" },
            polylineSymbol: { type: "simple-line", color: "red", width: 2 },
            polygonSymbol: {
                type: "simple-fill",
                color: [0, 0, 255, 0.3],
                outline: { color: "blue", width: 1 },
            },
        });

        this.bindEvents();
    }

    /** 开始绘制 */
    startCreate(geometryType: "point" | "polyline" | "polygon", targetLayer: BaseLayer) {
        console.log(targetLayer)
        if (!targetLayer) throw new Error("SketchManager: 未指定 targetLayer");
        this.sketchVM.layer = targetLayer;
        this.sketchVM.create(geometryType);
    }

    /** 开始编辑 */
    startEdit(graphic: Graphic) {
        const targetLayer = graphic.layer as BaseLayer;
        this.sketchVM.layer = targetLayer;
        this.sketchVM.update([graphic]);
    }

    /** 绑定 SketchViewModel 的事件 */
    private bindEvents() {
        this.sketchVM.on("create", (event) => {
            if (event.state === "complete" && event.graphic) {
                const graphic = event.graphic;

                // 通知外部绘制完成
                this.eventBus.emit(AppEventType.CreateGeoComplete,graphic)
            }
        });

        this.sketchVM.on("update", (event) => {
            if (event.state === "complete" && event.graphics?.length) {
                const graphic = event.graphics[0];

                // 通知外部编辑完成
                this.eventBus.emit(AppEventType.UpdateGeoComplete,graphic)
            }
        });
    }
}
