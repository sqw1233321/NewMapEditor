import { UnitType } from "../type/mapTypes";
import MapLoader from "./MapLoader";
import MapDrawItem from "../editor/mapDrawElement/MapDrawItem";
import MapDrawP from "./MapDrawP";
import { ReflectionMgr } from "../editor/ReflectionMgr";
import DynamicGetter from "../editor/DynamicGetter/DynamicGetter";


const { ccclass, property } = cc._decorator;

@ccclass
export default class MapDrawRoom extends MapDrawItem {
    private _pointCont: cc.Node = null;
    private _unitCont: cc.Node = null;


    //层级数据
    private _layer: number = 0;

    //是否真正改名过（用于非自动命名状态时，是否将房间名置为uid）
    private _cfgIdManuallySet = false;
    private _singleName: number = null;

    //子节点
    private _subDats: MapDrawItem[] = [];

    //模式相关
    private _unlockBindHighlight = false;
    private _savedBgColor: cc.Color = null;

    //颜色相关
    static roomColors = [
        new cc.Color(255, 80, 80),   // 红
        new cc.Color(80, 255, 80),   // 绿
        new cc.Color(80, 160, 255),  // 蓝
        new cc.Color(255, 200, 80),  // 黄
        new cc.Color(200, 80, 255),  // 紫
        new cc.Color(80, 255, 220),  // 青
    ];

    static colorIndex = 0;

    private _canNotEditKeys = [
        "doors",
        "ladders",
        "enemyRefreshDatas",
        "enemyCreateDatas",
        "baseItemDatas",
        "searchItemDatas",
        "survivorDatas",
        "fightSoulDatas"
    ];

