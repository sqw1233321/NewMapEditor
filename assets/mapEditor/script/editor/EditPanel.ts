// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import MapDrawRoom from "../item/MapDrawRoom";
import { UnitType } from "../type/mapTypes";
import { attrPanelTypeRoom, attrPanelType, attrPanelTypeBase, attrPanelTypePoint } from "../type/types";
import AttrPanelBase from "./AttrPanelBase";
import AttrPanelPoint from "./AttrPanelPoint";
import AttrPanelRoom from "./AttrPanelRoom";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EditPanel extends cc.Component {

    @property(cc.Node)
    baseAttr: cc.Node;

    @property(cc.Node)
    roomAttr: cc.Node;

    @property(cc.Node)
    pointAttr: cc.Node;

    private _dat: attrPanelType;

    protected onLoad(): void {
        this.clear();
        EventManager.instance.on(MapEditorEvent.RefreshAttrPanel, this.refreshAttr, this);
        EventManager.instance.on(MapEditorEvent.ClearEditPanel, this.clear, this);
    }

    protected onDestroy(): void {
        EventManager.instance.off(MapEditorEvent.RefreshAttrPanel, this.refreshAttr, this);
        EventManager.instance.off(MapEditorEvent.ClearEditPanel, this.clear, this);
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
            case UnitType.Ladder:
            case UnitType.EnemyRefresh:
            case UnitType.SearchPoint:
            case UnitType.Portal:
        }
    }

    private actNd() {
        this.baseAttr.active = true;
        const type = this._dat.type;
        this.roomAttr.active = type == UnitType.Room;
        this.pointAttr.active = type == UnitType.PathPoint;
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

    public onChangeAttr(event, type: string) {
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
            case UnitType.Ladder:
            case UnitType.EnemyRefresh:
            case UnitType.SearchPoint:
            case UnitType.Portal:
        }
        const attrDat: attrPanelType = {
            type: unitType,
            dat: dat
        }
        EventManager.instance.emit(MapEditorEvent.UpdateFromAttrPanel, attrDat);
    }

    public clear() {
        this.baseAttr.active = false;
        this.roomAttr.active = false;
        this.pointAttr.active = false;
    }
}
