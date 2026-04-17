// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import { UnitType } from "../type/mapTypes";
import {
  attrPanelTypeRoom,
  attrPanelType,
  attrPanelTypeBase,
  attrPanelTypePoint,
  attrPanelTypeDoor,
  attrPanelTypeLadder,
  attrPanelTypePortal,
  attrPanelTypeCable,
} from "../type/types";
import AttrPanelBase from "./attrPanel/AttrPanelBase";
import AttrPanelCable from "./attrPanel/AttrPanelCable";
import AttrPanelDoor from "./attrPanel/AttrPanelDoor";
import AttrPanelLadder from "./attrPanel/AttrPanelLadder";
import AttrPanelPoint from "./attrPanel/AttrPanelPoint";
import AttrPanelPortal from "./attrPanel/AttrPanelPortal";
import AttrPanelRoom from "./attrPanel/AttrPanelRoom";

const { ccclass, property } = cc._decorator;

//属性面板自用事件
export enum AttrPanelEvent {
  afterEdit = "afterEdit",
}

@ccclass
export default class EditPanel extends cc.Component {
  @property(cc.Node)
  baseAttr: cc.Node;

  @property(cc.Node)
  roomAttr: cc.Node;

  @property(cc.Node)
  pointAttr: cc.Node;

  @property(cc.Node)
  doorAttr: cc.Node;

  @property(cc.Node)
  ladderAttr: cc.Node;

  @property(cc.Node)
  portalAttr: cc.Node;

  @property(cc.Node)
  cableAttr: cc.Node;

  //areaInfo
  @property(cc.EditBox)
  areaInfoLb: cc.EditBox;

  private _dat: attrPanelType;


  protected onLoad(): void {
    this.clear();
    EventManager.instance.on(
      MapEditorEvent.RefreshAttrPanel,
      this.refreshAttr,
      this,
    );
    EventManager.instance.on(
      MapEditorEvent.RefreshAreaInfo,
      this.setAreaInfo,
      this
    )
    EventManager.instance.on(MapEditorEvent.ClearEditPanel, this.clear, this);
    EventManager.instance.on(
      AttrPanelEvent.afterEdit,
      this.onChangeAttr,
      this
    )
  }

  protected onDestroy(): void {
    EventManager.instance.off(
      MapEditorEvent.RefreshAttrPanel,
      this.refreshAttr,
      this,
    );
    EventManager.instance.off(
      MapEditorEvent.RefreshAreaInfo,
      this.setAreaInfo,
      this
    )
    EventManager.instance.off(MapEditorEvent.ClearEditPanel, this.clear, this);
    EventManager.instance.off(AttrPanelEvent.afterEdit,
      this.onChangeAttr,
      this)
  }

  private refreshAttr(attrDat: attrPanelType) {
    this._dat = attrDat;
    this.actNd();
    switch (attrDat.type) {
      case UnitType.Default:
        this.showBaseAttrNd();
        break;
      case UnitType.Room:
        this.showRoomAttrNd();
        break;
      case UnitType.PathPoint:
        this.showPointAttrNd();
        break;
      case UnitType.Door:
        this.showDoorAttrNd();
        break;
      case UnitType.Ladder:
        this.showLadderAttrNd();
        break;
      case UnitType.Portal:
        this.showPortalAttrNd();
        break;
      case UnitType.Cable:
        this.showCableAttrNd();
        break;
    }
  }

  private actNd() {
    this.baseAttr.active = true;
    const type = this._dat.type;
    this.roomAttr.active = type == UnitType.Room;
    this.pointAttr.active = type == UnitType.PathPoint;
    this.doorAttr.active = type == UnitType.Door;
    this.ladderAttr.active = type == UnitType.Ladder;
    this.portalAttr.active = type == UnitType.Portal;
    this.cableAttr.active = type == UnitType.Cable;
  }

  private showBaseAttrNd() {
    const dat = this._dat.dat as attrPanelTypeBase;
    this.baseAttr.getComponent(AttrPanelBase).setAttr(dat);
  }

  private showRoomAttrNd() {
    const dat = this._dat.dat as attrPanelTypeRoom;
    this.roomAttr.getComponent(AttrPanelRoom).setAttr(dat);
  }

  private showPointAttrNd() {
    const dat = this._dat.dat as attrPanelTypePoint;
    this.pointAttr.getComponent(AttrPanelPoint).setAttr(dat);
  }

  private showDoorAttrNd() {
    const dat = this._dat.dat as attrPanelTypeDoor;
    this.doorAttr.getComponent(AttrPanelDoor).setAttr(dat);
  }

  private showLadderAttrNd() {
    const dat = this._dat.dat as attrPanelTypeLadder;
    this.ladderAttr.getComponent(AttrPanelLadder).setAttr(dat);
  }

  private showPortalAttrNd() {
    const dat = this._dat.dat as attrPanelTypePortal;
    this.portalAttr.getComponent(AttrPanelPortal).setAttr(dat);
  }

  private showCableAttrNd() {
    const dat = this._dat.dat as attrPanelTypeCable;
    this.cableAttr.getComponent(AttrPanelCable).setAttr(dat);
  }

  public onChangeAttr(type: string) {
    const unitType = Number(type) as UnitType;
    let dat;
    switch (unitType) {
      case UnitType.Default:
        dat = this.baseAttr.getComponent(AttrPanelBase).getDat();
        break;
      case UnitType.Room:
        dat = this.roomAttr.getComponent(AttrPanelRoom).getDat();
        break;
      case UnitType.PathPoint:
        dat = this.pointAttr.getComponent(AttrPanelPoint).getDat();
        break;
      case UnitType.Door:
        dat = this.doorAttr.getComponent(AttrPanelDoor).getDat();
        break;
      case UnitType.Ladder:
        dat = this.ladderAttr.getComponent(AttrPanelLadder).getDat();
        break;
      case UnitType.Portal:
        dat = this.portalAttr.getComponent(AttrPanelPortal).getDat();
        break;
      case UnitType.Cable:
        dat = this.cableAttr.getComponent(AttrPanelCable).getDat();
        break;
      default:
        break;
    }
    const attrDat: attrPanelType = {
      type: unitType,
      dat: dat,
    };
    EventManager.instance.emit(MapEditorEvent.UpdateFromAttrPanel, attrDat);
  }

  public setAreaInfo(areaInfo: number[]) {
    let str = "";
    areaInfo.forEach((areaIndex, index) => {
      str += `${areaIndex}`;
      if (index >= areaInfo.length - 1) return;
      str += "_"
    })
    this.areaInfoLb.string = str;
  }

  public areaInfoChange() {
    const areaInfo = this.areaInfoLb.string.split("_").map(a => Number(a));
    EventManager.instance.emit(MapEditorEvent.UpdateAreaInfoFormPanel, areaInfo);
  }

  public clear() {
    this.baseAttr.active = false;
    this.roomAttr.active = false;
    this.pointAttr.active = false;
    this.doorAttr.active = false;
    this.ladderAttr.active = false;
    this.portalAttr.active = false;
    this.cableAttr.active = false;
  }
}
