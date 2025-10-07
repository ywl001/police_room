import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MapComponent } from "./map-component/map-component";
import { ContextMenu } from "./context-menu/context-menu";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MapComponent, ContextMenu],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'police_room';
}
