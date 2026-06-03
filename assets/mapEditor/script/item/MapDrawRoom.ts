import { AttrCfgType, AttrCfgTypeEnum, AttrPanelPropertyType, UnitType } from "../type/mapTypes";
import MapLoader from "./MapLoader";
import MapDrawItem from "../editor/mapDrawElement/MapDrawItem";
import MapDrawP from "./MapDrawP";
import { ReflectionMgr } from "../editor/ReflectionMgr";
import DynamicGetter from "../editor/DynamicGetter/DynamicGetter";
import EditorSetting from "../editor/EditorSetting";


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
        this.handleExcelDat(dat);
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

    public setAttrDat(dat) {
        super.setAttrDat(dat);
        this.setSize(dat.size);
    }


    //============获取数据拓展===============
    public getExportDat() {
        const exportDat = super.getExportDat();
        let dat = {};
        //筛选出在地图josn中的数据
        Object.keys(exportDat).forEach((key) => {
            if (this.isPorperTyExcel(key)) return;
            dat[key] = exportDat[key];
        });
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


    //=============处理外部配置表相关===================
    //读取相关
    private handleExcelDat(editDat) {
        const attrJson = DynamicGetter.Ins.getAttrSetting();
        const typeJson = attrJson.typeArr.find((t: AttrCfgType) => t.ClassName == UnitType.Room);
        if (typeJson) {
            typeJson.Properties.forEach((p: AttrPanelPropertyType) => {
                if (!p.ExcelName) return;
                const excelName = p.ExcelName;
                const excelDat = DynamicGetter.Ins.getExcelJson(excelName);
                if (!excelDat) return;
                const mainKey = this.getMainKey(excelName, editDat);
                this.setExcelDat(editDat, excelDat, mainKey, p);
            });
        }
    }

    private setExcelDat(editDat, excelDat, key, p: AttrPanelPropertyType) {
        const dat = excelDat[`${key}`];
        if (!dat) return;
        const propertyDat = dat[`${p.ClassPropertyName}`];
        if (propertyDat == null) return;
        const isArr = p.Type == AttrCfgTypeEnum.array || p.Type == AttrCfgTypeEnum.object;
        //值类型
        if (!isArr) {
            editDat[p.ClassPropertyName] = propertyDat;
            return;
        }
        // 引用类型进行正则匹配
        editDat[p.ClassPropertyName] = this.parseObj(propertyDat, p);
    }

    private parseObj(excelStr: string, p: AttrPanelPropertyType): any {
        const isArr = p.Type == AttrCfgTypeEnum.array || p.Type == AttrCfgTypeEnum.object;
        if (!isArr) {
            if (p.Type == AttrCfgTypeEnum.number) return Number(excelStr);
            if (p.Type == AttrCfgTypeEnum.string) return excelStr;
            if (p.Type == AttrCfgTypeEnum.boolean) return excelStr == "true";
        }
        const regex = p.Regex;
        if (!regex) return;
        let res;
        if (p.Type == AttrCfgTypeEnum.array) {
            res = []
            const datArr = excelStr.match(new RegExp(regex, "g"));
            datArr.forEach((dat) => {
                res.push(this.parseObj(dat, p.Properties[0]));
            })
        }
        if (p.Type == AttrCfgTypeEnum.object) {
            res = {}
            const datArr = excelStr.match(new RegExp(regex, "g"));
            datArr.forEach((dat, index) => {
                res[p.Properties[index].ClassPropertyName] = this.parseObj(dat, p.Properties[index]);
            })
        }
        return res;
    }

    //写入相关
    public getExportExcelDat(): { excelName: string, id: number, itemName: string, itemValue: any }[] {
        const exportDat = super.getExportDat();
        let dat = {}
        //筛选出在excel中的数据
        Object.keys(dat).forEach((key) => {
            if (!this.isPorperTyExcel(key)) return;
            dat[key] = exportDat[key];
        });
        const resDat: { excelName: string, id: number, itemName: string, itemValue: any }[] = [];
        Object.keys(dat).forEach((key) => {
            const properTy = DynamicGetter.Ins.getAttrSetting().typeArr.find((t: AttrCfgType) => t.ClassName == UnitType.Room).Properties.find((p: AttrPanelPropertyType) => p.ClassPropertyName == key);
            if (!properTy) return;
            const isArr = properTy.Type == AttrCfgTypeEnum.array || properTy.Type == AttrCfgTypeEnum.object;
            if (!isArr) {
                resDat.push({
                    excelName: properTy.ExcelName,
                    id: this.getMainKey(properTy.ExcelName, this._canEditdat),
                    itemName: key,
                    itemValue: dat[key]
                });
            }
            const itemValue = this.objToString(dat[key], properTy, dat[key]);
            resDat.push({
                excelName: properTy.ExcelName,
                id: this.getMainKey(properTy.ExcelName, this._canEditdat),
                itemName: key,
                itemValue: itemValue
            });

        });
        return resDat;
    }

    private getSeparatorFromOriginal(originalStr: string, regex: string): string {
        const matches = originalStr.match(new RegExp(regex, "g"));
        if (!matches || matches.length <= 1) return "";
        const firstMatch = matches[0];
        const lastMatch = matches[matches.length - 1];
        const lastIndex = originalStr.lastIndexOf(lastMatch);
        const between = originalStr.substring(originalStr.indexOf(firstMatch) + firstMatch.length, lastIndex);
        return between.substring(0, between.indexOf(matches[1]));
    }
    private objToString(data: any, p: AttrPanelPropertyType, originalStr: string = ""): any {
        const isArr = p.Type == AttrCfgTypeEnum.array || p.Type == AttrCfgTypeEnum.object;
        // 值类型直接返回
        if (!isArr) {
            return String(data);
        }
        if (p.Type == AttrCfgTypeEnum.array) {
            const subP = p.Properties[0];
            const parts = (data as any[]).map(item => this.objToString(item, subP, originalStr));
            const separator = this.getSeparatorFromOriginal(originalStr, p.Regex);
            return parts.join(separator);
        }
        if (p.Type == AttrCfgTypeEnum.object) {
            const parts: string[] = [];
            p.Properties.forEach((prop: AttrPanelPropertyType) => {
                parts.push(this.objToString(data[prop.ClassPropertyName], prop, originalStr));
            });
            return parts.join("");
        }
    }

    //当前属性名是否是excel数据
    private isPorperTyExcel(propertyClassName: string) {
        const attrJson = DynamicGetter.Ins.getAttrSetting();
        const typeJson = attrJson.typeArr.find((t: AttrCfgType) => t.ClassName == UnitType.Room);
        if (!typeJson) return false;
        const propertise = typeJson.Properties as AttrPanelPropertyType[];
        return propertise.some((p: AttrPanelPropertyType) => p.ClassPropertyName == propertyClassName && p.ExcelName);
    }

    //以房间还是地图id为主键
    private getMainKey(excelName: string, editDat) {
        const stageId = EditorSetting.Instance.getStageId();
        const roomId = editDat["cfgId"];
        //以地图id为key的表
        const stageKey = ["LevelBaseConfig"];
        //以房间id为key的表
        const roomKey = ["AreaBase", "AreaMonster"];
        //地图的表
        let mainKey = -1;
        if (stageKey.includes(excelName)) {
            mainKey = stageId;
        }
        //房间的表
        if (roomKey.includes(excelName)) {
            mainKey = roomId;
        }
        return mainKey;
    }

}

ReflectionMgr.registerClass('MapDrawRoom', MapDrawRoom);
