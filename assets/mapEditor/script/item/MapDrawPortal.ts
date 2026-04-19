// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html
import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import { ModeMgr } from "../frameWork/ModeMgr";
import { UnitType } from "../type/mapTypes";
import { ModeType } from "../type/types";
import { MapDrawDatPortalData, PortalType } from "./MapDrawDat";
import MapDrawP from "./MapDrawP";
import MapDrawUnitBase from "./MapDrawUnitBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawPortal extends MapDrawUnitBase {
  @property(cc.Node)
  heighLight: cc.Node = null;

  protected _type: UnitType.Portal;
  offsetX: number = 0;

  linkP: cc.Node;
  animPs: cc.Node[] = []

  private _dat: MapDrawDatPortalData;
  protected _portalType: PortalType;


  protected onLoad(): void {
    // 必须调用父类，注册拖拽/点击事件
    super.onLoad();
    if (this.heighLight && cc.isValid(this.heighLight)) {
      this.heighLight.active = false;
    }
  }

  protected start(): void {
    this._portalType = PortalType.Drop;
  }

  public getType() {
    return UnitType.Portal;
  }

  public init(dat: MapDrawDatPortalData, linkP: cc.Node, animPs: cc.Node[]): void {
    this._dat = dat;
    this.linkP = linkP;
    this.animPs = animPs;
    this.offsetX = dat.offsetX;
  }

  setOffsetX(offset: number) {
    this.offsetX = offset;
  }

  public getOffsetX() {
    return this.offsetX;
  }

  public setLinkP(linkP: cc.Node) {
    this.linkP = linkP;
  }

  public getLinkP() {
    return this.linkP;
  }

  public setAnimPs(animPs: cc.Node[]) {
    this.animPs = animPs;
  }

  public getAnimP() {
    return this.animPs;
  }

  public getDat(): MapDrawDatPortalData {
    const animPIds = (this.animPs || [])
      .filter((bindPoint) => bindPoint && cc.isValid(bindPoint))
      .map((bindPoint) => bindPoint.getComponent(MapDrawP))
      .filter((pointCom) => pointCom && pointCom.getId())
      .map((pointCom) => pointCom.getId()) ?? [];

    const linkId = (this.linkP && cc.isValid(this.linkP)) ? this.linkP?.getComponent(MapDrawP)?.getId() ?? "" : ""

    const dat: MapDrawDatPortalData = {
      linkId: linkId,
      pos: this.getPos(),
      offsetX: this.offsetX,
      portalType: this._portalType,
      animPIds: animPIds,
    };
    return dat;
  }
}
