import { Injectable } from "@angular/core";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import MapView from "@arcgis/core/views/MapView";
import { BaseLayer } from "./layers.ts/base-layer";
;

@Injectable({ providedIn: 'root' })
export class MapEventManager {

    private view!: MapView;

    private lastHoverGraphic: __esri.Graphic | null = null;

    constructor() { }

    init(view: MapView) {
        this.view = view;

        const tempLayer = new GraphicsLayer({ id: 'sketch-layer' });
        this.view.map?.add(tempLayer);

        this.registerEvents();
    }

    /** 注册 MapView 所有鼠标事件 */
    private registerEvents() {
        // 普通点击（左键 / 右键）
        this.view.on('click', (event) => this.handleClick(event));

        // 双击
        this.view.on('double-click', (event) => this.handleDoubleClick(event));

        //鼠标指针变化
        this.view.on("pointer-move", (event) => this.handlePointmove(event));
    }

    /** click */
    private async handleClick(event: __esri.ViewClickEvent) {
        const hit = await this.view.hitTest(event);
        const { layer, graphic } = await this.getTopLayerFromHit(hit.results);

        if (graphic && layer) {
            if (event.button === 0) {
                layer.onClick?.(graphic, event);
            } else if (event.button === 2) {
                layer.onRightClick?.(graphic, event)
            }
        } else {
            // this.message.sendMessage(MessageType.clickMap)
        }
    }

    /** 双击事件 */
    private async handleDoubleClick(event: __esri.ViewDoubleClickEvent) {
        const hit = await this.view.hitTest(event);
        const { layer, graphic } = await this.getTopLayerFromHit(hit.results);
        if(graphic && layer){
            layer.onDoubleClick?.(graphic,event)
        }
    }

    private async handlePointmove(event: __esri.ViewPointerMoveEvent) {
        const hit = await this.view.hitTest(event);
        const { layer, graphic } = await this.getTopLayerFromHit(hit.results);

        if (graphic === this.lastHoverGraphic) return;

        if (this.lastHoverGraphic) {
            (this.lastHoverGraphic.layer as BaseLayer)?.onMouseOut?.(this.lastHoverGraphic, event);
        }

        if (graphic && layer) {
            layer.onMouseOver?.(graphic, event)
        }

        this.lastHoverGraphic = graphic;
    }

    private async getTopLayerFromHit(results: __esri.ViewHit[], excludeRightClick = false): Promise<{ layer: BaseLayer | null; graphic: Graphic | null }> {
        let topLayer: BaseLayer | null = null;
        let topGraphic: Graphic | null = null;
        let maxPriority = -Infinity;

        for (const result of results) {
            const graphic = (result as __esri.GraphicHit).graphic as Graphic;
            if (graphic && graphic.layer instanceof BaseLayer) {
                const layer = graphic.layer as BaseLayer;
                if (layer.priority > maxPriority) {
                    maxPriority = layer.priority;
                    topLayer = layer;
                    topGraphic = graphic;
                }
            }
        }
        return { layer: topLayer, graphic: topGraphic };
    }
}