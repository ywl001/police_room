// src/app/customReuseStrategy.ts
import { RouteReuseStrategy, DetachedRouteHandle, ActivatedRouteSnapshot } from '@angular/router';
import { MapComponent } from './map-component/map-component';

export class CustomReuseStrategy implements RouteReuseStrategy {
  private storedHandles = new Map<string, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return route.routeConfig?.component === MapComponent;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    if (handle) {
      this.storedHandles.set(this.getKey(route), handle);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return this.storedHandles.has(this.getKey(route));
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return this.storedHandles.get(this.getKey(route)) || null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  private getKey(route: ActivatedRouteSnapshot) {
    return route.routeConfig?.path || '';
  }
}
