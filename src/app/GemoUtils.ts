// geom-utils.ts
import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";
import Polygon from "@arcgis/core/geometry/Polygon";
import Graphic from "@arcgis/core/Graphic";
import * as projection from "@arcgis/core/geometry/projection";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";

export class GeomUtils {

  /** =========================
   * 自动识别类型生成 ArcGIS Geometry
   * 支持：Point, Polyline, Polygon / MultiPolygon
   * ========================= */
  static toGeometryAuto(geom: any): __esri.Geometry {
    if (!geom) throw new Error("Invalid geometry data");

    // Point
    if (geom.x !== undefined && geom.y !== undefined) {
      return new Point(geom);
    }

    // Polyline: [[x,y],[x,y],...]
    if (Array.isArray(geom) && Array.isArray(geom[0]) && typeof geom[0][0] === "number") {
      return new Polyline({ paths: [geom] });
    }

    // Polygon / MultiPolygon: [[[ {x,y}, ... ]], ...]
    if (Array.isArray(geom) && Array.isArray(geom[0])) {
      return this.toPolygon(geom);
    }

    throw new Error("Cannot auto-detect geometry type");
  }

  /** 手动指定类型生成 Geometry */
  static toGeometry(type: 'point' | 'polyline' | 'polygon', geom: any): __esri.Geometry {
    if (!geom) throw new Error("Invalid geometry data");

    if (type === 'point') return new Point(geom);
    if (type === 'polyline') return new Polyline({ paths: geom });
    if (type === 'polygon') return this.toPolygon(geom);

    throw new Error(`Unsupported geometry type: ${type}`);
  }

  /** 将任意单面或多面 Polygon 数据转换为 ArcGIS Polygon */
  static toPolygon(outline: any): Polygon {
    if (!outline) throw new Error("Invalid outline");

    const rings: number[][][] = [];

    const extractRings = (part: any) => {
      if (Array.isArray(part)) {
        if (part.length && part[0]?.x !== undefined) {
          rings.push(part.map((p: any) => [p.x, p.y]));
        } else {
          part.forEach(extractRings);
        }
      }
    };

    extractRings(outline);

    return new Polygon({ rings });
  }

  /** =========================
   * ArcGIS Geometry -> MySQL WKT 自动识别类型
   * ========================= */
  static toMysqlAuto(geometry: __esri.Geometry): string {
    if (!geometry) throw new Error("Invalid geometry");
    if (geometry.type === "point") return `POINT(${(geometry as __esri.Point).x} ${(geometry as __esri.Point).y})`;
    if (geometry.type === "polyline") {
      const line = geometry as __esri.Polyline;
      const pathsStr = line.paths
        .map(path => path.map(([x, y]) => `${x} ${y}`).join(", "))
        .join("),(");
      return `LINESTRING(${pathsStr})`;
    }
    if (geometry.type === "polygon") {
      const poly = geometry as __esri.Polygon;
      const formatRing = (ring: number[][]) => ring.map(([x, y]) => `${x} ${y}`).join(", ");
      if (poly.rings.length === 1) return `POLYGON((${formatRing(poly.rings[0])}))`;
      const multi = poly.rings.map(ring => `((${formatRing(ring)}))`).join(", ");
      return `MULTIPOLYGON(${multi})`;
    }
    throw new Error(`Unsupported geometry type: ${geometry.type}`);
  }

  /** 手动指定 Geometry -> WKT */
  static toMysql(geometry: __esri.Geometry, type: 'point' | 'polyline' | 'polygon'): string {
    if (type === "point") {
      const p = geometry as __esri.Point;
      return `POINT(${p.x} ${p.y})`;
    }
    if (type === "polyline") {
      const line = geometry as __esri.Polyline;
      const pathsStr = line.paths
        .map(path => path.map(([x, y]) => `${x} ${y}`).join(", "))
        .join("),(");
      return `LINESTRING(${pathsStr})`;
    }
    if (type === "polygon") {
      const poly = geometry as __esri.Polygon;
      const formatRing = (ring: number[][]) => ring.map(([x, y]) => `${x} ${y}`).join(", ");
      if (poly.rings.length === 1) return `POLYGON((${formatRing(poly.rings[0])}))`;
      const multi = poly.rings.map(ring => `((${formatRing(ring)}))`).join(", ");
      return `MULTIPOLYGON(${multi})`;
    }
    throw new Error(`Unsupported geometry type: ${type}`);
  }

  /** Graphic -> WKT */
  static graphicToMysql(graphic: Graphic): string {
    return this.toMysqlAuto(graphic.geometry);
  }


  static async convertToWGS84(geometry: __esri.Geometry): Promise<__esri.Geometry> {
    // 确保投影模块已加载
    if (!projection.isLoaded()) {
      await projection.load();
    }
    return projection.project(geometry as Point | Polyline | Polygon, SpatialReference.WGS84) as __esri.Geometry;
  }

  static isWebMercator(geometry: __esri.Geometry) {
    return geometry.spatialReference?.isWebMercator ?? false;
  }
}
