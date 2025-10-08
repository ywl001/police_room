import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import Graphic from '@arcgis/core/Graphic';
import { BaseLayer } from '../map-component/layers.ts/base-layer';
import { SketchManagerService } from '../map-component/sketch-manager.service';
import { AppEventType, EventBus } from './../event.bus';


@Component({
  selector: 'app-context-menu',
  imports: [CommonModule],
  templateUrl: './context-menu.html',
  styleUrl: './context-menu.scss'
})
export class ContextMenu {

  private _data!: Graphic;
  public get data(): Graphic {
    return this._data;
  }
  public set data(value: Graphic) {
    this._data = value;
    this.type = (value.layer as BaseLayer).layerName
  }

  type:string = 'room'

  constructor(private eventBus:EventBus,private sketchManager:SketchManagerService) { }

  ngOnInit() {
    console.log('menu init')
  }

  onEdit() {
    console.log('edit')
    this.eventBus.emit(AppEventType.EditAttributes,this.data)
    this.eventBus.emit(AppEventType.closeInfoWindow)
  }

  onDelete() {
    this.eventBus.emit(AppEventType.DeleteFeature,this.data)
    this.eventBus.emit(AppEventType.closeInfoWindow)
  }

  onMove() {
    this.eventBus.emit(AppEventType.closeInfoWindow)
    this.sketchManager.startEdit(this.data)
  }

  onPeople() {

  }
}
