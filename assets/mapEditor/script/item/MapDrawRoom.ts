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
    MapDrawDatLadder,
    MapDrawDatRoom,
    MapDrawDatSearchItemData,
} from "./MapDrawDat";
import MapDrawDoor from "./MapDrawDoor";
import MapDrawEnemyRefresh from "./MapDrawEnemyRefresh";
import MapDrawLadder from "./MapDrawLadder";
import MapDrawP from "./MapDrawP";
import MapDrawSearchItem from "./MapDrawSearchItem";
import MapDrawUnitBase from "./MapDrawUnitBase";
import MapLoader from "./MapLoader";
import EditorSetting from "../editor/EditorSetting";
import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawRoom extends MapDrawUnitBase {
    @property([cc.Node])
    unLockPoints: cc.Node[] = [];

    private _pointCont: cc.Node = null;
    private _unitCont: cc.Node = null;

    private _roomDat: MapDrawDatRoom = null;
    private _color: cc.Color = null;

    private _layer: number = 0;
    private _points: MapDrawP[] = [];
    private _pointIds: string[] = [];
    private _unLockPointIds: string[] = [];
    private _roomItemDat: RoomItemType = {
        ladderDat: [],
        doorDat: [],
        enemyRefreshDat: [],
        searchItemDat: [],
    };
    private _searchItemDat: MapDrawDatSearchItemData[] = [];
    private _enemyRefreshDat: MapDrawDatEnemyRefreshData[] = [];
    private _ladderDat: MapDrawDatLadder[] = [];
    private _doorDat: MapDrawDatDoor[] = [];

    private _unlockBindHighlight = false;
    private _savedBgColor: cc.Color = null;

    public getType() {
        return UnitType.Room;
    }

    protected onUnitLeftMouseDownForLink(_event: cc.Event.EventMouse): boolean {
        if (EditorSetting.Instance.isRoomUnlockBindMode()) {
            EventManager.instance.emit(MapEditorEvent.RoomUnlockBindRoomClick, this.node);
            return true;
        }
        return false;
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
        this._roomId = roomDat.cfgId;
        this._layer = roomDat.layer;
        this._color = color;
        this._pointCont = this.node.getChildByName("pointCont");
        this._unitCont = this.node.getChildByName("unitCont");
        this.initUI();
        this.setDat();
    }

    public changeLayer(roomId: number, newLayer: number) {
        this._roomId = roomId;
        this._layer = newLayer;
        this.initUI();
    }

    private initUI() {
        this.node.name = `room_${this._roomId}`;
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
        const roomName = this.node.getChildByName("name");
        roomName.setPosition(cc.v2(0, this.node.getContentSize().height - 20));
        const label = roomName.getComponent(cc.Label);
        label.string = `${this._roomId}`;
    }

    public setDat() {
        this._points = this._pointCont.children.map((child: cc.Node) =>
            child.getComponent(MapDrawP),
        );
        this._pointIds =
            this._points?.map((point: MapDrawP) => point.getId()) || [];
        this._unLockPointIds = this.unLockPoints.map((point: cc.Node) =>
            point.getComponent(MapDrawP).getId(),
        );
        this.setDoorDat();
        this.setLadderDat();
        this.setEnemyDat();
        this.setSearchItemDatas();
    }

    private setDoorDat() {
        const allDoors = this._unitCont.getComponentsInChildren(MapDrawDoor);
        this._roomItemDat.doorDat = allDoors;
        if (allDoors.length == 0) return;
        this._doorDat = allDoors.map((door: MapDrawDoor) => door.getDat());
    }

    private setLadderDat() {
        const allLadders = this._unitCont.getComponentsInChildren(MapDrawLadder);
        this._roomItemDat.ladderDat = allLadders;
        if (allLadders.length == 0) return;
        this._ladderDat = allLadders?.map((ladder: MapDrawLadder) =>
            ladder.getDat(),
        );
    }

    private setEnemyDat() {
        const allEnemies =
            this._unitCont.getComponentsInChildren(MapDrawEnemyRefresh);
        this._roomItemDat.enemyRefreshDat = allEnemies;
        if (allEnemies.length == 0) return;
        this._enemyRefreshDat = allEnemies.map((enemy: MapDrawEnemyRefresh) =>
            enemy.getDat(),
        );
    }

    private setSearchItemDatas() {
        const allSearchItems =
            this._unitCont.getComponentsInChildren(MapDrawSearchItem);
        this._roomItemDat.searchItemDat = allSearchItems;
        if (allSearchItems.length == 0) return;
        this._searchItemDat = allSearchItems.map((searchItem: MapDrawSearchItem) =>
            searchItem.getDat(),
        );
    }

    public getPoints() {
        return this._points;
    }

    public getId() {
        return this._roomId;
    }

    public setSize(size: { width: number; height: number }) {
        this.node.setContentSize(size.width, size.height);
        const bg = this.node.getChildByName("bg");
        bg.setContentSize(size.width, size.height);
        const roomName = this.node.getChildByName("name");
        roomName.setPosition(cc.v2(0, this.node.getContentSize().height - 20));
    }

    public refreshDat() {
        this.node
            .getComponentsInChildren(MapDrawUnitBase)
            .forEach((unit: MapDrawUnitBase) => {
                if (unit.node == this.node) return;
                unit.updateRoomId(this._roomId);
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
            cfgId: this._roomId,
            layer: this._layer,
            pos: this.getPos(),
            size: this.node.getContentSize(),
            pathPointIds: this._pointIds ?? [],
            unlockPointIds: this._unLockPointIds ?? [],
            doors: this._doorDat ?? [],
            ladders: this._ladderDat ?? [],
            enemyRefreshDatas: this._enemyRefreshDat ?? [],
            enemyCreateDatas: [],
            baseItemDatas: [],
            searchItemDatas: this._searchItemDat ?? [],
            survivorDatas: [],
        };
        return dat;
    }

    public updateRoomId(roomId: number) {
        this._roomId = roomId;
        this.refreshDat();
        this.setRoomNameLb();
    }

    public setUnLockPoints(points: cc.Node[]) {
        this.unLockPoints = points;
    }

    public getUnLockPoints() {
        return this.unLockPoints;
    }

    //操作
}
