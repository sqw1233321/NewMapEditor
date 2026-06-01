import { MapDrawTool } from "../../item/MapDrawTool";
import { AttrCfgType, AttrCfgTypes, AttrPanelPropertyType, UnitType } from "../../type/mapTypes";
import DynamicGetter from "../DynamicGetter/DynamicGetter";
import { ReflectionMgr } from "../ReflectionMgr";
import MapDrawItemBase from "./MapDrawItemBase";


const { ccclass, property } = cc._decorator;

@ccclass
//绘制item数据层
export default class MapDrawItem extends MapDrawItemBase {
  protected _unitType: UnitType = UnitType.Default;

  protected _exportName: string = "";

  private _jsonDat: any;
  protected _canEditdat: any;

  private _isInit: boolean = false;

  public init(type: UnitType, dat?) {
    if (this._isInit) return;
    this._isInit = true;
    this._unitType = type;
    this.setSprite(type);
    if (!dat) {
      dat = this.getDefaultDat();
    }
    this._jsonDat = dat;
    this._canEditdat = this.jsonDatToMapDat(this._jsonDat);
  }

  //获取默认数据
  private getDefaultDat(): any {
    const json = DynamicGetter.Ins.getAttrSetting();
    const dat = this.getDefaultDataByClassName(json, this._unitType);
    return dat;
  }

  public getType() {
    return this._unitType;
  }

  public getRoomId(): number {
    return this._canEditdat["roomId"];
  }

  public updateRoomId(roomId: number) {
    this._canEditdat["roomId"] = roomId;
  }

  //属性面板设置属性
  public setAttrDat(dat: any) {
    this._canEditdat = {};
    Object.keys(dat).forEach(key => {
      let resultDat = dat[key];
      //点id转化为node引用
      const pointCheck = this.checkPropertyIsPoint(key);
      if (pointCheck.isPoint) {
        const type = pointCheck.type;
        if (type === "point") {
          const pointId = dat[key] ?? "";
          resultDat = MapDrawTool.instance.getPathPointById(pointId);
        } else if (type === "pointArray") {
          resultDat = [];
          const points = dat[key];
          points?.forEach((p: any) => {
            resultDat.push(MapDrawTool.instance.getPathPointById(p));
          });
        }
      }
      this._canEditdat[key] = resultDat;
    });
  }

  //获取属性面板数据
  public getAttrDat() {
    const resDat = {};
    Object.keys(this._canEditdat).forEach(key => {
      let resultDat = this._canEditdat[key];
      //node引用转化为点id
      const pointCheck = this.checkPropertyIsPoint(key);
      if (pointCheck.isPoint) {
        const type = pointCheck.type;
        if (type === "point") {
          const pointNd = this._canEditdat[key] as cc.Node;
          resultDat = pointNd?.getComponent(MapDrawItem)?._canEditdat["id"] ?? "";
        } else if (type === "pointArray") {
          resultDat = [];
          const pointNds = this._canEditdat[key] as cc.Node[];
          pointNds?.forEach((pNd: cc.Node) => {
            if (!cc.isValid(pNd)) return;
            resultDat.push(pNd.getComponent(MapDrawItem)._canEditdat["id"]);
          });
        }
      }
      resDat[key] = resultDat;
    });
    return resDat;
  }

  public updateMapDat() {
    this._canEditdat = this.jsonDatToMapDat(this._jsonDat);
  }

  //json数据与游戏对象数据的转化（主要是点id要变成node引用）
  private jsonDatToMapDat(dat): any {
    const resDat = {};
    Object.keys(dat).forEach(key => {
      let resultDat = dat[key];
      //如果是点，要把id转化为node
      const pointCheck = this.checkPropertyIsPoint(key);
      if (pointCheck.isPoint) {
        const type = pointCheck.type;
        if (type === "point") {
          const pointId = dat[key] ?? "";
          resultDat = MapDrawTool.instance.getPathPointById(pointId);
        } else if (type === "pointArray") {
          resultDat = [];
          const points = dat[key];
          points?.forEach((p: any) => {
            resultDat.push(MapDrawTool.instance.getPathPointById(p));
          });
        }
      }
      resDat[key] = resultDat;
    });
    return resDat;
  }

