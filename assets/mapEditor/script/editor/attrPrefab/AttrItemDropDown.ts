import { NodeUtil } from "../../tool/NodeUtil";
import { AttrCfgDropDownType, AttrCfgTypeEnum, AttrPanelPropertyType } from "../../type/mapTypes";
import DynamicGetter from "../DynamicGetter/DynamicGetter";
import AttrItemDropDownItem from "./AttrItemDropDownItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrItemDropDown extends cc.Component {

    @property(cc.Node)
    itemCont: cc.Node;

    private _setting: AttrCfgDropDownType[];

    private _selectIndex = 0;
    private _type: AttrCfgTypeEnum;
    private _selectCb;

    protected onEnable(): void {
        this.refreshSelect(this._selectIndex);
    }

    public init(propertiesCfg: AttrPanelPropertyType, curValue, selectCb) {
        this._setting = DynamicGetter.Ins.getDropSettingByName(propertiesCfg.ClassPropertyName)
        this._type = propertiesCfg.Type;
        if (this._type == AttrCfgTypeEnum.dropDownNumber) {
            curValue = Number(curValue);
        } else if (this._type == AttrCfgTypeEnum.dropDownString) {
            curValue = String(curValue);
        }
        else {
            return;
        }
        //根据当前数据算出一个当前的selectIndex
        const item = DynamicGetter.Ins.getDropSettingIntemByValue(this._setting, curValue)
        if (item) {
            this._selectIndex = this._setting.findIndex(t => t.exportValue == item.exportValue);
        }
        this.setItem();
        this.refreshSelect(this._selectIndex);
        this._selectCb = selectCb;
    }

    public setItem() {
        NodeUtil.autoRefreshChildren(this.itemCont, this._setting, (child, index, dat) => {
            child.getComponent(AttrItemDropDownItem).setDat(dat, index, (curIndex) => {
                this.refreshSelect(curIndex);
            });
        })
    }

    //刷新选择
    private refreshSelect(curIndex: number) {
        this._selectIndex = curIndex;
        this.itemCont.children.forEach((child, index) => {
            child.getComponent(AttrItemDropDownItem).setSelect(curIndex);
        })
        this._selectCb?.(this.getDat());
    }

    public getDat(): AttrCfgDropDownType {
        //通过当前索引获取数据
        return this.itemCont.children[this._selectIndex]?.getComponent(AttrItemDropDownItem)?.getDat() ?? null;
    }
}