    static getUniqueType(dat): number {
        return -1;
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

    //==============初始化相关===============
    public init(type: UnitType, uniqueType: number = -1, dat?) {
        let canEditDat = dat;
        //筛选可编辑属性
        if (dat) canEditDat = this.filterAttrDats(dat);
        super.init(type, uniqueType, canEditDat);
        this._pointCont = this.node.getChildByName("pointCont");
        this._unitCont = this.node.getChildByName("unitCont");
        this._layer = dat ? dat["layer"] : -1;
        this.initUI();
        this.setSubDats();
    }

    //筛选可编辑属性节点
    private filterAttrDats(dat) {
        const keys = Object.keys(dat);
        //不能在属性面板上编辑的属性
        const canEditKeys = keys.filter(key => !this._canNotEditKeys.includes(key));
        const resDat = {};
        canEditKeys.forEach(canEditKey => {
            resDat[canEditKey] = dat[canEditKey];
        })
        return resDat;
    }

    //==============UI操作相关===============
    //设置房间的初始ui信息
    public setDefaultUI() {
        const anchor = DynamicGetter.Ins.getItemAnchor(UnitType.Room);
        this.node.setAnchorPoint(anchor[0], anchor[1]);
        this.node.groupIndex = DynamicGetter.Ins.getGroupIndex(UnitType.Room);
        this.node.removeComponent(cc.Sprite);

        const bg = new cc.Node();
        bg.setAnchorPoint(0, 0);
        bg.name = "bg";
        this.node.addChild(bg);
        const bgSp = bg.addComponentSafe(cc.Sprite);
        const defaultSp = DynamicGetter.Ins.getDefaultSp();
        bgSp.spriteFrame = defaultSp;
        bgSp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        const color = MapDrawRoom.roomColors[(MapDrawRoom.colorIndex++) % MapDrawRoom.roomColors.length];
        bg.color = new cc.Color(color.r, color.g, color.b);
        bg.opacity = 80;

        const nameNd = new cc.Node();
        nameNd.name = "name";
        nameNd.setAnchorPoint(0, 1);
        this.node.addChild(nameNd);
        nameNd.addComponentSafe(cc.Label).fontSize = 40;

        const unitCont = new cc.Node();
        unitCont.name = "unitCont";
        this.node.addChild(unitCont);

        const pointCont = new cc.Node();
        pointCont.name = "pointCont";
        this.node.addChild(pointCont);
    }

    private initUI() {
        const size = this._canEditdat.size;
        this.setSize(size);
        this.setRoomNameLb();
    }

    public setSize(size: { width: number; height: number }) {
        if (!size) return;
        this.node.setContentSize(size.width, size.height);
        const bg = this.node.getChildByName("bg");
        bg.setContentSize(size.width, size.height);
        const roomName = this.node.getChildByName("name");
        roomName.setPosition(cc.v2(0, this.node.getContentSize().height - 20));
    }

    private setRoomNameLb() {
        this.node.name = `room_${this._canEditdat["cfgId"]}`;
        const roomName = this.node.getChildByName("name");
        roomName.setPosition(cc.v2(0, this.node.getContentSize().height - 20));
        const label = roomName.getComponent(cc.Label);
        const nameStr = `${this._canEditdat["cfgId"]}`;
        label.string = nameStr;
    }


    //==============属性操作相关===============
    public changeLayer(newLayer: number) {
        this._layer = newLayer;
    }

    public updateRoomId(roomId: number) {
        this._canEditdat["cfgId"] = roomId;
        this.refreshDat();
        this.setRoomNameLb();
    }

    public setManulSet(isManual: boolean) {
        if (this._cfgIdManuallySet) return;
        this._cfgIdManuallySet = isManual;
    }

    public getManulSet() {
        return this._cfgIdManuallySet;
    }

    public getRoomCfgId() {
        return this._canEditdat["cfgId"];
    }

    public getUnlockP() {

        return this._canEditdat.unLockPointIds;
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

    private setSubDats() {
        this._subDats = [];
        const allSubUnits = this._unitCont.getComponentsInChildren(MapDrawItem);
        allSubUnits?.forEach((units: MapDrawItem) => {
            this._subDats.push(units);
        });
    }

    //刷新房间内数据
    public refreshDat() {
        this.setSubDats();
        const roomId = this._canEditdat["cfgId"];
        this._subDats.forEach((subDat: MapDrawItem) => {
            subDat.updateRoomId(roomId);
        });
        if (!this._pointCont) return;
        const points = this._pointCont.children.map((child: cc.Node) =>
            child.getComponent(MapDrawItem),
        );
        points.forEach((point: MapDrawItem) => {
            point.updateRoomId(roomId);
            MapLoader.ins.updatePointMap(point.getAttrDat()["id"], point.node);
        });
    }

    public getPoints() {
        return this._pointCont.children.map((child: cc.Node) =>
            child.getComponent(MapDrawP),
        );
    }

    //============获取数据拓展===============
    public getExportDat() {
        const dat = super.getExportDat();
        this._subDats.forEach((subDat: MapDrawItem) => {
            const classType = subDat.getExportName();
            if (!dat[`${classType}`]) {
                dat[`${classType}`] = [];
            }
            dat[`${classType}`].push(subDat.getExportDat());
        });
        //不可手动编辑得特殊属性
        dat["layer"] = this._layer;
        dat["pathPointIds"] = this._pointCont?.children?.map((child: cc.Node) =>
            child?.getComponent(MapDrawP)?.getId(),
        ) ?? [];
        //查漏补缺
        this._canNotEditKeys.forEach((key) => {
            if (!dat[key]) {
                dat[key] = [];
            }
        });
        //排序
        const orderedFields: any = {};
        this._canNotEditKeys.forEach((key) => {
            orderedFields[key] = dat[key] || [];
        });
        const otherFields: any = {};
        Object.keys(dat).forEach((key) => {
            if (!this._canNotEditKeys.includes(key)) {
                otherFields[key] = dat[key];
            }
        });
        return { ...otherFields, ...orderedFields };
    }

    public setAttrDat(dat) {
        super.setAttrDat(dat);
        this.setSize(dat.size);
    }

}

ReflectionMgr.registerClass('MapDrawRoom', MapDrawRoom);
