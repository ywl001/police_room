import { Injectable } from '@angular/core';
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol.js";
import TextSymbol from "@arcgis/core/symbols/TextSymbol.js";

export const ColorPlan = {
  purple: {
    fillColor: [111, 66, 193, 255],
    strokeColor: [96, 54, 170, 255],
    fontColor: [255, 255, 255, 255]
  },
  white_blue: {
    fillColor: [33, 150, 243, 255],
    strokeColor: [21, 101, 192, 255],
    fontColor: [255, 255, 255, 255]
  },
  white_green: {
    fillColor: [76, 175, 80, 255],
    strokeColor: [51, 139, 57, 255],
    fontColor: [255, 255, 255, 255]
  },
  black_orange: {
    fillColor: [255, 152, 0, 255],
    strokeColor: [204, 102, 0, 255],
    fontColor: [255, 255, 255, 255]
  },
  white_red: {
    fillColor: [244, 67, 54, 255],
    strokeColor: [183, 28, 28, 255],
    fontColor: [255, 255, 255, 255]
  },
  black_gray: {
    fillColor: [158, 158, 158, 255],
    strokeColor: [97, 97, 97, 255],
    fontColor: [0, 0, 0, 255]
  },
  // 新增浅色风格方案（浅底黑字，高对比，适合明亮主题）
  light_blue: {
    fillColor: [173, 216, 230, 255],    // 浅蓝填充
    strokeColor: [135, 206, 235, 255],  // 稍深蓝边框
    fontColor: [0, 0, 0, 255]           // 黑色字体
  },
  light_green: {
    fillColor: [144, 238, 144, 255],    // 浅绿填充
    strokeColor: [124, 252, 0, 255],    // 亮绿边框（稍深）
    fontColor: [0, 0, 0, 255]           // 黑色字体
  },
  light_pink: {
    fillColor: [255, 182, 193, 255],    // 浅粉填充
    strokeColor: [219, 112, 147, 255],  // 深粉边框
    fontColor: [0, 0, 0, 255]           // 黑色字体
  },
  light_yellow: {
    fillColor: [255, 255, 224, 255],    // 浅黄填充
    strokeColor: [255, 215, 0, 255],    // 金黄边框
    fontColor: [0, 0, 0, 255]           // 黑色字体
  },
  white: {
    fillColor: [255, 255, 255, 255],      // 白底
    strokeColor: [180, 180, 180, 255],    // 较深边框
    fontColor: [85, 85, 85, 255]          // 字体偏灰黑
  },
  gray: {
    fillColor: [230, 230, 230, 255],      // 灰色背景
    strokeColor: [200, 200, 200, 255],    // 边框略深一点
    fontColor: [0, 0, 0, 50]       // 字体偏淡，带透明度
  },
  misty_rose: {  // 温暖粉红调
    fillColor: [253, 223, 223, 255],    // Misty Rose 填充
    strokeColor: [252, 247, 222, 255],  // Cornsilk 边框（稍暖）
    fontColor: [0, 0, 0, 255]           // 黑色字体（高对比）
  },
  nyanza_green: {  // 清新绿调
    fillColor: [222, 253, 224, 255],    // Nyanza 填充
    strokeColor: [222, 253, 224, 255],  // Nyanza 边框（单色柔和）
    fontColor: [0, 0, 0, 255]           // 黑色字体
  },
  water_lavender: {  // 蓝紫调
    fillColor: [222, 243, 253, 255],    // Water 填充
    strokeColor: [240, 222, 253, 255],  // Lavender 边框
    fontColor: [0, 0, 0, 255]           // 黑色字体
  },
  // 更多新增方案，来源：Design Pixie 的浅色调灵感 [](grok_render_citation_card_json={"cardIds":["97ea85"]})
  serene_coastal: {  // 宁静海岸蓝
    fillColor: [191, 239, 255, 255],    // Powder Blue 填充
    strokeColor: [70, 130, 180, 255],   // Steel Blue 边框
    fontColor: [0, 0, 0, 255]           // 黑色字体
  },
  gentle_meadow: {  // 温柔草地绿
    fillColor: [188, 245, 169, 255],    // Sage Green 填充
    strokeColor: [34, 139, 34, 255],    // Forest Green 边框
    fontColor: [0, 0, 0, 255]           // 黑色字体
  },
  whispering_bloom: {  // 低语花朵粉
    fillColor: [255, 192, 203, 255],    // Blush Pink 填充
    strokeColor: [199, 21, 133, 255],   // Medium Violet Red 边框
    fontColor: [255, 255, 255, 255]     // 白色字体（粉色暖调对比）
  },
  misty_horizon: {  // 薄雾地平线桃
    fillColor: [255, 229, 180, 255],    // Pale Peach 填充
    strokeColor: [205, 133, 63, 255],   // Peru 边框
    fontColor: [0, 0, 0, 255]           // 黑色字体
  },
  red_yellow: {
    fillColor: [220, 53, 69, 255],        // 红色背景
    strokeColor: [185, 43, 52, 255],      // 边框略深一点
    fontColor: [255, 193, 7, 255]
  }
}

