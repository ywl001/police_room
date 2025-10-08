import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import Polygon from '@arcgis/core/geometry/Polygon';
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine.js";
import { GeomUtils } from '../GemoUtils';
import { AppState } from '../app.state';


enum EditType {
  room = 'room',
  village = 'village',
  town = 'town'
}

enum State {
  add = 'add',
  edit = 'edit'
}

@Component({
  selector: 'app-attribute-dialog',
  templateUrl: './attribute-dialog.html',
  styleUrl: './attribute-dialog.scss',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatListModule
  ],
})
export class AttributeDialog {
  name = '';
  summary = '';

  selectedVillages: any[] = []

  form: FormGroup;
  editType: EditType = EditType.room;
  state: State = State.add;

  villages: any[];
  private town: string;

  constructor(
    private fb: FormBuilder,
    private appState: AppState,
    private dialogRef: MatDialogRef<AttributeDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.villages = this.appState.villages()
    this.town = this.appState.currentTown()

    this.form = this.fb.group({
      name: [data?.attributes?.name || '', Validators.required],
      summary: [data?.attributes?.summary || ''],
    });

    this.editType = data.editType;
    this.state = data?.attributes?.id ? State.edit : State.add

    console.log('state', this.state)

    if (data?.attributes?.include_villages?.length) {
      this.selectedVillages = this.villages.filter((v: any) =>
        data.attributes.include_villages!.includes(v.id)
      );
    }
  }

  onVillageChange(event: MatSelectionListChange) {
    this.selectedVillages = event.source.selectedOptions.selected.map(opt => opt.value);
    console.log(this.selectedVillages)
  }

  onConfirm() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    let newData: any

    if (this.editType == EditType.room) {
      const villageIds = this.selectedVillages.map(v => v.id);
      const vp = this.getVillagesPolygon(villageIds);
      newData = Object.assign(this.form.value, { include_villages: villageIds, villages_outline: vp, town: this.town })
    } else {
      newData = Object.assign(this.form.value)
    }

    if (this.state === State.edit) {
      const change = this.getChangedFields(newData, this.data)
      this.dialogRef.close(change)
      console.log(change)
    } else {
      this.dialogRef.close(newData)
    }
  }

  onCancel() {
    this.dialogRef.close(null);
  }

  getChangedFields(newData: any, oldData: any) {
    const changed: any = {};

    Object.keys(newData).forEach(key => {
      const newVal = newData[key];
      const oldVal = oldData[key];

      // 比较数组
      if (Array.isArray(newVal) && Array.isArray(oldVal)) {
        const same =
          newVal.length === oldVal.length &&
          newVal.every((v, i) => v === oldVal[i]);
        if (!same) changed[key] = newVal;
      }
      // 比较普通值
      else if (newVal !== oldVal) {
        changed[key] = newVal;
      }
    });

    return changed;
  }

  getVillagesPolygon(villageIds: number[]) {
    const polygons = villageIds
      .map(id => this.villages.find(v => v.id === id))
      .map(v => v.geom[0].map((p: any) => [p.x, p.y]))
      .map(geom => new Polygon({ rings: [geom] }));

    const mergedGeometry = geometryEngine.union(polygons as Polygon[]) as Polygon;

    // mergedGeometry.rings 可能是二维数组：多个不连通的 ring
    // 判断是否有多面
    if (!mergedGeometry.rings || mergedGeometry.rings.length === 0) return null;

    return GeomUtils.toMysqlAuto(mergedGeometry)
  }

}
