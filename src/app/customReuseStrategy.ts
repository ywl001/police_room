import { RouteReuseStrategy, DetachedRouteHandle, ActivatedRouteSnapshot } from '@angular/router';
import { MapComponent } from './map-component/map-component';

export class CustomReuseStrategy implements RouteReuseStrategy {

  private storedHandles = new Map<string, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
     return true;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    const component = (handle as any).componentRef?.instance;
    if (component?.mapView) {
      // 临时解除 mapView 容器绑定
      component.mapView.container = null;
    }
    this.storedHandles.set(route.routeConfig?.path!, handle);
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return this.storedHandles.has(this.getKey(route));
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const handle = this.storedHandles.get(route.routeConfig?.path!) || null;
    if (handle) {
      const component = (handle as any).componentRef?.instance;
      if (component?.mapView && component.mapContainer) {
        // 重新绑定 mapView
        component.mapView.container = component.mapContainer.nativeElement;
        component.restoreLayerInteractions?.();
      }
    }
    return handle;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  private getKey(route: ActivatedRouteSnapshot) {
    return route.routeConfig?.path || '';
  }
}
