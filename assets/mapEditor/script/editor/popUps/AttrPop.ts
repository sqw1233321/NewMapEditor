import { AttrCfgType, AttrPanelPropertyType, AttrPopDataType, UnitType } from "../../type/mapTypes";
import AttrItem from "../attrPrefab/AttrItem";
import AttrPanelItemBase from "../attrPrefab/AttrPanelItemBase";
import DynamicGetter from "../DynamicGetter/DynamicGetter";
import ExcelConvert from "../ExcelConvert";
import PopBase from "../PopBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrPop extends PopBase {
    @property(cc.Label)
    popName: cc.Label;

    @property(cc.Node)
    attrCont: cc.Node;

    @property(cc.Prefab)
    attrItem: cc.Prefab;

    private _dat: any;
    private _typeJson: AttrCfgType;
    private _defaultValues: { className: string, value: any }[];
    private _properties: AttrPanelPropertyType[];
    private _saveCb;

    private _attrNodeMap: Map<string, AttrItem> = new Map();

    private _unitType: UnitType;

    private _excelMainKey = "";

    public showPop(dat: AttrPopDataType): void {
        super.showPop();
        this._dat = dat.dat;
        this._typeJson = dat.typeJson;
        this._defaultValues = dat.defaultValues;
        this.popName.string = dat.titleName;
        this._unitType = dat.unitType as UnitType;
        this._saveCb = dat.saveCb;
        this._excelMainKey = dat.excelMainKey ?? "";
        if (!this._dat) {
            this._dat = this.geDefaultDat(this._dat);
        }
        this._dat = ExcelConvert.addExcelStrDat(this._dat, this._excelMainKey, this._unitType);
        this.setDefault();
        this.setDefaultValue();
        this.setProperties();
        //一开始隐藏所有sub
        this.hideAllSub();
    }

    private geDefaultDat(dat: any) {
        let defaultDat = {};
        this._typeJson.Properties.forEach(property => {
            defaultDat[property.ClassPropertyName] = "";
        })
        return defaultDat;
    }

    private setDefault() {
        this.attrCont.removeAllChildren();
        this._attrNodeMap.clear();
    }

    //设置初始属性
    private setDefaultValue() {
        this._defaultValues?.forEach((valueInfo) => {
            const key = valueInfo.className;
            const value = valueInfo.value;
            this._dat[key] = value;
        })
    }

    private setProperties() {
        const eidtDat = this.convertStrToEdit(this._dat, this._unitType);
        //筛选条件属性
        this._properties = this._typeJson.Properties;
        this._properties = this.checkCondition(this._properties);

        //筛选出需要删除的属性
        const propertyIds = new Set(this._properties.map(p => p.ID));
        const idToRemove: string[] = [];
        this._attrNodeMap.forEach((controller, id) => {
            if (!propertyIds.has(id)) {
                idToRemove.push(id);
            }
        });

        //删除不满足条件的旧条目
        idToRemove.forEach(id => {
            const controller = this._attrNodeMap.get(id);
            if (controller) {
                controller.node.destroy();
            }
            this._attrNodeMap.delete(id);
        });


        //所有属性重新赋值
        this._properties.forEach((property, index) => {
            const curController = this._attrNodeMap.get(property.ID);
            const dat = eidtDat[`${property.ClassPropertyName}`] ?? property.DefaultValue;
            if (curController) {
                curController.node.setSiblingIndex(index);
                curController.init(property, null, 0, undefined, () => { this.afterEditorCb() }, dat);
                return;
            }
            const attrItem = cc.instantiate(this.attrItem);
            this.attrCont.addChild(attrItem);
            const itemController = attrItem.getComponent(AttrItem);
            itemController.node.setSiblingIndex(index);
            itemController.init(property, null, 0, undefined, () => { this.afterEditorCb() }, dat);
            this._attrNodeMap.set(property.ID, itemController);
        })
    }

    //隐藏所有sub
    private hideAllSub() {
        this._attrNodeMap.forEach((value, id) => {
            value.setShowSub(false);
        })
    }

    //获取数据  
    handleDat() {
        let dat = {};
        //先都赋值一遍
        this._attrNodeMap.forEach((value, id) => {
            //写回数据的时候也要用condition筛选一遍
            const curProperty = this._properties.find(p => p.ID === id);
            const key = curProperty?.ClassPropertyName;
            dat[key] = value.getComponent(AttrPanelItemBase).getDat();
        })
        //然后筛选掉不符合条件的东西
        this._attrNodeMap.forEach((value, id) => {
            //写回数据的时候也要用condition筛选一遍
            const curProperty = this._properties.find(p => p.ID === id);
            const canShow = this.checkConditionById(curProperty, dat);
            const key = curProperty?.ClassPropertyName;
            if (!canShow) {
                dat[key] = curProperty.DefaultValue;
            }
        })
        return dat;
    }

    //被修改的属性id
    private afterEditorCb() {
        //处理一遍数据
        this._dat = this.handleDat();
        //将编辑数据转化为str数据（ex:对象格式转化为字符串）
        this._dat = this.convertEditToStr(this._dat, this._unitType);
        this.setProperties();
    }

    //现在还是只能筛选值类型的玩意儿
    private checkCondition(properties: AttrPanelPropertyType[]): AttrPanelPropertyType[] {
        let res = [];
        //TODO:现在只能筛选第一层的东西，
        res = properties.filter(property => {
            return this.checkConditionById(property);
        })
        return res;
    }

    private checkConditionById(property: AttrPanelPropertyType, curDat?) {
        if (!property.Condition) return true;
        const dat = curDat ?? this._dat;
        const condition = property.Condition;
        const isNotEqual = condition.includes("!=");
        const splitStr = isNotEqual ? "!=" : "=";
        const conditionProperties = condition.split(splitStr);
        const targetId = conditionProperties[0];
        const needValue = conditionProperties[1];
        const targetProperty = this._properties.find(p => p.ID === targetId);
        if (!targetProperty) return false;
        const targetValue = `${dat[targetProperty.ClassPropertyName] ?? targetProperty.DefaultValue}`;
        //不管什么类型都转化为string，就能直接比较了（感觉会有问题呢）
        return isNotEqual ? needValue !== targetValue : needValue === targetValue;
    }

    //========================操作方法===================================
    //保存数据
    public onClickSave() {
        const mapDat = {};
        //筛选出地图数据
        Object.keys(this._dat).forEach((key) => {
            if (ExcelConvert.isPorperTyExcel(key, this._unitType)) return;
            mapDat[key] = this._dat[key];
        });
        //excel数据转换
        const exportExcelDta = ExcelConvert.getExportExcelDatByStrDat(this._dat, this._excelMainKey, this._unitType);
        this._saveCb?.(mapDat, exportExcelDta);
        this.hidePop();
    }


    //===================工具方法===================================

    //将str数据转化为编辑数据
    private convertStrToEdit(dat, unitType: UnitType) {
        let resDat = {};
        Object.keys(dat).forEach((key) => {
            resDat[key] = dat[key];
        });
        const attrJson = DynamicGetter.Ins.getAttrSetting();
        const typeJson = attrJson.typeArr.find((t: AttrCfgType) => t.ClassName == unitType);
        if (typeJson) {
            typeJson.Properties.forEach((p: AttrPanelPropertyType) => {
                if (!p.ExcelName) return;
                const datStr = dat[p.ClassPropertyName];
                const itemValue = ExcelConvert.parseObj(datStr, p);
                resDat[p.ClassPropertyName] = itemValue;
            });
        }
        return resDat;
    }

    //将编辑数据转化为str数据
    private convertEditToStr(dat, unitType: UnitType) {
        let resDat = {};
        Object.keys(dat).forEach((key) => {
            resDat[key] = dat[key];
        });
        const attrJson = DynamicGetter.Ins.getAttrSetting();
        const typeJson = attrJson.typeArr.find((t: AttrCfgType) => t.ClassName == unitType);
        if (typeJson) {
            typeJson.Properties.forEach((p: AttrPanelPropertyType) => {
                if (!p.ExcelName) return;
                const datValue = dat[p.ClassPropertyName] ?? "";
                const itemValue = ExcelConvert.objToString(datValue, p);
                resDat[p.ClassPropertyName] = itemValue;
            });
        }
        return resDat;
    }
}
