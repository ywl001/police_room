import { Routes } from '@angular/router';
import { MapComponent } from './map-component/map-component';

export const routes: Routes = [
    { path: '', component: MapComponent },                // 默认显示乡镇
    { path: 'town/:townName', component: MapComponent }   // 显示某个乡镇的村庄
];
