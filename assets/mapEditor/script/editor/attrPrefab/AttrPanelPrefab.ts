import { EventManager } from "../../frameWork/EventManager";
import { AttrCfgTypeEnum, UnitType, AttrCfgType, AttrPanelPropertyType, AttrCfgPropertiesType } from "../../type/mapTypes";
import { attrPanelTypeDatType } from "../../type/types";
import { AttrPanelEvent } from "../EditPanel";
import AttrPanelItemBase from "./AttrPanelItemBase";
import AttrPanelItemBoolean from "./AttrPanelItemBoolean";
import AttrPanelItemLabel from "./AttrPanelItemLabel";
import AttrPanelItemPoint from "./AttrPanelItemPoint";
import AttrPanelItemPointArray from "./AttrPanelItemPointArray";

const { ccclass, property } = cc._decorator;

//通用属性面板
@ccclass
export default class AttrPanelPrefab extends cc.Component {
    @property(cc.Node)
    attrCont: cc.Node;

    @property(cc.Prefab)
    labelPrefab: cc.Prefab;

    @property(cc.Prefab)
    pointSinglePrefab: cc.Prefab;

    @property(cc.Prefab)
    pointMultiPrefab: cc.Prefab;

    @property(cc.Prefab)
    booleanPrefab: cc.Prefab;

    @property(cc.Prefab)
    openPopPrefab: cc.Prefab;

    private _attrCfg: AttrCfgType;
    private _attrNodeMap: Map<string, AttrPanelItemBase> = new Map();
    private _dat: attrPanelTypeDatType;
    private _type: UnitType;

    //传入当前节点的属性配置，和属性现有值
    init(attrCfg: AttrCfgType, dat: attrPanelTypeDatType, isNew: boolean) {
        this._attrCfg = attrCfg;
        this._dat = dat;
        this._type = attrCfg.ClassName as UnitType;
        //是否切换了新节点
        if (isNew) {
            this.setDefault();
        }
        this.setUI();
    }

    private setDefault() {
        this.attrCont.removeAllChildren();
        this._attrNodeMap.clear();
    }


    private setUI() {
        //筛选条件属性
        let properties = this._attrCfg.Properties;
        properties = this.checkCondition(properties);

        //主要注意维护  this._attrNodeMap

        //筛选出需要删除的属性
        const propertyKeys = new Set(properties.map(p => p.ClassPropertyName));
        const keysToRemove: string[] = [];
        this._attrNodeMap.forEach((controller, key) => {
            if (!propertyKeys.has(key)) {
                keysToRemove.push(key);
            }
        });

        //删除不满足条件的旧条目
        keysToRemove.forEach(key => {
            const controller = this._attrNodeMap.get(key);
            if (controller) {
                controller.node.destroy();
            }
            this._attrNodeMap.delete(key);
        });

        //所有属性重新赋值
        properties.forEach((property, index) => {
            const type = property.Type;
            const curController = this._attrNodeMap.get(property.ClassPropertyName);
            if (curController) {
                curController.node.setSiblingIndex(index)
                curController.init(property, this.afterEditorCb, this._dat[`${property.ClassPropertyName}`]);
                return;
            }
            const attrItem = this.getItemPrefab(type);
            this.attrCont.addChild(attrItem);
            const itemController = attrItem.getComponent(AttrPanelItemBase);
            itemController.node.setSiblingIndex(index);
            itemController.init(property, this.afterEditorCb, this._dat[`${property.ClassPropertyName}`]);
            this._attrNodeMap.set(property.ClassPropertyName, itemController);
        })
    }


    //获取数据  
    getDat() {
        let dat = {};
        this._attrNodeMap.forEach((value, key) => {
            dat[key] = value.getComponent(AttrPanelItemBase).getDat();
        })
        return dat;
    }

    private afterEditorCb() {
        EventManager.instance.emit(AttrPanelEvent.afterEdit, this._type);
    }


    //现在还是只能筛选值类型的玩意儿
    private checkCondition(properties: AttrPanelPropertyType[]): AttrPanelPropertyType[] {
        let res = [];
        //筛选一遍
        res = properties.filter(property => {
            if (!property.Condition) return true;
            const condition = property.Condition;
            const isNotEqual = condition.includes("!=");
            const splitStr = isNotEqual ? "!=" : "=";
            const conditionProperties = condition.split(splitStr);
            const targetId = Number(conditionProperties[0]);
            const needValue = conditionProperties[1];
            const targetProperty = properties.find(p => p.ID === targetId);
            const targetValue = this._dat[targetProperty.ClassPropertyName];
            return isNotEqual ? needValue != targetValue : needValue == targetValue;
        })
        return res;
    }


    //===============公共方法===============
    private getItemPrefab(type: AttrCfgTypeEnum): cc.Node {
        let prefab = null;
        switch (type) {
            case AttrCfgTypeEnum.label:
                prefab = this.labelPrefab;
                break;
            case AttrCfgTypeEnum.point:
                prefab = this.pointSinglePrefab;
                break;
            case AttrCfgTypeEnum.pointArray:
                prefab = this.pointMultiPrefab;
                break;
            case AttrCfgTypeEnum.boolean:
                prefab = this.booleanPrefab;
                break;
            case AttrCfgTypeEnum.openPop:
                prefab = this.openPopPrefab;
                break;
        }
        if (!prefab) {
            console.log("传入了不知名类型 !!!", type);
        }
        return cc.instantiate(prefab);
    }
}
