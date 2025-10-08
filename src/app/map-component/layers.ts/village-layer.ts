import MapView from "@arcgis/core/views/MapView";
import { BaseLayer } from "./base-layer";
import Polygon from "@arcgis/core/geometry/Polygon";
import { firstValueFrom, Observable } from "rxjs";
import Graphic from "@arcgis/core/Graphic";
import { ColorPlan } from "../../symbol.service";
import { ContextMenu } from "../../context-menu/context-menu";
import { AttributeDialog } from "../../attribute-dialog/attribute-dialog";
import { Type } from "@angular/core";
import { AppInjector } from "../../app-injector";
import { AppState } from "../../app.state";
import { GeomUtils } from "../../GemoUtils";
import { AppEventType } from "../../event.bus";

export class VillageLayer extends BaseLayer {

    override getInitData(): Observable<any[]> {
        const apiUrl = `http://localhost:3000/api/village?town=${this.currentTown}`
        return this.http.get(apiUrl) as Observable<any[]>
    }

    override getGeometry(item: any): __esri.Geometry {
        return GeomUtils.toGeometryAuto(item.geom)
    }

    override getSymbol(item: any) {
        const name: string = item.name
        let color = ColorPlan.light_yellow
        if (name == '西霞院水库' || name == '小浪底水库') {
            color = ColorPlan.light_blue
        } else if (item.room_id) {
            // if (item.room_id % 5 == 0) {
            //     color = ColorPlan.light_pink
            // } else if (item.room_id % 5 == 1) {
            //     color = ColorPlan.misty_rose
            // }else if (item.room_id % 5 == 2) {
            //     color = ColorPlan.serene_coastal
            // }else if (item.room_id % 5 == 3) {
            //     color = ColorPlan.water_lavender
            // }else  if(item.room_id % 5 == 4){
            //     color = ColorPlan.white_green
            // }
        }
        return this.symbolService.getFillSymbol(name, color) as any
    }

    private currentTown: string = '';

    constructor(mapView: MapView, town: string) {
        super(mapView)
        this.currentTown = town

        const appState = AppInjector.getInjector().get(AppState)

        this.dataLoaded$.subscribe((data: any) => {
            console.log('父类数据加载完成');
            // this.onDataReady(data);
            appState.setVillages(data)
            appState.setCurrentTown(town)
        });

        // this.minScale = 100000;
        this.maxScale = 10000;
    }

    override layerName: string = 'village';

    override onMouseOver(g: __esri.Graphic, event: __esri.ViewPointerMoveEvent): void {
        if (!(g as any)._originalSymbol) {
            (g as any)._originalSymbol = (g.symbol as any).clone();
        }

        const newSymbol = this.symbolService.getFillSymbol(g.attributes.name, ColorPlan.white_blue, 14, -18, 0, 0, 1,) as any
        g.symbol = newSymbol
    }

    override onMouseOut(g: __esri.Graphic, event: __esri.ViewPointerMoveEvent): void {
        if ((g as any)._originalSymbol) {
            g.symbol = (g as any)._originalSymbol;
            delete (g as any)._originalSymbol;
        }
    }

    override onClick(graphic: Graphic, event: __esri.ViewClickEvent): void {
        console.log('village click:', graphic.attributes)
    }

    override onRightClick(graphic: Graphic, event: __esri.ViewClickEvent): void {
        console.log('village click')
        this.eventBus.emit(AppEventType.ShowInfoWindow,{component:ContextMenu,graphic})
    }

    override getAttributeDialogComponent(): Type<any> {
        return AttributeDialog
    }

    override getUpdateApiUrl(id: number): string {
        return `http://localhost:3000/api/village/${id}`
    }
}