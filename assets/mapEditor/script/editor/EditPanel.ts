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
import { attrPanelTypeRoom, attrPanelType, attrPanelTypeBase } from "../type/types";
import AttrPanelBase from "./AttrPanelBase";
import AttrPanelRoom from "./AttrPanelRoom";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EditPanel extends cc.Component {

    @property(cc.Node)
    baseAttr: cc.Node;

    @property(cc.Node)
    roomAttr: cc.Node;

    private _dat: attrPanelType;

    protected onLoad(): void {
        EventManager.instance.on(MapEditorEvent.RefreshAttrPanel, this.refreshAttr, this);
    }

    protected onDestroy(): void {
        EventManager.instance.off(MapEditorEvent.RefreshAttrPanel, this.refreshAttr, this);
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
            case UnitType.Door:
            case UnitType.Ladder:
            case UnitType.EnemyRefresh:
            case UnitType.SearchItem:
            case UnitType.Portal:
        }
    }

    private actNd() {
        this.baseAttr.active = true;
        const type = this._dat.type;
        this.roomAttr.active = type == UnitType.Room;
    }

    private showBaseAttrNd() {
        const dat = this._dat.dat as attrPanelTypeBase;
        this.baseAttr.getComponent(AttrPanelBase).setAttr(dat);
    }

    private showRoomAttrNd() {
        const dat = this._dat.dat as attrPanelTypeRoom;
        this.roomAttr.getComponent(AttrPanelRoom).setAttr(dat);
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
            case UnitType.Door:
            case UnitType.Ladder:
            case UnitType.EnemyRefresh:
            case UnitType.SearchItem:
            case UnitType.Portal:
        }
        const attrDat: attrPanelType = {
            type: unitType,
            dat: dat
        }
        EventManager.instance.emit(MapEditorEvent.UpdateFromAttrPanel, attrDat);
    }
}
