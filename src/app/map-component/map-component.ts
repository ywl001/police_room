import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import EsriMap from "@arcgis/core/Map";
import esriConfig from "@arcgis/core/config";
import Extent from "@arcgis/core/geometry/Extent.js";
import Geometry from "@arcgis/core/geometry/Geometry.js";
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import MapView from '@arcgis/core/views/MapView';
import { firstValueFrom, ReplaySubject, Subject } from 'rxjs';
import { ContextMenu } from '../context-menu/context-menu';
import { AppEventType, EventBus } from '../event.bus';
import { InfowindowComponent } from "./infowindow/infowindow.component";
import { OutlineLayer } from './layers.ts/outline-layer';
import { PoliceRoomLayer } from './layers.ts/police-room-layer';
import { TownLayer } from './layers.ts/town-layer';
import { VillageLayer } from './layers.ts/village-layer';
import { MapEventManager } from './map-event-manager';
import { SketchManagerService } from './sketch-manager.service';

@Component({
  selector: 'app-map-component',
  template: `
    <div #mapDiv style="width: 100%; height:100%;"></div>
    @if (showBack()) {
      <div class="btn-container">
        <button (click)="goHome()">返回</button>
        <button (click)="addPoint()">添加警务室</button>
      </div>
      
    }
    <app-infowindow></app-infowindow>
  `,
  styles: `
   .btn-container {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 99;
      padding: 6px 12px;
    }
  `,
  imports: [InfowindowComponent]
})
export class MapComponent {

  @ViewChild('mapDiv', { static: true }) private mapViewEl!: ElementRef;
  @ViewChild(InfowindowComponent, { static: false }) infowindow!: InfowindowComponent;

  private villageLayer!: VillageLayer;
  private townLayer!: TownLayer;
  private roomLayer!: PoliceRoomLayer;
  private outlineLayer!: OutlineLayer;
  private map!: EsriMap;
  private mapView!: MapView;
  private mapReady$ = new ReplaySubject<void>(1); // 👈 地图初始化完成通知

  showBack = signal(false);;

  private townExtent!: Extent

  private destroy$ = new Subject<void>();

  constructor(
    private eventManager: MapEventManager,
    private sketchManager: SketchManagerService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private eventBus:EventBus
  ) { }

  ngOnInit() {
    esriConfig.assetsPath = '/assets/arcgis';
    esriConfig.fontsUrl = '/assets/arcgis/fonts';

    // 监听路由变化
    this.route.paramMap.subscribe(async params => {
      const townName = params.get('townName');

      // 等待地图初始化完成
      await firstValueFrom(this.mapReady$);

      console.log('start router')

      if (townName) {
        this.showVillageLayer(townName);
      } else {
        this.showTownLayer();
      }
    });

    this.eventBus.on(AppEventType.ShowInfoWindow,(msg)=>{this.showInfoWindow(msg)})

    this.eventBus.on(AppEventType.closeInfoWindow,()=>this.infowindow.hide())

    // this.message.showInfoWindow$
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(msg => {
    //     this.showInfoWindow(msg)
    //   })


    // this.message.message$
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe((type) => {
    //     if (type == MessageType.closeInfowindow || type == MessageType.clickMap) {
    //       this.infowindow.hide()
    //     }
    //   })
  }

  showTownLayer() {
    if (!this.map) return;
    this.map.remove(this.villageLayer);
    if (this.townLayer) {
      this.townLayer.visible = true
    }

    this.showBack.set(false);

    if (!this.townExtent) {
      this.townExtent = this.getGraphicsExtent(this.townLayer) as any
      this.mapView.goTo(this.townExtent)
    }
  }

  async showVillageLayer(townName: string) {
    console.log('show village layer')
    if (!this.map) return;

    if (this.townLayer)
      this.townLayer.visible = false;

    if (this.map.layers.includes(this.villageLayer)) {
      this.map.remove(this.villageLayer)
    }

    this.villageLayer = new VillageLayer(this.mapView, townName);
    await this.villageLayer.init()
    this.map.add(this.villageLayer);

    this.roomLayer = new PoliceRoomLayer(this.mapView, townName)
    await this.roomLayer.init()
    this.map.add(this.roomLayer)

    this.outlineLayer = new OutlineLayer(this.mapView)
    this.map.add(this.outlineLayer)

    const extent = this.getGraphicsExtent(this.villageLayer)
    this.mapView.goTo(extent).catch(console.error);

    // // }
    this.showBack.set(true);
    console.log('加载城镇', townName, '的村庄数据');
  }

  async ngAfterViewInit() {
    console.log('after view init')
    this.map = new EsriMap();

    this.mapView = new MapView({
      container: this.mapViewEl.nativeElement,
      map: this.map
    });

    this.mapView.ui.remove('zoom');
    this.mapView.ui.remove('attribution');
    this.townLayer = new TownLayer(this.mapView)
    await this.townLayer.init()
    this.map.add(this.townLayer);

    // const tile = new VectorTileLayer({
    //   url: 'http://localhost:8081/map_tile/mengjin/p12',
    //   minScale: 20000,  // 小于 1:5000 不显示（地图更放大）
    //   maxScale: 250,
    // })
    // this.map.add(tile)

    this.mapView.when(() => {
      this.eventManager.init(this.mapView);
      this.sketchManager.init(this.mapView)

      // ✅ 通知地图准备完毕
      this.mapReady$.next();
      console.log('map is ready')

      // reactiveUtils.watch(
      //   () => this.mapView.scale,
      //   (scale) => {
      //     console.log(scale)
      //   }
      // )
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }

  private getGraphicsExtent(layer: __esri.GraphicsLayer): __esri.Extent | null {
    if (!layer || layer.graphics.length === 0) return null;

    let extent = layer.graphics.getItemAt(0).geometry.extent;
    layer.graphics.forEach(g => {
      if (g.geometry && g.geometry.extent) {
        extent = extent.union(g.geometry.extent);
      }
    });

    return extent;
  }

  addPoint() {
    console.log('add point')
    this.sketchManager.startCreate('point', this.roomLayer)
  }


  private showInfoWindow(msg: any) {
    const { component, graphic } = msg;

    if (component === ContextMenu) {
      console.log('show menu');
      this.infowindow.isShowTitle = false;
      if (this.getFeatureCenter(graphic.geometry)) {
        let ref = this.infowindow.show(this.mapView, this.getFeatureCenter(graphic.geometry) as Point, ContextMenu);
        ref.instance.data = graphic;
      }
    }
  }

  private getFeatureCenter(geo: Geometry): Point | null {
    if (geo.type == 'point') {
      return geo as Point;
    } else if (geo.type == 'polygon') {
      return (<Polygon>geo).centroid
    }
    return null;
  }


  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.map.layers.forEach(item => item.destroy())

    this.eventBus.clearAll()
  }
}
