import { MapEditorEvent } from "../event/eventTypes";
import MapDrawCable from "../item/MapDrawCable";
import MapDrawDoor from "../item/MapDrawDoor";
import MapDrawEnemyRefresh from "../item/MapDrawEnemyRefresh";
import MapDrawLadder from "../item/MapDrawLadder";
import MapDrawP from "../item/MapDrawP";
import MapDrawPortal from "../item/MapDrawPortal";
import MapDrawRoom from "../item/MapDrawRoom";
import MapDrawSurvive from "../item/MapDrawSurvive";
import MapDrawUnitBase from "../item/MapDrawUnitBase";
import MapLoader from "../item/MapLoader";
import MapTool from "../tool/MapTool";
import { UnitType } from "../type/mapTypes";
import { attrPanelType, attrPanelTypeBase, attrPanelTypeRoom, attrPanelTypePoint, attrPanelTypeDoor, attrPanelTypePortal, attrPanelTypeCable, attrPanelTypeLadder, attrPanelTypeEnemyRefresh, attrPanelTypeSurviveRefresh } from "../type/types";
import { EventManager } from "./EventManager";
import { Singleton } from "./Singleton";

export class AttrMgr extends Singleton<AttrMgr> {
    //属性面板追踪的节点(注意删除节点时的问题)
    private _trackNd: cc.Node;
    private _mapLoader: MapLoader;

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
        EventManager.instance.on(
            MapEditorEvent.UpdateAreaInfoFormPanel,
            this.refreshAreaInfo,
            this
        )
    }

    protected onDestroy(): void {
        EventManager.instance.off(
            MapEditorEvent.UpdateFromAttrPanel,
            this.refreshNdAttr,
            this,
        );
        EventManager.instance.off(
            MapEditorEvent.UpdateAreaInfoFormPanel,
            this.refreshAreaInfo,
            this
        )
    }

    public setTrackNd(trackNd: cc.Node) {
        this._trackNd = trackNd;
    }

    public getTrachNd() {
        return this._trackNd;
    }

    public refreshAttrPanel() {
        if (!this._trackNd) return;
        const itemDat = this._trackNd;
        const controller = itemDat.getComponent(MapDrawUnitBase);
        const type = controller.getType();

        //基础属性的同步
        const worldPos = this._trackNd.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const pos = MapTool.converWorldPosToMapPos(worldPos);
        const baseDat: attrPanelTypeBase = {
            name: this._trackNd.name,
            pos: pos,
        };
        const basePanelDat: attrPanelType = {
            type: UnitType.Default,
            dat: baseDat,
        };
        EventManager.instance.emit(MapEditorEvent.RefreshAttrPanel, basePanelDat);
        if (type == UnitType.Default) return;

        //特殊属性的同步
        let dat: any = {};
        switch (type) {
            case UnitType.Room:
                (dat as attrPanelTypeRoom).roomId = `${this._trackNd.getComponent(MapDrawRoom).getRoomId()}`;
                (dat as attrPanelTypeRoom).size = this._trackNd.getContentSize();
                (dat as attrPanelTypeRoom).unLockPoints = this._trackNd.getComponent(MapDrawRoom)
                    ?.getUnLockPoints()
                    .filter((nd) => nd && cc.isValid(nd))
                break;
            case UnitType.PathPoint:
                const pointCom = this._trackNd?.getComponent(MapDrawP);
                const links = pointCom?.links ?? [];
                (dat as attrPanelTypePoint).roomId =
                    pointCom?.getDat()?.roomId.toString() ?? "";
                (dat as attrPanelTypePoint).links = links;
                break;
            case UnitType.Door:
                const doorCom = this._trackNd?.getComponent(MapDrawDoor);
                (dat as attrPanelTypeDoor).roomId =
                    doorCom?.getDat()?.roomId.toString() ?? "";
                (dat as attrPanelTypeDoor).hp = doorCom?.getDat().hp ?? 0;
                break;
            case UnitType.Ladder:
                const ladderCom = this._trackNd?.getComponent(MapDrawLadder);
                (dat as attrPanelTypeLadder).roomId =
                    ladderCom?.getDat()?.roomId.toString() ?? "";
                (dat as attrPanelTypeLadder).bindPointIds = ladderCom?.getDat().bindPointIds.map((id) => this._mapLoader.resolvePathPointNodes(id)[0]) ?? [];
                (dat as attrPanelTypeLadder).isExitLadder =
                    ladderCom?.getDat().isExitLadder ?? false;
                break;
            case UnitType.Portal:
                const portalCom = this._trackNd?.getComponent(MapDrawPortal);
                (dat as attrPanelTypePortal).linkP = portalCom.getLinkP();
                (dat as attrPanelTypePortal).offsetX = portalCom?.getDat()?.offsetX ?? 0;
                (dat as attrPanelTypePortal).animPs = portalCom?.getAnimP() ?? [];
                break;
            case UnitType.Cable:
                const controller = this._trackNd?.getComponent(MapDrawCable);
                const cableDat = controller.getDat();
                const startP = this._mapLoader.resolvePathPointNodes(cableDat.point1);
                const endP = this._mapLoader.resolvePathPointNodes(cableDat.point2);
                const pointP = this._mapLoader.resolvePathPointNodes(cableDat.points);
                (dat as attrPanelTypeCable).startP = startP[0];
                (dat as attrPanelTypeCable).endP = endP[0];
                (dat as attrPanelTypeCable).points = pointP;
                (dat as attrPanelTypeCable).speed = cableDat.speed;
                break;
            case UnitType.EnemyRefresh:
                const enemyRefreshCom = this._trackNd?.getComponent(MapDrawEnemyRefresh);
                (dat as attrPanelTypeEnemyRefresh).roomId =
                    enemyRefreshCom?.getDat()?.roomId.toString() ?? "";
                (dat as attrPanelTypeEnemyRefresh).param =
                    enemyRefreshCom?.getDat()?.param ?? "";
                break;
            case UnitType.SurviveDat:
                const surviveRefreshCom = this._trackNd?.getComponent(MapDrawSurvive);
                (dat as attrPanelTypeSurviveRefresh).roomId =
                    surviveRefreshCom?.getDat()?.roomId.toString() ?? "";
                (dat as attrPanelTypeSurviveRefresh).weight =
                    surviveRefreshCom?.getDat()?.weight ?? 0;
                break;
        }
        const panelDat: attrPanelType = {
            type: type,
            dat: dat,
        };
        EventManager.instance.emit(MapEditorEvent.RefreshAttrPanel, panelDat);
    }


    //属性面板刷新节点
    public refreshNdAttr(attrDat: attrPanelType) {
        if (!this._trackNd) return;
        if (!this._mapLoader) return;
        const type = attrDat.type;
        let dat;
        switch (type) {
            case UnitType.Default:
                dat = attrDat.dat as attrPanelTypeBase;
                const worldPos = MapTool.converMapPosToWorldPos(dat.pos);
                const localPos = this._trackNd.parent.convertToNodeSpaceAR(worldPos);
                this._trackNd.setPosition(localPos);
                break;
            case UnitType.Room:
                dat = attrDat.dat as attrPanelTypeRoom;
                const size = dat.size;
                this._trackNd.getComponent(MapDrawRoom).updateRoomId(Number(dat.roomId));
                this._trackNd.getComponent(MapDrawRoom).setSize(size);
                this._trackNd.getComponent(MapDrawRoom).setUnLockPoints(dat.unLockPoints || []);
                this._mapLoader.refreshLayerBoundsByNode(this._trackNd.parent);
                break;
            case UnitType.PathPoint:
                dat = attrDat.dat as attrPanelTypePoint;
                const links = dat.links as cc.Node[];
                const controller = this._trackNd.getComponent(MapDrawP);
                if (controller) {
                    controller.setId(dat.roomId);
                    controller.setLinks(links);
                }
                break;
            case UnitType.Door:
                dat = attrDat.dat as attrPanelTypeDoor;
                const doorCom = this._trackNd.getComponent(MapDrawDoor);
                if (doorCom) {
                    doorCom.setHp(dat.hp);
                }
                break;
            case UnitType.Ladder:
                //操作在l 梯子绑定模式中
                dat = attrDat.dat as attrPanelTypeLadder;
                const ladderCom = this._trackNd.getComponent(MapDrawLadder);
                if (ladderCom) {
                    ladderCom.setBinds(dat.bindPointIds);
                    ladderCom.setIsExitLadder(dat.isExitLadder);
                }
                break;
            case UnitType.Portal:
                dat = attrDat.dat as attrPanelTypePortal;
                const portalCom = this._trackNd.getComponent(MapDrawPortal);
                if (portalCom) {
                    portalCom.setLinkP(dat.linkP);
                    portalCom.setOffsetX(dat.offsetX);
                    portalCom.setAnimPs(dat.animPs);
                }
                break;
            case UnitType.Cable:
                dat = attrDat.dat as attrPanelTypeCable;
                const cableCom = this._trackNd.getComponent(MapDrawCable);
                const startP = dat.startP;
                const endP = dat.endP;
                const pointPs = dat.points;
                if (cableCom) {
                    cableCom.setSpeed(dat.speed);
                    cableCom.setStartP(startP);
                    cableCom.setEndP(endP);
                    cableCom.setPoints(pointPs);
                }
                break;
            case UnitType.EnemyRefresh:
                dat = attrDat.dat as attrPanelTypeEnemyRefresh;
                const enemyRefreshCom = this._trackNd.getComponent(MapDrawEnemyRefresh);
                if (enemyRefreshCom) {
                    enemyRefreshCom.setRoomId(Number(dat.roomId));
                    enemyRefreshCom.setParam(dat.param);
                }
                break;
            case UnitType.SurviveDat:
                dat = attrDat.dat as attrPanelTypeSurviveRefresh;
                const surviveRefreshCom = this._trackNd.getComponent(MapDrawSurvive);
                if (surviveRefreshCom) {
                    surviveRefreshCom.setRoomId(Number(dat.roomId));
                    surviveRefreshCom.setWeight(dat.weight);
                }
                break;
        }

        //如果有房间信息，更新一手
        if (type != UnitType.Room && dat.roomId) {
            const nextRoomId = Number(dat.roomId);
            if (isFinite(nextRoomId)) {
                this._mapLoader.moveUnitToRoom(this._trackNd, nextRoomId);
            }
        }
    }

    //更新区域信息
    private refreshAreaInfo(areaInfo: number[]) {
        this._mapLoader.setAreaInfo(areaInfo);
    }

}
