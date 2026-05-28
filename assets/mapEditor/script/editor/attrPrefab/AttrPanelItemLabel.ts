import MapDrawP from "../../item/MapDrawP";
import MapLoader from "../../item/MapLoader";
import { NodeUtil } from "../../tool/NodeUtil";
import { AttrCfgPermissionsEnum, AttrCfgTypeEnum, AttrPanelPropertyType } from "../../type/mapTypes";
import AttrPanelItemBase from "./AttrPanelItemBase";


const { ccclass, property } = cc._decorator;

//通用属性面板item,编辑label
@ccclass
export default class AttrPanelItemLabel extends AttrPanelItemBase {
    @property(cc.Node)
    singleEditorNd: cc.Node;

    @property(cc.Node)
    attrCont: cc.Node;

    private _dat;

    public init(cfg: AttrPanelPropertyType, cb: any, dat): void {
        super.init(cfg, cb);
        this._dat = dat;
        this.setUI();
    }

    private setUI() {
        this.descLb.string = this._cfg.Name;
        const properties = this._cfg.Properties;
        const hasMulti = !!properties;
        this.singleEditorNd.active = !hasMulti;
        this.attrCont.active = hasMulti;

        //是否以数组取值
        const isArray = this._cfg.IsArray;
        //以对象方式读取
        if (!isArray) {
            //子属性赋值
            if (hasMulti) {
                NodeUtil.autoRefreshChildren(this.attrCont, properties, (nd, index, property) => {
                    const permissions = property.PERMISSIONS;
                    const descLb = nd.children[0].getComponent(cc.Label);
                    descLb.string = property.Name;
                    const editController = nd.children[1].getComponent(cc.EditBox);
                    editController.string = this._dat[`${property.ClassPropertyName}`] ?? property.DefaultValue;
                    //权限问题
                    editController.enabled = permissions !== AttrCfgPermissionsEnum.readonly;
                    const addBtn = nd.children[2];
                    const deleteBtn = nd.children[3];
                    addBtn.active = false;
                    deleteBtn.active = false;
                })
            }
            else {
                this.singleEditorNd.getComponent(cc.EditBox).string = this._dat;
            }
        }
        //以数组方式读取
        else {
            //子属性赋值
            if (hasMulti) {
                const property = properties[0];
                const permissions = property.PERMISSIONS;
                const canWrite = permissions !== AttrCfgPermissionsEnum.readonly;
                NodeUtil.autoRefreshChildren(this.attrCont, this._dat, (nd, index, dat) => {
                    const descLb = nd.children[0].getComponent(cc.Label);
                    descLb.string = property.Name;
                    const editController = nd.children[1].getComponent(cc.EditBox);
                    const attrType = property.Type;
                    //取值的类型
                    switch (attrType) {
                        case AttrCfgTypeEnum.label:
                            editController.string = dat as string;
                            break;
                        case AttrCfgTypeEnum.point:
                            editController.string = (dat as cc.Node).getComponent(MapDrawP).getId() ?? "";
                            break;
                    }
                    //权限问题
                    editController.enabled = canWrite;
                    const addBtn = nd.children[2];
                    const deleteBtn = nd.children[3];
                    addBtn.active = canWrite;
                    deleteBtn.active = canWrite;
                    if (canWrite) {
                        addBtn.targetOff(this);
                        deleteBtn.targetOff(this);
                        addBtn.on(cc.Node.EventType.TOUCH_END, () => {
                            this.onClickAddBtn(index);
                        }, this);
                        deleteBtn.on(cc.Node.EventType.TOUCH_END, () => {
                            this.onClickDeleteBtn(index);
                        }, this);
                    }
                })
            }
            else {
                this.singleEditorNd.getComponent(cc.EditBox).string = this._dat;
            }
        }
    }

    public getDat() {
        //是否以数组取值
        const isArray = this._cfg.IsArray;
        const properties = this._cfg.Properties;
        const hasMulti = !!properties;
        if (isArray) {
            if (hasMulti) {
                const property = properties[0];
                const dat: any = [];
                this.attrCont.children.forEach((child, index) => {
                    if (!child.active) return;
                    const editBox = child.children[1].getComponent(cc.EditBox);
                    //取值的类型
                    const str = editBox.string;
                    const attrType = property.Type;
                    let result: any;
                    switch (attrType) {
                        case AttrCfgTypeEnum.label:
                            result = str as string;
                            break;
                        case AttrCfgTypeEnum.point:
                            result = MapLoader.ins.getPathPointById(str);
                            break;
                    }
                    dat[index] = result;
                })
                return dat;
            }
            else {
                //取值的类型
                const str = this.singleEditorNd.getComponent(cc.EditBox).string;
                const attrType = this._cfg.Type;
                let result: any;
                switch (attrType) {
                    case AttrCfgTypeEnum.label:
                        result = str as string;
                        break;
                    case AttrCfgTypeEnum.point:
                        result = MapLoader.ins.getPathPointById(str);
                        break;
                }
                return result;
            }
        }
        else {
            if (hasMulti) {
                const dat: any = {};
                this.attrCont.children.forEach((child, index) => {
                    if (!child.active) return;
                    const editBox = child.children[1].getComponent(cc.EditBox);
                    const property = properties[index];
                    dat[property.ClassPropertyName] = editBox.string;
                })
                return dat;
            }
            else {
                const str = this.singleEditorNd.getComponent(cc.EditBox).string;
                return str;
            }
        }
    }


    //===========增，删操作==============
    //添加按钮
    private onClickAddBtn(index: number) {
        const property = this._cfg.Properties[0];
        //在数组中插入新元素
        const newItem = property.DefaultValue ?? "";
        this._dat.splice(index + 1, 0, newItem);
        this.setUI();
        this.onAfterEdit();
    }

    //删除按钮
    private onClickDeleteBtn(index: number) {
        //从数组中移除
        this._dat.splice(index, 1);
        this.setUI();
        this.onAfterEdit();
    }

}
