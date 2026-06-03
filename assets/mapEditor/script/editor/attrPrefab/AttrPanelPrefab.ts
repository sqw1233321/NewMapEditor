import { EventManager } from "../../frameWork/EventManager";
import { UnitType, AttrCfgType, AttrPanelPropertyType, AttrCfgTypeEnum } from "../../type/mapTypes";
import { AttrPanelEvent } from "../EditPanel";
import AttrItem from "./AttrItem";
import AttrPanelItemBase from "./AttrPanelItemBase";


const { ccclass, property } = cc._decorator;

//通用属性面板
@ccclass
export default class AttrPanelPrefab extends cc.Component {
    @property(cc.Node)
    attrCont: cc.Node;

    @property(cc.Prefab)
    attrItem: cc.Prefab;

    private _attrCfg: AttrCfgType;
    private _attrNodeMap: Map<string, AttrItem> = new Map();
    private _dat;
    private _type: UnitType;

    private _properties: AttrPanelPropertyType[] = [];

    //传入当前节点的属性配置，和属性现有值
    init(attrCfg: AttrCfgType, dat, isNew: boolean) {
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
        AttrPanelItemBase.curPropertyId = "";
        this.attrCont.removeAllChildren();
        this._attrNodeMap.clear();
    }

    private setUI() {
        //筛选条件属性
        this._properties = this._attrCfg.Properties;
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
            if (curController) {
                curController.node.setSiblingIndex(index);
                curController.init(property, null, 0, undefined, this.afterEditorCb, this._dat[`${property.ClassPropertyName}`]);
                return;
            }
            const attrItem = cc.instantiate(this.attrItem);
            this.attrCont.addChild(attrItem);
            const itemController = attrItem.getComponent(AttrItem);
            itemController.node.setSiblingIndex(index);
            itemController.init(property, null, 0, undefined, this.afterEditorCb, this._dat[`${property.ClassPropertyName}`]);
            this._attrNodeMap.set(property.ID, itemController);
        })
    }


    //获取数据  
    getDat() {
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
        EventManager.instance.emit(AttrPanelEvent.afterEdit, this._type);
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

}
