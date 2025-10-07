import Polygon from "@arcgis/core/geometry/Polygon";
import { BaseLayer } from "./base-layer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import MapView from "@arcgis/core/views/MapView";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";
import PopupTemplate from "@arcgis/core/PopupTemplate.js";
import Point from "@arcgis/core/geometry/Point";
import ActionButton from "@arcgis/core/support/actions/ActionButton.js";
import { AppInjector } from "../../app-injector";
import { Router } from "@angular/router";
import { firstValueFrom, Observable } from "rxjs";
import Graphic from "@arcgis/core/Graphic";
import { ColorPlan } from "../../symbol.service";
import { GeomUtils } from "../../GemoUtils";

export class TownLayer extends BaseLayer {

    override getInitData(townName?: string): Observable<any[]> {
        const apiUrl = 'http://localhost:3000/api/town';
        return this.http.get(apiUrl) as Observable<any[]>
    }

    override getGeometry(item: any): __esri.Geometry {
        return GeomUtils.toGeometry('polygon',item.geom)
    }

    override getSymbol(item: any) {
        const name:string = item.name;
        return this.symbolService.getFillSymbol(name, ColorPlan.white) as any
    }

    override layerName: string = 'town';

    private router: Router

    constructor(mapview: MapView) {
        super(mapview)

        const appInjector = AppInjector.getInjector()
        this.router = appInjector.get(Router)
    }


    override onClick(graphic: __esri.Graphic, event: __esri.ViewClickEvent): void {
        super.onClick(graphic, event)
        console.log('town layer click')
        this.router.navigate(['/town', graphic.attributes.name]);

    }

    override onRightClick(graphic: __esri.Graphic, event: __esri.ViewClickEvent): void {
        console.log('town layer right click')

    }

    override onMouseOver(g: __esri.Graphic, event: __esri.ViewPointerMoveEvent): void {
        // console.log('over ', g.attributes.name)
        if (!(g as any)._originalSymbol) {
            (g as any)._originalSymbol = (g.symbol as any).clone();
        }
        const newSymbol = this.symbolService.getFillSymbol(g.attributes.name, ColorPlan.black_orange, 12, -18, 0, 0, 1) as any
        g.symbol = newSymbol
    }

    override onMouseOut(g: __esri.Graphic, event: __esri.ViewPointerMoveEvent): void {
        console.log('out', g.attributes.name)
        if ((g as any)._originalSymbol) {
            g.symbol = (g as any)._originalSymbol;
            delete (g as any)._originalSymbol;
        }
    }

}