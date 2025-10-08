import { Injectable, Type } from '@angular/core';
import { Subject, Subscription, filter, map, Observable } from 'rxjs';
import Graphic from '@arcgis/core/Graphic';

export enum AppEventType {
  CreateGeoComplete = 'createGeoComplete',
  UpdateGeoComplete = 'updateGeoComplete',
  EditAttributes = 'editAttributes',
  DeleteFeature = 'deleteFeature',
  ShowInfoWindow = 'showInfoWindow',
  OpenDialog = 'openDialog',
  SendMessage = 'sendMessage',
  ClearOutline = 'clearOutline',
  showOutline = 'showOutline',
  RefreshMap = 'refreshMap', // 空事件示例
  closeInfoWindow = 'closeInfoWindow'
}

export interface EventPayloads {
  [AppEventType.CreateGeoComplete]: Graphic;
  [AppEventType.UpdateGeoComplete]: Graphic;
  [AppEventType.EditAttributes]: Graphic;
  [AppEventType.DeleteFeature]: Graphic;
  [AppEventType.ShowInfoWindow]: { component: Type<any>; graphic: Graphic };
  [AppEventType.OpenDialog]: { component: Type<any>; data: any };
  [AppEventType.SendMessage]: string;
  [AppEventType.showOutline]:any;
  [AppEventType.ClearOutline]: void;
  [AppEventType.RefreshMap]: void;
  [AppEventType.closeInfoWindow]: void;
}

export interface AppEvent<K extends AppEventType = AppEventType> {
  type: K;
  payload: EventPayloads[K];
}

@Injectable({ providedIn: 'root' })
export class EventBus {
  private event$ = new Subject<AppEvent>();
  private scopedSubscriptions = new Map<string, Subscription[]>();
  private DEFAULT_SCOPE = 'default';

  emit<K extends AppEventType>(type: K, payload?: EventPayloads[K]) {
    this.event$.next({ type, payload: payload as EventPayloads[K] });
  }

  on<K extends AppEventType>(
    type: K,
    handler: (payload: EventPayloads[K]) => void,
    scope: string = this.DEFAULT_SCOPE // 默认 scope
  ) {
    const sub = this.event$
      .pipe(
        filter((e): e is AppEvent<K> => e.type === type),
        map(e => e.payload)
      )
      .subscribe(handler);

    const arr = this.scopedSubscriptions.get(scope) || [];
    arr.push(sub);
    this.scopedSubscriptions.set(scope, arr);
  }

  /** 清理指定 scope 的订阅 */
  clearScope(scope: string = this.DEFAULT_SCOPE) {
    const subs = this.scopedSubscriptions.get(scope);
    if (subs) {
      subs.forEach(s => s.unsubscribe());
      this.scopedSubscriptions.delete(scope);
    }
  }

  /** 清理所有订阅 */
  clearAll() {
    this.scopedSubscriptions.forEach(subs => subs.forEach(s => s.unsubscribe()));
    this.scopedSubscriptions.clear();
  }
}
