import Point from "@arcgis/core/geometry/Point";
import MapView from "@arcgis/core/views/MapView";
import { map, Observable } from "rxjs";
import { BaseLayer } from "./base-layer";
import Graphic from "@arcgis/core/Graphic";
import Polygon from "@arcgis/core/geometry/Polygon";
import { ContextMenu } from "../../context-menu/context-menu";
import { Type } from "@angular/core";
import { AttributeDialog } from "../../attribute-dialog/attribute-dialog";
import { GeomUtils } from "../../GemoUtils";
import { AppEventType } from "../../event.bus";

export class PoliceRoomLayer extends BaseLayer {

    outLineGraphic!: Graphic
    override priority: number = 10
    override layerName: string = 'room'
    private townName!: string


    constructor(mapView: MapView, town: string) {
        super(mapView)
        this.townName = town;
    }

    override getInitData(): Observable<any[]> {
        const apiUrl = `http://localhost:3000/api/room?town=${this.townName}`
        return this.http.get<any[]>(apiUrl).pipe(
            map(rooms =>
                rooms.map(room => ({
                    ...room,
                    include_villages: room.include_villages ? JSON.parse(room.include_villages) : []
                }))
            )
        ) as Observable<any[]>
    }

    override getCreateApiUrl(): string {
        return `http://localhost:3000/api/room`
    }

    override getUpdateApiUrl(id: number): string {
        return `http://localhost:3000/api/room/${id}`
    }

    override getDeleteApiUrl(id: number): string {
        return `http://localhost:3000/api/room/${id}`
    }

    override getGeometry(item: any): __esri.Geometry {
        return GeomUtils.toGeometryAuto(item.geom)
    }
    override getSymbol(item: any) {
        const name:string = item.name;
        return this.symbolService.getPointSymbol('/assets/police.png', name, 25, 10, 12) as any
    }

    override onMouseOut(g: __esri.Graphic, event: __esri.ViewPointerMoveEvent): void {
        console.log('point mouse out')

        if ((g as any)._originalSymbol) {
            g.symbol = (g as any)._originalSymbol;
            delete (g as any)._originalSymbol;
        }
        this.clearHighlight()
        // this.message.clearOutline()
        this.eventBus.emit(AppEventType.ClearOutline)
    }

    override onMouseOver(g: __esri.Graphic, event: __esri.ViewPointerMoveEvent): void {
        console.log('room over')
        if (!(g as any)._originalSymbol) {
            (g as any)._originalSymbol = (g.symbol as any).clone();
        }
        const newSymbol = this.symbolService.getPointSymbol('/assets/police.png', g.attributes.name, 30, 10, 15, [255, 0, 0, 255]) as any

        g.symbol = newSymbol
        this.highlight(g)

        const outline = g.attributes.villages_outline

        setTimeout(() => {
            // this.message.showOutline(outline)
            this.eventBus.emit(AppEventType.showOutline,outline)
        }, 10);
    }

    override onRightClick(graphic: Graphic, event: __esri.ViewClickEvent): void {
        console.log('room layer right click')
        this.eventBus.emit(AppEventType.ShowInfoWindow,{component:ContextMenu,graphic})
    }

    override getAttributeDialogComponent(): Type<any> {
        return AttributeDialog
    }

}