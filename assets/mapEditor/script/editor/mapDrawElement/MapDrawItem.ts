import { AttrCfgTypes, UnitType } from "../../type/mapTypes";
import DynamicGetter from "../DynamicGetter/DynamicGetter";
import MapDrawItemBase from "./MapDrawItemBase";


const { ccclass, property } = cc._decorator;

@ccclass
//绘制item数据层
export default class MapDrawItem extends MapDrawItemBase {

  protected _roomCfgId: number = 0;
  protected _unitType: UnitType = UnitType.Default;

  private _dat: any;

  public init(type: UnitType, dat?) {
    this._unitType = type;
    this.setSprite(type);
    if (!dat) {
      dat = this.getDefaultDat();
    }
    this._dat = dat;
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
    return this._dat["roomId"];
  }

  public updateRoomId(roomId: number) {
    this._dat["roomId"] = roomId;
  }

  //属性面板设置属性
  public setAttrDat(dat: any) {
    this._dat = dat;
  }

  //获取属性面板数据
  public getAttrDat() {
    return this._dat;
  }

  //获取导出数据
  public getExportDat() {
    return this._dat;
  }


  //========工具方法========

  /**
  * 根据 ClassName 获取默认值对象
  */
  public getDefaultDataByClassName(attrObj: AttrCfgTypes, className: UnitType): any {
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
  public generateDefaultData(config: { Properties?: any[] }): any {
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

}
