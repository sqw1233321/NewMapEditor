import MapDrawP from "../../item/MapDrawP";
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

  static getUniqueType(dat): number {
    return -1;
  }

  public init(type: UnitType, uniqueType: number = -1, dat?) {
    if (this._isInit) return;
    this.onBeforeInit();
    this._isInit = true;
    this._unitType = type;
    this._uniqueType = uniqueType;
    if (!dat) {
      dat = this.getDefaultDat();
    }
    this.setSprite(type);
    this.setSpine(type);
    this._jsonDat = dat;
    //旧的数据中可能有条件不满足的属性有值，需要筛选一下
    this._jsonDat = this.checkCondition(this._jsonDat);
    //点的id转化为node
    this._canEditdat = this.pointStrDatToMapDat(this._jsonDat);
    this.onAfterInit();
  }

  //获取默认数据
  protected getDefaultDat(): any {
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
    this._canEditdat = this.pointStrDatToMapDat(dat);
    this.onAttrChange();
  }

  //获取属性面板数据
  public getAttrDat() {
    const resDat = this.pointMapDatToStrDat(this._canEditdat);
    return resDat;
  }

  public updateMapDat() {
    this._canEditdat = this.pointStrDatToMapDat(this._jsonDat);
  }

  //获取导出数据
  public getExportDat() {
    const resDat = {};
    const json = DynamicGetter.Ins.getAttrSetting()
    //基础属性写入
    resDat["pos"] = this.getPos();
    //特殊属性写入
    const typeJson = json.typeArr.find((t: AttrCfgType) => t.ClassName == this._unitType);
    if (typeJson) {
      typeJson.Properties.forEach((p: AttrPanelPropertyType) => {
        //将点的node转化为id
        resDat[p.ClassPropertyName] = this.pointMapDatToStrDatResucr(this._canEditdat[p.ClassPropertyName], p);
      });
    }
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

  //获取导出给各个excelJson的信息
  public getExportExcelDat() {
    return null;
  }


  //==============================工具方法========================================


  //===================默认数据生成========================
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


  //===================点的类型转换（再MapDraw中点需要为引用）========================

  //点的str转化为node
  private pointStrDatToMapDat(dat) {
    const resDat = {};
    Object.keys(dat).forEach(key => {
      let resultDat = dat[key];
      //点id转化为node引用
      const property = this.findPropertyJson(key);
      if (!property) return;
      resDat[key] = this.pointStrDatToMapDatResucr(resultDat, property);
    });
    return resDat;
  }

  private pointStrDatToMapDatResucr(dat, property: AttrPanelPropertyType) {
    const type = property.Type;
    if (type === "point") {
      const pointId = dat ?? "";
      const pointNd = MapDrawTool.instance.getPathPointById(pointId);
      if (!pointNd || !cc.isValid(pointNd)) {
        return null;
      }
      else {
        return pointNd;
      }
    } else if (type === "pointArray") {
      const resultDat = [];
      const points = dat;
      points?.forEach((p: any) => {
        const pointNd = MapDrawTool.instance.getPathPointById(p);
        if (pointNd && cc.isValid(pointNd)) {
          resultDat.push(pointNd);
        }
      });
      return resultDat;
    }

    let resDat = dat;
    if (type === "object") {
      resDat = {}
      property?.Properties?.forEach(p => {
        resDat[p.ClassPropertyName] = this.pointStrDatToMapDatResucr(dat[p.ClassPropertyName], p);
      })
    }
    else if (type === "array") {
      resDat = []
      dat?.forEach((datItem) => {
        const res = this.pointStrDatToMapDatResucr(datItem, property?.Properties?.[0]);
        if (res) resDat.push(res);
      })
    }
    //其余的不动
    return resDat;
  }


  //点的node转化为str
  private pointMapDatToStrDat(dat: any) {
    const resDat = {};
    Object.keys(dat).forEach(key => {
      let resultDat = dat[key];
      //node引用转化为点id
      const property = this.findPropertyJson(key);
      if (!property) return;
      resDat[key] = this.pointMapDatToStrDatResucr(resultDat, property);
    });
    return resDat;
  }

  private pointMapDatToStrDatResucr(dat, property: AttrPanelPropertyType) {
    const type = property.Type;
    if (type === "point") {
      const pointNd = dat as cc.Node;
      if (pointNd && cc.isValid(pointNd)) {
        return pointNd.getComponent(MapDrawP)?.getId() ?? "";
      }
      else {
        return "";
      }
    } else if (type === "pointArray") {
      const resultDat = [];
      const pointNds = dat as cc.Node[];
      pointNds?.forEach((pNd: cc.Node) => {
        if (!pNd || !cc.isValid(pNd)) return;
        resultDat.push(pNd.getComponent(MapDrawP)?.getId() ?? "");
      });
      return resultDat;
    }

    let resDat = dat;
    if (type === "object") {
      resDat = {}
      property?.Properties?.forEach(p => {
        resDat[p.ClassPropertyName] = this.pointMapDatToStrDatResucr(dat[p.ClassPropertyName] ?? p.DefaultValue, p);
      })
    }
    else if (type === "array") {
      resDat = []
      dat?.forEach((datItem) => {
        const res = this.pointMapDatToStrDatResucr(datItem, property?.Properties?.[0]);
        if (res) resDat.push(res);
      })
    }
    //其余的不动
    return resDat;
  }


  /**
  * 检查属性是否为 point 或 pointArray 类型
  */
  private findPropertyJson(propertyName: string): AttrPanelPropertyType {
    const json = DynamicGetter.Ins.getAttrSetting();
    const typeConfig = json?.typeArr?.find((t: any) => t.ClassName === this._unitType);
    if (!typeConfig) {
      return null;
    }
    // 递归查找属性配置
    const propertyConfig = typeConfig.Properties.find((p: AttrPanelPropertyType) => p.ClassPropertyName === propertyName);
    if (!propertyConfig) {
      return null;
    }
    return propertyConfig;
  }

  //===================数据条件检测========================
  //数据条件检测（为了兼容旧数据有目前条件不满足的属性的数据，需要置为defaultValue ex: unlockPoints）
  //条件只用检测第一层的（现在）
  private checkCondition(dat) {
    const json = DynamicGetter.Ins.getAttrSetting();
    const typeConfig = json?.typeArr?.find((t: any) => t.ClassName === this._unitType) as AttrCfgType;
    if (!typeConfig) return;

    const resDat = {};
    const grouped: { [key: string]: AttrPanelPropertyType[] } = {};

    typeConfig.Properties?.forEach(property => {
      const key = property.ClassPropertyName;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(property);
    });

    Object.keys(grouped).forEach(key => {
      const properties = grouped[key];
      const matchedProperty = properties.find(property => this.checkConditionById(typeConfig, property, dat));

      if (matchedProperty) {
        resDat[key] = dat[key] ?? matchedProperty.DefaultValue;
      } else {
        resDat[key] = properties[0]?.DefaultValue;
      }
    });

    return resDat;
  }

  private checkConditionById(typeConfig: AttrCfgType, property: AttrPanelPropertyType, curDat?) {
    if (!property.Condition) return true;
    const condition = property.Condition;
    const isNotEqual = condition.includes("!=");
    const splitStr = isNotEqual ? "!=" : "=";
    const conditionProperties = condition.split(splitStr);
    const targetId = conditionProperties[0];
    const needValue = conditionProperties[1];
    const targetProperty = typeConfig.Properties?.find(p => p.ID === targetId);
    if (!targetProperty) return false;
    const targetValue = `${curDat[targetProperty.ClassPropertyName] ?? targetProperty.DefaultValue}`;
    //不管什么类型都转化为string，就能直接比较了（感觉会有问题呢）
    return isNotEqual ? needValue !== targetValue : needValue === targetValue;
  }

}

ReflectionMgr.registerClass('MapDrawItem', MapDrawItem);