@Injectable({
  providedIn: 'root'
})
export class SymbolService {

  /**
   * 透明填空符号
   */
  transparentFillSymbol = new SimpleFillSymbol({
    color: [0, 0, 0, 0],
    style: "solid",
    outline: {
      width: 1,
      color: [255, 255, 255, 1]
    }
  });

  getPointSymbol(picName: string, content: string, size: number = 14, offsetX = 8, fontSize = 10, color = [49, 49, 49, 255]) {
    return {
      type: "cim",
      data: {
        type: "CIMSymbolReference",
        symbol: {
          type: "CIMPointSymbol",
          symbolLayers: [
            this.getTextSymbol(content, fontSize, offsetX, 0, 0, color),
            this.getPicSymbol(picName, size)
          ]
        }
      }
    }
  }

  /**
   * 
   * @param content 文本内容
   * @param fontsize 文字大小
   * @param offsetX x偏移
   * @param offsetY y偏移
   * @param rotation 旋转角度
   * @param strokeWidth 线宽
   * @param colorPlan 配色方案，字符串
   * @returns 
   */
  getFillSymbol(
    content: string,
    colorPlan = ColorPlan.black_gray,
    fontsize = 10,
    offsetX = 0,
    offsetY = 0,
    rotation = 0,
    strokeWidth = 1
  ) {

    let fillColor = colorPlan.fillColor;
    let strokeColor = colorPlan.strokeColor;
    let fontColor = colorPlan.fontColor;

    return {
      type: "cim",
      data: {
        type: "CIMSymbolReference",
        symbol: {
          type: "CIMPointSymbol",
          symbolLayers: [
            this.getTextSymbol(content, fontsize, offsetX, offsetY, rotation, fontColor),
            this.getFillSymbolLayer(fillColor),
            this.getStrokeSymbolLayer(strokeColor, strokeWidth)
          ]
        }
      }
    }
  }

  getPicSymbol(symbol: string, size = 14, angle = 0) {
    return {
      type: "CIMPictureMarker",
      enable: true,
      anchorPoint: {
        x: 0,
        y: 0
      },
      size: size,
      scaleX: 1,
      rotation: -angle,
      tintColor: [255, 255, 255, 255],
      url: symbol
    }
  }

  getTextSymbol(content: string, size = 10, offsetX = 8, offsetY = 0, rotation = 0, color = [255, 255, 49, 255], h_align = 'Left') {
    return {
      type: "CIMVectorMarker",
      enable: true,
      size: size,
      colorLocked: true,
      anchorPointUnits: "Relative",
      frame: {
        xmin: -5,
        ymin: -5,
        xmax: 5,
        ymax: 5
      },
      markerGraphics: [{
        type: "CIMMarkerGraphic",
        geometry: {
          x: 0,
          y: 0
        },
        symbol: {
          type: "CIMTextSymbol",
          // fontFamilyName: fontFamily,
          // fontStyleName: "Bold",
          height: size,
          horizontalAlignment: h_align,
          verticalAlignment: "Center",
          offsetX: offsetX,
          offsetY: offsetY,
          symbol: {
            type: "CIMPolygonSymbol",
            symbolLayers: [{
              type: "CIMSolidFill",
              enable: true,
              "color": color
            }]
          },
          angle: rotation
        },
        textString: content
      }],
      scaleSymbolsProportionally: true,
      respectFrame: true,
    }
  }


  getFillSymbolLayer(color: number[] = [151, 219, 242, 255]) {
    return {
      "type": "CIMSolidFill",
      "enable": true,
      "color": color
    }
  }


  getStrokeSymbolLayer(color = [0, 0, 0, 255], width: number = 1) {
    return {
      "type": "CIMSolidStroke",
      "enable": true,
      "capStyle": "Round",
      "joinStyle": "Round",
      "lineStyle3D": "Strip",
      "miterLimit": 10,
      "width": width,
      "color": color
    }
  }

  getDashedPolygonSymbol() {
    return {
      type: "simple-fill",  // autocasts as new SimpleFillSymbol()
      color: [200, 0, 0, 0.4],  // 填充颜色设置为透明
      style: "solid",       // 填充样式为 solid，虚线设置在边框上
      outline: {
        type: "simple-line", // autocasts as new SimpleLineSymbol()
        color: "red",      // 边框颜色
        width: 2,            // 边框宽度
        style: "solid"        // 边框样式为虚线
      }
    };
  }


  getSimpleFillSymbol() {
    return {
      type: "simple-fill",  // autocasts as new SimpleFillSymbol()
      color: [51, 51, 204, 0.9],
      style: "solid",
      outline: {  // autocasts as new SimpleLineSymbol()
        color: "white",
        width: 1
      }
    };
  }

}

