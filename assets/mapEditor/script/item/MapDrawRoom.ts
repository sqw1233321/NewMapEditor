// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { RoomItemType, UnitType } from "../type/mapTypes";
import {
    MapDrawDatDoor,
    MapDrawDatEnemyRefreshData,
    MapDrawDatFightSoulData,
    MapDrawDatLadder,
    MapDrawDatRoom,
    MapDrawDatSearchItemData,
    MapDrawDatSurvivorData,
} from "./MapDrawDat";
import MapDrawDoor from "./MapDrawDoor";
import MapDrawEnemyRefresh from "./MapDrawEnemyRefresh";
import MapDrawLadder from "./MapDrawLadder";
import MapDrawP from "./MapDrawP";
import MapDrawSearchItem from "./MapDrawSearchItem";
import MapDrawUnitBase from "./MapDrawUnitBase";
import MapLoader from "./MapLoader";
import MapDrawSurvive from "./MapDrawSurvive";
import MapDrawFightSoul from "./MapDrawFightSoul";
import { attrPanelTypeRoom } from "../type/types";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawRoom extends MapDrawUnitBase {
    unLockPoints: cc.Node[] = [];
    private _pointCont: cc.Node = null;
    private _unitCont: cc.Node = null;

    private _roomDat: MapDrawDatRoom = null;
    private _color: cc.Color = null;
    private _layer: number = 0;
    private _singleName: number = null;  // 稳定唯一标识，用于新房间在非自动命名状态下的初始名字。
    private _points: MapDrawP[] = [];
    private _pointIds: string[] = [];
    private _unLockPointIds: string[] = [];
    private _roomItemDat: RoomItemType = {
        ladderDat: [],
        doorDat: [],
        enemyRefreshDat: [],
        searchItemDat: [],
        surviveDat: [],
        fightSoulDat: [],
    };
    private _searchItemDat: MapDrawDatSearchItemData[] = [];
    private _enemyRefreshDat: MapDrawDatEnemyRefreshData[] = [];
    private _ladderDat: MapDrawDatLadder[] = [];
    private _doorDat: MapDrawDatDoor[] = [];
    private _surviveDat: MapDrawDatSurvivorData[] = [];
    private _fightSoulDat: MapDrawDatFightSoulData[] = [];

    private _unlockBindHighlight = false;
    private _savedBgColor: cc.Color = null;

    //是否真正改名过（用于非自动命名状态时，是否将房间名置为uid）
    private _cfgIdManuallySet = false;

    public getType() {
        return UnitType.Room;
    }

    /** 解锁点绑定模式：高亮当前选中的房间 */
    public setUnlockBindHighlight(on: boolean) {
        if (on === this._unlockBindHighlight) return;
        const bg = this.node.getChildByName("bg");
        if (!bg) {
            this._unlockBindHighlight = on;
            return;
        }
        if (on) {
            if (this._savedBgColor == null) this._savedBgColor = bg.color.clone();
            bg.color = new cc.Color(80, 255, 160, 255);
        } else {
            if (this._savedBgColor) bg.color = this._savedBgColor;
            this._savedBgColor = null;
        }
        this._unlockBindHighlight = on;
    }

    public init(roomDat: MapDrawDatRoom, color: cc.Color) {
        this._roomDat = roomDat;
        this._roomCfgId = roomDat.cfgId;
        this._layer = roomDat.layer;
        this._color = color;
        this._pointCont = this.node.getChildByName("pointCont");
        this._unitCont = this.node.getChildByName("unitCont");
        this.initUI();
        this.setDat();
    }

    public changeLayer(newLayer: number) {
        this._layer = newLayer;
    }

    public setManulSet(isManual: boolean) {
        if (this._cfgIdManuallySet) return;
        this._cfgIdManuallySet = isManual;
    }

    public getManulSet() {
        return this._cfgIdManuallySet;
    }

    public updateRoomId(roomId: number) {
        this._roomCfgId = roomId;
        this.refreshDat();
        this.setRoomNameLb();
    }

    public setUnLockPoints(points: cc.Node[]) {
        this.unLockPoints = points;
    }

    public getUnLockPoints() {
        return this.unLockPoints;
    }

    public getPoints() {
        return this._points;
    }

    public getRoomCfgId() {
        return this._roomCfgId;
    }

    /** 获取房间唯一标识，用于非自动命名状态的初始房间名） */
    public getSingleName(): number {
        if (!this._singleName) this.generateSingleName();
        return this._singleName;
    }

    /** 生成唯一名字*/
    private generateSingleName(): number {
        if (this._singleName) return this._singleName;
        this._singleName = Date.now();
    }

    public setSize(size: { width: number; height: number }) {
        this._roomDat.size = size;
        this.node.setContentSize(size.width, size.height);
        const bg = this.node.getChildByName("bg");
        bg.setContentSize(size.width, size.height);
        const roomName = this.node.getChildByName("name");
        roomName.setPosition(cc.v2(0, this.node.getContentSize().height - 20));
    }


    private initUI() {
        this.node.name = `room_${this._roomCfgId}`;
        this.node.setContentSize(
            this._roomDat.size.width,
            this._roomDat.size.height,
        );
        const bg = this.node.getChildByName("bg");
        bg.setContentSize(this._roomDat.size.width, this._roomDat.size.height);
        bg.color = this._color;
        this.setRoomNameLb();
    }

    private setRoomNameLb() {
        this.node.name = `room_${this._roomCfgId}`;
        const roomName = this.node.getChildByName("name");
        roomName.setPosition(cc.v2(0, this.node.getContentSize().height - 20));
        const label = roomName.getComponent(cc.Label);
        const nameStr = `${this._roomCfgId}`;
        label.string = nameStr;
    }

    //设置房间内数据
    public setDat() {
        this._points = this._pointCont.children
            .filter((child: cc.Node) => child && cc.isValid(child))
            .map((child: cc.Node) =>
                child.getComponent(MapDrawP),
            ) || [];
        this._pointIds = this._points
            .map((point: MapDrawP) => point.getId()) || [];
        this._unLockPointIds = this.unLockPoints
            .filter((point: cc.Node) => point && cc.isValid(point))
            .map((point: cc.Node) =>
                point.getComponent(MapDrawP).getId()
            );
        this.setDoorDat();
        this.setLadderDat();
        this.setEnemyDat();
        this.setSearchItemDatas();
        this.setSurviveDatas();
        this.setFightSoulDatas();
    }

    private setDoorDat() {
        const allDoors = this._unitCont.getComponentsInChildren(MapDrawDoor);
        this._roomItemDat.doorDat = allDoors;
        if (allDoors.length == 0) {
            this._doorDat = [];
            return;
        }
        this._doorDat = allDoors.map((door: MapDrawDoor) => door.getDat());
    }

    private setLadderDat() {
        const allLadders = this._unitCont.getComponentsInChildren(MapDrawLadder);
        this._roomItemDat.ladderDat = allLadders;
        if (allLadders.length == 0) {
            this._ladderDat = [];
            return;
        }
        this._ladderDat = allLadders?.map((ladder: MapDrawLadder) =>
            ladder.getDat(),
        );
    }

    private setEnemyDat() {
        const allEnemies =
            this._unitCont.getComponentsInChildren(MapDrawEnemyRefresh);
        this._roomItemDat.enemyRefreshDat = allEnemies;
        if (allEnemies.length == 0) {
            this._enemyRefreshDat = [];
            return;
        }
        this._enemyRefreshDat = allEnemies.map((enemy: MapDrawEnemyRefresh) =>
            enemy.getDat(),
        );
    }

    private setSearchItemDatas() {
        const allSearchItems =
            this._unitCont.getComponentsInChildren(MapDrawSearchItem);
        this._roomItemDat.searchItemDat = allSearchItems;
        if (allSearchItems.length == 0) {
            this._searchItemDat = [];
            return;
        }
        this._searchItemDat = allSearchItems.map((searchItem: MapDrawSearchItem) =>
            searchItem.getDat(),
        );
    }

    private setSurviveDatas() {
        const allSurviveItems =
            this._unitCont.getComponentsInChildren(MapDrawSurvive);
        this._roomItemDat.surviveDat = allSurviveItems;
        if (allSurviveItems.length == 0) {
            this._surviveDat = [];
            return;
        }
        this._surviveDat = allSurviveItems.map((item: MapDrawSurvive) =>
            item.getDat(),
        );
    }

    private setFightSoulDatas() {
        const allNums = this._unitCont.getComponentsInChildren(MapDrawFightSoul);
        this._roomItemDat.fightSoulDat = allNums;
        if (allNums.length == 0) {
            this._fightSoulDat = [];
            return;
        }
        this._fightSoulDat = allNums.map((item: MapDrawFightSoul) =>
            item.getDat(),
        );
    }

    //刷新房间内数据
    public refreshDat() {
        const roomId = this._roomCfgId;
        this.node
            .getComponentsInChildren(MapDrawUnitBase)
            .forEach((unit: MapDrawUnitBase) => {
                if (unit.node == this.node) return;
                unit.updateRoomId(roomId);
            });

        if (!this._pointCont) return;
        this._points = this._pointCont.children.map((child: cc.Node) =>
            child.getComponent(MapDrawP),
        );
        this._points.forEach((point: MapDrawP) => {
            MapLoader.ins.updatePointMap(point.getId(), point.node);
        });
        this.setDat();
    }

    public getDat(): MapDrawDatRoom {
        const dat: MapDrawDatRoom = {
            cfgId: this._roomCfgId,
            layer: this._layer,
            pos: this.getPos(),
            size: this.node.getContentSize(),
            pathPointIds: this._pointIds ?? [],
            unLockType: this._roomDat.unLockType ?? 0,
            unLockPointIds: this._unLockPointIds ?? [],
            unLockNeed: this._roomDat.unLockNeed ?? [],
            outSide: this._roomDat.outSide ?? false,
            addLv: this._roomDat.addLv ?? 0,
            baseArea: this._roomDat.baseArea ?? false,
            doors: this._doorDat ?? [],
            ladders: this._ladderDat ?? [],
            enemyRefreshDatas: this._enemyRefreshDat ?? [],
            enemyCreateDatas: [],
            baseItemDatas: [],
            searchItemDatas: this._searchItemDat ?? [],
            survivorDatas: this._surviveDat ?? [],
            fightSoulDatas: this._fightSoulDat ?? [],
        };
        return dat;
    }


    //给属性面板的数据
    public getAttrDat(): attrPanelTypeRoom {
        return {
            roomId: `${this._roomCfgId}`,
            size: {
                width: this.node.getContentSize().width,
                height: this.node.getContentSize().height
            },
            unLockType: this._roomDat.unLockType ?? 0,
            unLockPoints: this.getUnLockPoints().filter((nd) => nd && cc.isValid(nd)),
            unLockNeed: this._roomDat.unLockNeed ?? [],
            outSide: this._roomDat.outSide ?? false,
            addLv: this._roomDat.addLv ?? 0,
            baseArea: this._roomDat.baseArea ?? false,
        }
    }

    public setAttrDat(dat: attrPanelTypeRoom) {
        this.setSize(dat.size);
        this.setUnLockPoints(dat.unLockPoints || []);
        this._roomDat.unLockType = dat.unLockType;
        this._roomDat.unLockNeed = dat.unLockNeed;
        this._roomDat.outSide = dat.outSide;
        this._roomDat.addLv = dat.addLv;
        this._roomDat.baseArea = dat.baseArea;
    }

}
