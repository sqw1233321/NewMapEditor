// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import EditorSetting from "../editor/EditorSetting";
import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import { UnitType } from "../type/mapTypes";
import { MapDrawDatPortalData } from "./MapDrawDat";
import MapDrawUnitBase from "./MapDrawUnitBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawPortal extends MapDrawUnitBase {
  protected _type: UnitType.Portal;
  @property(cc.Node)
  heighLight: cc.Node = null;

  linkId: string = "";
  offsetX: number = 0;

  private _bindHighlight = false;
  private _savedTint: cc.Color = null;


  protected onLoad(): void {
    // 必须调用父类，注册拖拽/点击事件
    super.onLoad();
    if (this.heighLight && cc.isValid(this.heighLight)) {
      this.heighLight.active = false;
    }
  }

  public getType() {
    return UnitType.Portal;
  }

  protected onUnitLeftMouseDownForLink(_event: cc.Event.EventMouse): boolean {
    if (EditorSetting.Instance.isPortalBindMode()) {
      EventManager.instance.emit(MapEditorEvent.PortalBindPortalClick, this.node);
      return true;
    }
    return false;
  }

  /** 绑定模式：高亮当前选中的传送门 */
  public setPortalBindHighlight(on: boolean) {
    if (on === this._bindHighlight) return;
    if (this.heighLight && cc.isValid(this.heighLight)) {
      this.heighLight.active = on;
    } else {
      // buildPortals() 动态创建的 Portal 没有高亮子节点，退化为改色高亮
      const tintNd = this.node.getComponent(cc.Sprite)
        ? this.node
        : this.node.getChildByName("bg");
      if (tintNd) {
        if (on) {
          if (this._savedTint == null) this._savedTint = tintNd.color.clone();
          tintNd.color = new cc.Color(80, 255, 160, 255);
        } else {
          if (this._savedTint) tintNd.color = this._savedTint;
          this._savedTint = null;
        }
      }
    }
    this._bindHighlight = on;
  }

  public init(...params: any[]): void { }

  setLinkId(id: string) {
    this.linkId = id;
  }

  setOffsetX(offset: number) {
    this.offsetX = offset;
  }

  public getDat(): MapDrawDatPortalData {
    const dat: MapDrawDatPortalData = {
      linkId: this.linkId,
      pos: this.getPos(),
      offsetX: this.offsetX,
    };
    return dat;
  }
}
