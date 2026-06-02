import MapDrawItem from "../editor/mapDrawElement/MapDrawItem";
import { MapEditorEvent } from "../event/eventTypes";
import MapDrawP from "../item/MapDrawP";
import MapDrawRoom from "../item/MapDrawRoom";
import MapLoader from "../item/MapLoader";
import MapTool from "../tool/MapTool";
import { UnitType } from "../type/mapTypes";
import { EventManager } from "./EventManager";
import { Singleton } from "./Singleton";

export class AttrMgr extends Singleton<AttrMgr> {
    //属性面板追踪的节点(注意删除节点时的问题)
    private _trackNd: cc.Node;
    private _mapLoader: MapLoader;

    /** 属性变更回调（用于撤销功能） */
    public onAttrChanged?: () => void;

    public static get instance(): AttrMgr {
        return super.instance as AttrMgr;
    }

    protected onInit(params: MapLoader) {
        this._mapLoader = params[0] as MapLoader;
        EventManager.instance.on(
            MapEditorEvent.UpdateFromAttrPanel,
            this.refreshNdAttr,
            this,
        );
    }

    protected onDestroy(): void {
        EventManager.instance.off(
            MapEditorEvent.UpdateFromAttrPanel,
            this.refreshNdAttr,
            this,
        );
    }

    public setTrackNd(trackNd: cc.Node) {
        this._trackNd = trackNd;
    }

    public getTrachNd() {
        return this._trackNd;
    }

    //节点刷新属性面板
    public refreshAttrPanel() {
        if (!this._trackNd) return;
        const itemDat = this._trackNd;
        const controller = itemDat.getComponent(MapDrawItem);
        const type = controller.getType();

        //基础属性的同步
        const worldPos = this._trackNd.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const pos = MapTool.converWorldPosToMapPos(worldPos);
        const baseDat = {
            name: this._trackNd.name,
            pos: pos,
        };
        const basePanelDat = {
            type: UnitType.Default,
            dat: baseDat,
        };
        EventManager.instance.emit(MapEditorEvent.RefreshAttrPanel, basePanelDat, this._trackNd);
        if (type == UnitType.Default) return;

        //特殊属性
        const attrDat = this._trackNd.getComponent(MapDrawItem).getAttrDat();
        const panelDat = {
            type: type,
            dat: attrDat,
        };
        EventManager.instance.emit(MapEditorEvent.RefreshAttrPanel, panelDat, this._trackNd);
    }


    //属性面板刷新节点
    public refreshNdAttr(attrDat) {
        if (!this._trackNd) return;
        if (!this._mapLoader) return;
        const type = attrDat.type;
        let dat = attrDat.dat;
        switch (type) {
            case UnitType.Default:
                const worldPos = MapTool.converMapPosToWorldPos(dat.pos);
                const localPos = this._trackNd.parent.convertToNodeSpaceAR(worldPos);
                this._trackNd.setPosition(localPos);
                break;
            case UnitType.Room:
                const newCfgId = Number(dat.cfgId);
                const hasNd = this._mapLoader.getRoomNode(newCfgId);
                if (!hasNd) {
                    const oldCfgId = this._trackNd.getComponent(MapDrawRoom).getRoomCfgId();
                    this._trackNd.getComponent(MapDrawRoom).updateRoomId(newCfgId);
                    this._trackNd.getComponent(MapDrawRoom).setManulSet(true);
                    this._mapLoader.renameRoomNode(oldCfgId, newCfgId, this._trackNd);
                }
                this._trackNd.getComponent(MapDrawRoom).setAttrDat(dat);
                this._mapLoader.refreshLayerBoundsByNode(this._trackNd.parent);
                break;
            case UnitType.PathPoint:
                this._trackNd.getComponent(MapDrawP).setAttrDat(dat);
                break;
            case UnitType.Ladder:
                const drawItem = this._trackNd.getComponent(MapDrawItem);
                if (drawItem) {
                    drawItem.setAttrDat(attrDat.dat);
                }
                break;
            case UnitType.Door:
            case UnitType.EnemyRefresh:
            case UnitType.SurviveDat:
            case UnitType.FightSoul:
            case UnitType.Portal:
            case UnitType.Cable:
                this._trackNd.getComponent(MapDrawItem).setAttrDat(dat);
                break;
        }

        //如果有房间信息，更新一手
        if (type != UnitType.Room && dat.roomId) {
            const nextRoomId = Number(dat.roomId);
            if (isFinite(nextRoomId)) {
                this._mapLoader.moveUnitToRoom(this._trackNd, nextRoomId);
            }
        }

        // 属性变更回调
        this.onAttrChanged?.();
        //使用现在的属性回写一次属性面板
        this.refreshAttrPanel();
    }
}
