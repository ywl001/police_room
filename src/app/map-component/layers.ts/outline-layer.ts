import { Observable, Subject, Subscription, takeUntil } from "rxjs";
import { BaseLayer } from "./base-layer";
import MapView from "@arcgis/core/views/MapView";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine.js";
import Polygon from "@arcgis/core/geometry/Polygon";
import Graphic from "@arcgis/core/Graphic";
import { GeomUtils } from "../../GemoUtils";
import { EventType } from "@angular/router";
import { AppEventType } from "../../event.bus";

export class OutlineLayer extends BaseLayer {
    override getInitData(): Observable<any[]> {
        throw new Error("Method not implemented.");
    }
    override getGeometry(item: any): __esri.Geometry {
        throw new Error("Method not implemented.");
    }
    override getSymbol(name: string) {
        throw new Error("Method not implemented.");
    }
    override layerName: string = 'outline';

    constructor(mapView: MapView) {
        super(mapView)
        // this.message.showOutline$
        //     .pipe(takeUntil(this.destroy$))
        //     .subscribe((res: any) => {
        //         this.addGraphic(res)
        //     })

        this.eventBus.on(AppEventType.showOutline,(outline)=>{this.addGraphic(outline)})
        this.eventBus.on(AppEventType.ClearOutline,()=>{this.removeAll()})

        // this.message.clearOutline$
        //     .pipe(takeUntil(this.destroy$))
        //     .subscribe(() => {
        //         console.log('out line remove all')
        //         this.removeAll()
        //     })
    }

    addGraphic(outline: any) {
        console.log('outline addgraphic')
        // console.log(outline)
        this.removeAll()
        const p = GeomUtils.toGeometryAuto(outline)
        const outLineGraphic = new Graphic({
            geometry: p,
            symbol: this.symbolService.getDashedPolygonSymbol() as any
        })

        this.add(outLineGraphic)
    }
}