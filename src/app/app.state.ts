import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppState {
  villages = signal<any[]>([]);

  currentTown = signal('')

  setVillages(villages: any[]) {
    this.villages.set(villages);
  }

  setCurrentTown(town:string){
    this.currentTown.set(town)
  }
}