  //获取导出数据
  public getExportDat() {
    const resDat = {};
    const json = DynamicGetter.Ins.getAttrSetting()
    json.typeArr.forEach((t: AttrCfgType) => {
      if (t.ClassName === this._unitType) {
        t.Properties.forEach((p: AttrPanelPropertyType) => {
          const key = p.ClassPropertyName;
          let resultDat = this._canEditdat[key];
          //如果是点，要把node转化为id
          const pointCheck = this.checkPropertyIsPoint(key);
          if (pointCheck.isPoint) {
            const type = pointCheck.type;
            if (type === "point") {
              const pointNd = resultDat as cc.Node;
              resultDat = pointNd?.getComponent(MapDrawItem)?.getAttrDat()["id"] ?? "";
            } else if (type === "pointArray") {
              resultDat = [];
              const points = this._canEditdat[key] as cc.Node[];
              points?.forEach((pNd: any) => {
                if (!cc.isValid(pNd)) return;
                resultDat.push(pNd.getComponent(MapDrawItem).getAttrDat()["id"]);
              });
            }
          }
          resDat[key] = resultDat ?? p.DefaultValue;
        });
      }
    });
    return resDat;
  }

  public getExportName() {
    if (!this._exportName) {
      const json = DynamicGetter.Ins.getItemSetting();
      const typeConfig = json?.find((t: any) => t.ClassName === this._unitType);
      if (typeConfig) {
        this._exportName = typeConfig.ExportName;
      }
    }
    return this._exportName;
  }


  //========工具方法========

  /**
  * 根据 ClassName 获取默认值对象
  */
  private getDefaultDataByClassName(attrObj: AttrCfgTypes, className: UnitType): any {
    const typeConfig = attrObj?.typeArr?.find((t: any) => t.ClassName === className);
    if (!typeConfig) {
      console.warn(`[AttrMgr] 未找到 ClassName: ${className}`);
      return {};
    }

    return this.generateDefaultData(typeConfig);
  }


  /**
* 根据配置递归生成默认值对象
* @param config 配置对象
* @returns 默认值对象
*/
  private generateDefaultData(config: { Properties?: any[] }): any {
    const result: any = {};

    if (!config.Properties) {
      return result;
    }

    for (const prop of config.Properties) {
      const classPropertyName = prop.ClassPropertyName;
      if (!classPropertyName) continue;

      switch (prop.Type) {
        case "object":
          // 对象类型：递归处理内部的 Properties
          result[classPropertyName] = this.generateDefaultData({ Properties: prop.Properties });
          break;

        case "array":
        case "pointArray":
          // 数组类型：直接返回空数组，停止递归
          result[classPropertyName] = prop.DefaultValue ?? [];
          break;

        case "boolean":
          result[classPropertyName] = prop.DefaultValue ?? false;
          break;

        case "label":
        default:
          result[classPropertyName] = prop.DefaultValue ?? "";
          break;
      }
    }

    return result;
  }

  /**
  * 递归查找属性配置
  * @param properties Properties 数组
  * @param propertyName 要查找的属性名
  * @returns 属性配置对象，未找到返回 null
  */
  protected findPropertyConfig(properties: any[], propertyName: string): any | null {
    if (!properties) return null;

    for (const prop of properties) {
      if (prop.ClassPropertyName === propertyName) {
        return prop;
      }

      // 如果有嵌套的 Properties，递归查找
      if (prop.Properties && prop.Properties.length > 0) {
        const found = this.findPropertyConfig(prop.Properties, propertyName);
        if (found) return found;
      }
    }

    return null;
  }

  /**
  * 检查属性是否为 point 或 pointArray 类型
  */
  private checkPropertyIsPoint(propertyName: string): { isPoint: boolean, type: string } {
    const json = DynamicGetter.Ins.getAttrSetting();
    const typeConfig = json?.typeArr?.find((t: any) => t.ClassName === this._unitType);
    if (!typeConfig) {
      return { isPoint: false, type: "" };
    }

    // 递归查找属性配置
    const propertyConfig = this.findPropertyConfig(typeConfig.Properties, propertyName);
    if (!propertyConfig) {
      return { isPoint: false, type: "" };
    }

    // 检查 Type 是否为 point 或 pointArray
    return { isPoint: propertyConfig.Type === "point" || propertyConfig.Type === "pointArray", type: propertyConfig.Type };
  }

}

ReflectionMgr.registerClass('MapDrawItem', MapDrawItem);