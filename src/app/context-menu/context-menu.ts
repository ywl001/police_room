import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { MessageService, MessageType } from '../message.service';
import Graphic from '@arcgis/core/Graphic';
import { BaseLayer } from '../map-component/layers.ts/base-layer';
import { SketchManagerService } from '../map-component/sketch-manager.service';
import { G } from '@angular/cdk/keycodes';


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

  constructor(private message: MessageService,private sketchManager:SketchManagerService) { }

  ngOnInit() {
    console.log('menu init')
  }

  onEdit() {
    console.log('edit')
    this.message.editAttributes(this.data)
    this.message.sendMessage(MessageType.closeInfowindow)
  }

  onDelete() {
    this.message.delFeature(this.data)
    this.message.sendMessage(MessageType.closeInfowindow)
  }

  onMove() {
    this.sketchManager.startEdit(this.data)
    this.message.sendMessage(MessageType.closeInfowindow)
  }

  onPeople() {

  }
}
