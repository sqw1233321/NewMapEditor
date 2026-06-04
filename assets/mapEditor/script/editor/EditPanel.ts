import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import { AttrCfgTypes, UnitType } from "../type/mapTypes";
import AttrPanelPrefab from "./attrPrefab/AttrPanelPrefab";
import AttrPanelBase from "./attrPrefab/BaseAttrPanel";
import BaseAttrPanel from "./attrPrefab/BaseAttrPanel";
import DynamicGetter from "./DynamicGetter/DynamicGetter";

const { ccclass, property } = cc._decorator;

//属性面板自用事件
export enum AttrPanelEvent {
  afterEdit = "afterEdit",
}

//属性面板
@ccclass
export default class EditPanel extends cc.Component {
  @property(cc.Node)
  baseAttr: cc.Node;

  @property(AttrPanelPrefab)
  prefabAttr: AttrPanelPrefab;

  @property(cc.Node)
  dropDownLayer: cc.Node;

  private _dat;
  private _attrObj: AttrCfgTypes;

  private _trackNd: cc.Node;
  private _hasUniqueAttr: boolean = true;

  protected onLoad(): void {
    this.clear();

    EventManager.instance.on(
      MapEditorEvent.EditorInitComplete,
      this.init,
      this
    )

    EventManager.instance.on(
      MapEditorEvent.RefreshAttrPanel,
      this.refreshAttr,
      this,
    );
    EventManager.instance.on(MapEditorEvent.ClearEditPanel, this.clear, this);
    EventManager.instance.on(
      AttrPanelEvent.afterEdit,
      this.onChangeAttr,
      this
    )
    EventManager.instance.on(MapEditorEvent.CreateDropDown, this.setDropDown, this);
  }

  protected onDestroy(): void {
    EventManager.instance.off(
      MapEditorEvent.EditorInitComplete,
      this.init,
      this
    )

    EventManager.instance.off(
      MapEditorEvent.RefreshAttrPanel,
      this.refreshAttr,
      this,
    );
    EventManager.instance.off(MapEditorEvent.ClearEditPanel, this.clear, this);
    EventManager.instance.off(AttrPanelEvent.afterEdit,
      this.onChangeAttr,
      this);
    EventManager.instance.off(MapEditorEvent.CreateDropDown, this.setDropDown, this);
  }


  private init() {
    const attrSetting = DynamicGetter.Ins.getAttrSetting();
    this._attrObj = attrSetting as AttrCfgTypes;
  }

  private refreshAttr(attrDat, trackNd: cc.Node) {
    if (!trackNd || !cc.isValid(trackNd)) {
      this.clear();
      return;
    }
    this._dat = attrDat;
    const isNew = attrDat.type !== UnitType.Default && trackNd !== this._trackNd;
    if (isNew) {
      this._trackNd = trackNd;
      this.clearDropDown();
    }
    this.actNd(isNew);
  }

  public clear() {
    this.clearDropDown();
    this.baseAttr.active = false;
    this.prefabAttr.node.active = false;
  }

  private actNd(isNew: boolean) {
    //基础属性
    if (this._dat.type == UnitType.Default) {
      this.baseAttr.active = true;
      this.baseAttr.getComponent(BaseAttrPanel).setAttr(this._dat.dat);
    }
    else {
      const attrSetting = this._attrObj.typeArr.find(type => type.ClassName == this._dat.type);
      this._hasUniqueAttr = !!attrSetting;
      this.prefabAttr.node.active = this._hasUniqueAttr;
      this.prefabAttr.init(attrSetting, this._dat.dat, isNew);
    }
  }

  public onChangeAttr(type: string) {
    //基础属性
    if (type == UnitType.Default) {
      const baseDat = this.baseAttr.getComponent(AttrPanelBase).getDat();
      const baseAttrDat = {
        type: UnitType.Default,
        dat: baseDat,
      };
      EventManager.instance.emit(MapEditorEvent.UpdateFromAttrPanel, baseAttrDat);
    }
    else if (this._hasUniqueAttr) {
      //特殊属性
      const uniqueDat = this.prefabAttr.getComponent(AttrPanelPrefab).getDat();
      const uniqueAttrDat = {
        type: this._dat.type,
        dat: uniqueDat,
      };
      EventManager.instance.emit(MapEditorEvent.UpdateFromAttrPanel, uniqueAttrDat);
    }
  }

  public onChangeBase() {
    this.onChangeAttr(UnitType.Default);
  }

  //将下拉框设置到这个层级上
  private setDropDown(dropDownNd: cc.Node, worldPos: cc.Vec2) {
    this.dropDownLayer.addChild(dropDownNd);
    const localPos = this.dropDownLayer.convertToNodeSpaceAR(worldPos);
    dropDownNd.setPosition(localPos);
  }

  //切换追踪点的收把下拉框也要清理完毕
  private clearDropDown() {
    this.dropDownLayer.removeAllChildren();
  }

}
