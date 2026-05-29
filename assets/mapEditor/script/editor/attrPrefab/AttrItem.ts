// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import MapDrawP from "../../item/MapDrawP";
import { NodeUtil } from "../../tool/NodeUtil";
import { AttrCfgPermissionsEnum, AttrCfgTypeEnum, AttrPanelPropertyType } from "../../type/mapTypes";
import AttrPanelItemBase from "./AttrPanelItemBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrItem extends AttrPanelItemBase {
    @property(cc.Node)
    hideBtn: cc.Node;

    @property(cc.Label)
    descLb: cc.Label;

    @property(cc.EditBox)
    singleLable: cc.EditBox;

    @property(cc.Toggle)
    singleBool: cc.Toggle;

    @property(cc.Node)
    singleSelectPoint: cc.Node;

    @property(cc.Node)
    editBtn: cc.Node;

    @property(cc.Node)
    addBtn: cc.Node;

    @property(cc.Node)
    deleteBtn: cc.Node;

    @property(cc.Node)
    subCont: cc.Node;

    //所有子项
    private _subItems: AttrItem[] = [];

    //名字
    private _uniqueName: string;

    //数据
    private _dat;
    //嵌套层级
    private _layer: number;

    private _isShowEditorLayer: boolean;

    private _isLastLayer: boolean;

    private _type: AttrCfgTypeEnum;

    private _permissions: AttrCfgPermissionsEnum;

    private _canWrite: boolean;

    //描述，回调，数据
    public init(cfg: AttrPanelPropertyType, layer: number, name: string, cb: any, ...params: any[]): void {
        super.init(cfg, cb, ...params);
        this._layer = layer;
        this._dat = params[0];
        this._uniqueName = name;
        this.handleDat();
        this.setUIDefault();
        this.setUI();
    }

    private handleDat() {
        //当前嵌套层数是否直接显示editor
        this._isShowEditorLayer = this._layer <= 2;
        //是否是最后一层
        this._isLastLayer = !this._cfg.Properties || this._cfg.Properties.length <= 0;
        //类型
        this._type = this._cfg.Type as AttrCfgTypeEnum;
        //权限
        this._permissions = this._cfg.PERMISSIONS as AttrCfgPermissionsEnum;
        //是否可以编辑
        this._canWrite = this._permissions != AttrCfgPermissionsEnum.readonly;
    }

    private setUIDefault() {
        cc.isValid(this.descLb.node) && (this.descLb.node.active = false);
        cc.isValid(this.singleLable.node) && (this.singleLable.node.active = false);
        cc.isValid(this.singleBool.node) && (this.singleBool.node.active = false);
        cc.isValid(this.singleSelectPoint) && (this.singleSelectPoint.active = false);
        cc.isValid(this.editBtn) && (this.editBtn.active = false);
        cc.isValid(this.addBtn) && (this.addBtn.active = false);
        cc.isValid(this.deleteBtn) && (this.deleteBtn.active = false);
        cc.isValid(this.hideBtn) && (this.hideBtn.active = false);
    }

    private setUI() {
        //子层相关
        this.hideBtn.active = !this._isLastLayer;
        this.subCont.active = !this._isLastLayer;
        //名称
        if (this._uniqueName) {
            this.descLb.node.active = true;
            this.descLb.string = this._uniqueName;
        }
        else if (this._cfg.Name) {
            this.descLb.node.active = true;
            this.descLb.string = this._cfg.Name;
        }
        //是否直接在属性面板上编辑
        if (this._isShowEditorLayer) {
            switch (this._type) {
                case AttrCfgTypeEnum.label:
                    this.singleLable.node.active = true;
                    this.singleLable.string = this._dat;
                    this.singleLable.enabled = this._canWrite;
                    break;
                case AttrCfgTypeEnum.boolean:
                    this.singleBool.node.active = true;
                    this.singleBool.isChecked = this._dat;
                    this.singleBool.enabled = this._canWrite;
                    break;
                case AttrCfgTypeEnum.point:
                    this.singleLable.node.active = true;
                    const pointNd = this._dat as cc.Node;
                    this.singleLable.string = pointNd.getComponent(MapDrawP).getId() ?? "";
                    this.singleLable.enabled = false;
                    this.singleSelectPoint.active = this._canWrite;
                    break;
            }
        }

        //最后一层并且没有直接展示ediotr，开启编辑按钮，打开弹窗编辑字段
        this.editBtn.active = !this._isShowEditorLayer && this._isLastLayer;

        //数组类型更具是否可写来搞是否可编辑数组
        if (this._type == AttrCfgTypeEnum.array || this._type == AttrCfgTypeEnum.pointArray) {
            this.addBtn.active = this._canWrite;
            this.deleteBtn.active = this._canWrite;
        }

        //选点类型打开选点按钮
        if (this._type == AttrCfgTypeEnum.pointArray) {
            this.singleSelectPoint.active = this._canWrite;
        }

        //不是最后一层，设置子项
        if (!this._isLastLayer) {
            this.setSub();
        }
    }

    //设置子项
    private setSub() {
        this._subItems = [];
        this.subCont.removeAllChildren();
        const item = cc.instantiate(this.node);
        this.subCont.addChild(item);
        item.setPosition(cc.Vec3.ZERO);
        //如果当前是对象，根据prpoerties来确定个数，更具prpoerties[index]来确定描述
        if (this._cfg.Type == AttrCfgTypeEnum.object) {
            NodeUtil.autoRefreshChildren(this.subCont, this._cfg.Properties, (nd, index, property) => {
                const attrItem = nd.getComponent(AttrItem);
                attrItem.init(property, this._layer + 1, ``, this._afterEditorCb, this._dat[property.ClassPropertyName]);
                this._subItems.push(attrItem);
            });
        }
        //如果当前是数组，根据dat来确定个数，更具prpoerties[0]来确定描述
        else if (this._cfg.Type == AttrCfgTypeEnum.array) {
            NodeUtil.autoRefreshChildren(this.subCont, this._dat, (nd, index, dat) => {
                const attrItem = nd.getComponent(AttrItem);
                attrItem.init(this._cfg.Properties[0], this._layer + 1, `${index}`, this._afterEditorCb, dat);
                this._subItems.push(attrItem);
            });
        }
        //选点数组
        else if (this._cfg.Type == AttrCfgTypeEnum.pointArray) {
            NodeUtil.autoRefreshChildren(this.subCont, this._dat, (nd, index, dat) => {
                const attrItem = nd.getComponent(AttrItem);
                const pointNd = dat as cc.Node;
                const pid = pointNd.getComponent(MapDrawP).getId() ?? "";
                attrItem.init(this._cfg.Properties[0], this._layer + 1, `${index}`, this._afterEditorCb, pid);
                this._subItems.push(attrItem);
            });
        }
    }

    //获得数据
    public getDat() {
        //值类型直接返回值（递归的退出条件）
        if (this._type == AttrCfgTypeEnum.label) {
            return this.singleLable.string;
        }
        if (this._type == AttrCfgTypeEnum.boolean) {
            return this.singleBool.isChecked;
        }
        //引用类型
        let resDat;
        //递归调用所有子项获得数据，需要根据类型来填充dat的字段
        if (this._type == AttrCfgTypeEnum.object) {
            resDat = {};
            this._subItems.filter(subItem => subItem.node.active).forEach(subItem => {
                resDat[subItem.getCfg().ClassPropertyName] = subItem.getDat();
            })
        }
        else if (this._type == AttrCfgTypeEnum.array) {
            resDat = [];
            this._subItems.filter(subItem => subItem.node.active).forEach(subItem => {
                resDat.push(subItem.getDat())
            })
        }
        else if (this._type == AttrCfgTypeEnum.pointArray) {
            return this._dat;
        }
        else if (this._type == AttrCfgTypeEnum.point) {
            resDat = this._dat;
        }
        return resDat;
    }


    //=============内部操作==============
    //获取配置
    public getCfg() {
        return this._cfg;
    }

    //设置数据
    public setDat(dat) {
        this._dat = dat;
        this.setUI();
    }



    //=============外部操作==============
    //点击三角，展示子项
    public onClickArrow() {
        //是否是最后一层
        if (this._isLastLayer) {
            return;
        }
        this.subCont.active = !this.subCont.active;
    }

    //选点模式
    public onClickSelectPoint() {
        //打开编辑界面
        if (this._type == AttrCfgTypeEnum.pointArray) {
            this.onClickP(true, this.singleSelectPoint, this._dat, (nodes: cc.Node[]) => {
                this._dat = nodes;
                this._subItems.filter(subItem => subItem.node.active).forEach((subItem, index) => {
                    const pointNd = nodes[index] as cc.Node;
                    const pid = pointNd.getComponent(MapDrawP).getId() ?? "";
                    subItem.setDat(pid);
                })
            });
        }
        else if (this._type == AttrCfgTypeEnum.point) {
            this.onClickP(false, this.singleSelectPoint, this._dat, (nodes: cc.Node[]) => {
                this._dat = nodes[0];
            });
        }
    }

    //TODO:编辑按钮
    public onClickEditBtn() {
    }




}
