import { Injectable } from "@angular/core";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import MapView from "@arcgis/core/views/MapView";
import { BaseLayer } from "./layers.ts/base-layer";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel.js";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";
import Graphic from "@arcgis/core/Graphic";
import { MessageService, MessageType } from "../message.service";
;

@Injectable({ providedIn: 'root' })
export class MapEventManager {
    private view!: MapView;

    private currentLayer: BaseLayer | null = null;

    private lastHoverGraphic: __esri.Graphic | null = null;

    constructor(private message: MessageService) { }

    init(view: MapView) {
        this.view = view;

        const tempLayer = new GraphicsLayer({ id: 'sketch-layer' });
        this.view.map?.add(tempLayer);

        this.registerEvents();
    }

    setCurrentLayer(layer: BaseLayer | null) {
        this.currentLayer = layer;
    }

    getCurrentLayer() {
        return this.currentLayer;
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
            this.message.sendMessage(MessageType.clickMap)
        }
    }

    /** 双击事件 */
    private handleDoubleClick(event: __esri.ViewDoubleClickEvent) {
        this.view.hitTest(event).then((res) => {
            const graphic = (res.results[0] as any)?.graphic;
            if (graphic) this.currentLayer?.onDoubleClick?.(graphic, event);
        });
    }

    private async handlePointmove(event: __esri.ViewPointerMoveEvent) {
        const hit = await this.view.hitTest(event);
        const { layer, graphic } = await this.getTopLayerFromHit(hit.results);

        if (graphic === this.lastHoverGraphic) return;

        if (this.lastHoverGraphic) {
            (this.lastHoverGraphic.layer as BaseLayer)?.onMouseOut?.(this.lastHoverGraphic, event);
        }

        if(graphic && layer){
            layer.onMouseOver(graphic,event)
        }

        this.lastHoverGraphic = graphic;

        // if (graphic && layer) {
        //     if (graphic !== this.lastHoverGraphic) {
        //         layer.onMouseOver(graphic, event)
        //         if (this.lastHoverGraphic) {
        //             (this.lastHoverGraphic.layer as BaseLayer)?.onMouseOut(this.lastHoverGraphic, event);
        //         }
        //     }
        // } else {
        //     if (this.lastHoverGraphic && this.currentLayer) {
        //         this.currentLayer.onMouseOut(this.lastHoverGraphic, event);
        //         this.lastHoverGraphic = null;
        //     }
        // }

        // // 拿到所有 BaseLayer 的命中结果
        // const hits = hit.results
        //     .filter((r): r is __esri.GraphicHit => r.type === "graphic")
        //     .filter(r => r.graphic.layer instanceof BaseLayer)
        //     .map(r => ({
        //         graphic: r.graphic,
        //         layer: r.graphic.layer as BaseLayer
        //     }));

        // 按优先级排序，取最高的
        // const top = hits.sort((a, b) => b.layer.hoverPriority - a.layer.hoverPriority)[0];

        // const topGraphic = hits[0]?.graphic || null;

        // 👉 只在 topGraphic 属于当前层时，才更新 hover 状态
        // if (topGraphic) {
        //     if (topGraphic !== this.lastHoverGraphic) {
        //         (topGraphic.layer as BaseLayer).onMouseOver(topGraphic, event);
        //         if (this.lastHoverGraphic) {
        //             (this.lastHoverGraphic.layer as BaseLayer)?.onMouseOut(this.lastHoverGraphic, event);
        //         }
        //         this.lastHoverGraphic = topGraphic;
        //     }
        // } else {
        //     // 👉 如果这次命中的不是本层，但上一次有 hover，本层要清理掉
        //     if (this.lastHoverGraphic && this.currentLayer) {
        //         this.currentLayer.onMouseOut(this.lastHoverGraphic, event);
        //         this.lastHoverGraphic = null;
        //     }
        // }
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