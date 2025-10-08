import { Router } from "@angular/router";
import MapView from "@arcgis/core/views/MapView";
import { Observable } from "rxjs";
import { AppInjector } from "../../app-injector";
import { GeomUtils } from "../../GemoUtils";
import { ColorPlan } from "../../symbol.service";
import { BaseLayer } from "./base-layer";

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