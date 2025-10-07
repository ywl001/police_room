import { Component, Injectable, Type } from '@angular/core';
import Point from '@arcgis/core/geometry/Point';
import { BehaviorSubject, Subject } from 'rxjs';
import Graphic from '@arcgis/core/Graphic';
import { BaseLayer } from './map-component/layers.ts/base-layer';



export enum MessageType {
  closeInfowindow = 'closeInfoWindow',
  startPickMapPoint = 'startMove',
  refreshMark = 'refreshMark',
  clickMap = 'clickMap',
  uploadFile = 'uploadFile',
  closePeoplePlanel = 'closePeoplePlanel',
  saveLocation = "saveLocation",
  changeLayer = 'changeLayer',
  addBuilding = 'addBuilding',
  addPoint = 'addPoint',
  clearSketchGraphic = 'clearSketchGraphic',
  uploadPhotoComplete = 'uploadPhotoComplete',
  setFocusPeople = 'setFocusPeople',
  refreshMap = 'refreshMap',
  clearVillageLayer = 'clearVillageLayer'
}

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  constructor() { }


  private _createGeoComplete = new Subject<Graphic>();
  createGeoComplete$ = this._createGeoComplete.asObservable();
  createGeoComplete(g:Graphic) {
    this._createGeoComplete.next(g);
  }

  private _updeateGeoComplete = new Subject<Graphic>();
  updeateGeoComplete$ = this._updeateGeoComplete.asObservable();
  updeateGeoComplete(g:Graphic) {
    this._updeateGeoComplete.next(g);
  }

  private _editAttributes = new Subject<Graphic>();
  editAttributes$ = this._editAttributes.asObservable();
  editAttributes(g:Graphic) {
    this._editAttributes.next(g);
  }

  private _delFeature = new Subject<Graphic>();
  delFeature$ = this._delFeature.asObservable();
  delFeature(g:Graphic) {
    this._delFeature.next(g);
  }


  private _showInfoWindow = new Subject<any>();
  showInfoWindow$ = this._showInfoWindow.asObservable();
  showInfoWindow<T>(component: Type<T>, data: any) {
    this._showInfoWindow.next({ component, graphic: data });
  }

  private _message = new Subject<MessageType>();
  message$ = this._message.asObservable();
  sendMessage(m:MessageType) {
    this._message.next(m);
  }

  private _openDialog = new Subject();
  openDialog$ = this._openDialog.asObservable();
  openDialog(component:Type<any>,data:any) {
    this._openDialog.next({component:component,data:data});
  }

  // private _uploadImage = new Subject<any>();
  // uploadImage$ = this._uploadImage.asObservable();
  // uploadImage(uploadData:any) {
  //   this._uploadImage.next(uploadData);
  // }



  // private _showVillageExtent = new Subject<string>();
  // showVillageExtent$ = this._showVillageExtent.asObservable();
  // showVillageExtent(villageName:string) {
  //   this._showVillageExtent.next(villageName);
  // }




  // private _addGeo = new Subject();
  // addGeo$ = this._addGeo.asObservable();
  // addGeo() {
  //   this._addGeo.next(null);
  // }






  // private _openDialog = new Subject();
  // openDialog$ = this._openDialog.asObservable();
  // openDialog(component:Type<any>,data:any) {
  //   this._openDialog.next({component:component,data:data});
  // }

  private _getAttributes = new Subject();
  getAttributes$ = this._getAttributes.asObservable();
  getAttributes(attr: any) {
    this._getAttributes.next(attr);
  }

  private _showOutline = new Subject();
  showOutline$ = this._showOutline.asObservable();
  showOutline(attr: any) {
    this._showOutline.next(attr);
  }


  private _clearOutline = new Subject();
  clearOutline$ = this._clearOutline.asObservable();
  clearOutline() {
    this._clearOutline.next(null);
  }





}

