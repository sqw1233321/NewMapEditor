import { NodeUtil } from "../../tool/NodeUtil";
import { AttrCfgPermissionsEnum, AttrCfgTypeEnum, AttrPanelPropertyType } from "../../type/mapTypes";
import AttrPanelItemBase from "./AttrPanelItemBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttrItem extends AttrPanelItemBase {
    @property(cc.Node)
    hideBtn: cc.Node;

    @property(cc.Node)
    arrowBg: cc.Node;

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

    //是否展示子节点（一开始别赋值啊，有大作用，判断object的arrow显示的时候）
    private _isShowSub: boolean;

    //描述，父cfg，递归层级，特殊名称（数组index），回调，数据
    public init(cfg: AttrPanelPropertyType, parentItem: AttrItem, layer: number, index: number, cb: any, ...params: any[]): void {
        super.initBase(cfg, parentItem?.getId() ?? "", index, parentItem, cb, ...params);
        this._layer = layer;
        this._dat = params[0] ?? NodeUtil.deepClone(this._cfg.DefaultValue);
        this._uniqueName = index == undefined ? `` : `${index}`;
        this.handleDat();
        this.setUIDefault();
        this.setUI();
        //如果有当前正在编辑的属性
        if (AttrPanelItemBase.curPropertyId) {
            // console.log("当前正在编辑的属性id   ", AttrPanelItemBase.curPropertyId);
            if (this.isParentOrSelf(this.getId(), AttrPanelItemBase.curPropertyId)) {
                this.setShowSub(true);
            }
        }
    }

    // 判断 currentId 是否是 targetId 的祖先或自身
    private isParentOrSelf(currentId: string, targetId: string): boolean {
        const currentSegs = currentId.split('-');
        const targetSegs = targetId.split('-');

        // 自身
        if (currentId === targetId) return true;

        // current 必须比 target 短（或等长但相等已在上面处理）
        if (currentSegs.length > targetSegs.length) return false;

        // 按层级逐段比较
        for (let i = 0; i < currentSegs.length; i++) {
            const curSeg = currentSegs[i];
            const tgtSeg = targetSegs[i];

            // 提取属性名（去掉 &{n}）
            const curProp = curSeg.replace(/&\{\d+\}/, '');
            const tgtProp = tgtSeg.replace(/&\{\d+\}/, '');

            // 属性名必须相同
            if (curProp !== tgtProp) return false;

            // 如果当前段有数组索引，索引必须相同
            const curIndexMatch = curSeg.match(/&\{(\d+)\}/);
            const tgtIndexMatch = tgtSeg.match(/&\{(\d+)\}/);
            if (curIndexMatch && tgtIndexMatch) {
                if (curIndexMatch[1] !== tgtIndexMatch[1]) return false;
            }
            if (!curIndexMatch && tgtIndexMatch) return false;
            if (curIndexMatch && !tgtIndexMatch) return false;
        }

        return true;
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
        //最后一层不显示sub
        if (this._isLastLayer) {
            this.hideBtn.active = false;
            this._isShowSub = false;
            this.subCont.active = false;
            this.arrowBg.angle = 90;
        }
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
                case AttrCfgTypeEnum.number:
                case AttrCfgTypeEnum.string:
                    this.singleLable.node.active = true;
                    this.singleLable.enabled = this._canWrite;
                    //不理解这里为啥enabled为false之后有些它的子节点被隐藏了
                    if (!this._canWrite) this.singleLable.node.children[1].active = true;
                    this.singleLable.string = this._dat;
                    break;
                case AttrCfgTypeEnum.boolean:
                    this.singleBool.node.active = true;
                    this.singleBool.isChecked = this._dat;
                    this.singleBool.enabled = this._canWrite;
                    break;
                case AttrCfgTypeEnum.point:
                    this.singleLable.node.active = true;
                    this.singleLable.enabled = false;
                    this.singleLable.node.children[1].active = true;
                    this.singleLable.string = this._dat;
                    this.singleSelectPoint.active = this._canWrite;
                    break;
            }
        }

        //最后一层并且没有直接展示ediotr，开启编辑按钮，打开弹窗编辑字段
        this.editBtn.active = !this._isShowEditorLayer && this._isLastLayer;

        //数组类型，开启数据编辑按钮
        if (this._type == AttrCfgTypeEnum.array) {
            this.addBtn.active = this._canWrite;
            this.deleteBtn.active = this._canWrite;
        }

        //父节点是数组，自己能否进行数组操作由父节点的权限决定
        if (this._parentCfg && this._parentCfg.Type == AttrCfgTypeEnum.array) {
            const pareantCanWrite = this._parentCfg.PERMISSIONS != AttrCfgPermissionsEnum.readonly;
            this.addBtn.active = pareantCanWrite;
            this.deleteBtn.active = pareantCanWrite;
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
        // this.subCont.removeAllChildren();
        //如果当前是对象，根据prpoerties来确定个数，更具prpoerties[index]来确定描述
        if (this._cfg.Type == AttrCfgTypeEnum.object) {
            NodeUtil.autoRefreshChildren(this.subCont, this._cfg.Properties, (nd, index, property) => {
                const attrItem = nd.getComponent(AttrItem);
                attrItem.init(property, this, this._layer + 1, undefined, this._afterEditorCb, this._dat[property.ClassPropertyName]);
                this._subItems.push(attrItem);
            }, this.node);
            //对象必须有按钮
            this.hideBtn.active = true;
            let showSub = false;
            //第一次的话必定展示
            if (this._isShowSub == undefined) {
                showSub = true;
            }
            //之后只会根据手动结果来展示
            else {
                showSub = this._isShowSub;
            }
            this.setShowSub(showSub);
        }
        //如果当前是数组，根据dat来确定个数，更具prpoerties[0]来确定描述
        else if (this._cfg.Type == AttrCfgTypeEnum.array) {
            NodeUtil.autoRefreshChildren(this.subCont, this._dat, (nd, index, dat) => {
                const attrItem = nd.getComponent(AttrItem);
                attrItem.init(this._cfg.Properties[0], this, this._layer + 1, index, this._afterEditorCb, dat);
                this._subItems.push(attrItem);
            }, this.node);

            //子项没数据了，把按钮也隐藏了
            if (this._dat.length <= 0) {
                this.setShowSub(false);
                this.hideBtn.active = false;
            }
            else {
                //子项有数据，按钮得在啊
                this.hideBtn.active = true;
                let showSub = false;
                //第一次的话必定展示
                if (this._isShowSub == undefined) {
                    showSub = true;
                }
                //之后只会根据手动结果来展示
                else {
                    showSub = this._isShowSub;
                }
                this.setShowSub(showSub);
            }
        }
        //选点数组
        else if (this._cfg.Type == AttrCfgTypeEnum.pointArray) {
            NodeUtil.autoRefreshChildren(this.subCont, this._dat, (nd, index, dat) => {
                const attrItem = nd.getComponent(AttrItem);
                attrItem.init(this._cfg.Properties[0], this, this._layer + 1, index, this._afterEditorCb, dat);
                this._subItems.push(attrItem);
            }, this.node);

            //子项没数据了，把按钮也隐藏了
            if (this._dat.length <= 0) {
                this.setShowSub(false);
                this.hideBtn.active = false;
            }
            else {
                //子项有数据，按钮得在啊
                this.hideBtn.active = true;
                let showSub = false;
                //第一次的话必定展示
                if (this._isShowSub == undefined) {
                    showSub = true;
                }
                //之后只会根据手动结果来展示
                else {
                    showSub = this._isShowSub;
                }
                this.setShowSub(showSub);
            }
        }
    }

    //获得数据
    public getDat() {
        //值类型直接返回值（递归的退出条件）
        if (this._type == AttrCfgTypeEnum.string) {
            return this.singleLable.string;
        }
        if (this._type == AttrCfgTypeEnum.number) {
            return Number(this.singleLable.string);
        }
        if (this._type == AttrCfgTypeEnum.boolean) {
            return this.singleBool.isChecked;
        }
        //引用类型
        let resDat;
        //递归调用所有子项获得数据，需要根据类型来填充dat的字段
        if (this._type == AttrCfgTypeEnum.object) {
            resDat = {};
            //可以这样筛选的原因是，如果subCont被隐藏，自己点还是会有自己的active状态的，所以除非直接隐藏子节点
            this._subItems.filter(subItem => subItem.node.active).forEach(subItem => {
                resDat[subItem.getCfg().ClassPropertyName] = subItem.getDat();
            })
        }
        else if (this._type == AttrCfgTypeEnum.array) {
            resDat = [];
            //可以这样筛选的原因是，如果subCont被隐藏，自己点还是会有自己的active状态的，所以除非直接隐藏子节点
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

    //设置数组数据
    public setArrayDat(isAdd: boolean, index: number, addItem?: any) {
        //只有数组类型才能设置数据
        if (this._type != AttrCfgTypeEnum.array) return;
        if (isAdd) {
            this._dat.splice(index + 1, 0, addItem);
        }
        else {
            this._dat.splice(index, 1);
        }
        this.setUI();
        //如果是数组+的话，打开新的那一个子项
        let editStr = ""
        if (isAdd) editStr = this.getId() + `&{${index + 1}}`
        this.onAfterEdit(null, editStr);
    }

    //子节点显示隐藏
    public setShowSub(isShow: boolean) {
        //是否是最后一层
        if (this._isLastLayer) {
            return;
        }
        this._isShowSub = isShow;
        this.subCont.active = isShow;
        this.arrowBg.angle = isShow ? 0 : 90;
        //父节点节点关闭，所有子节点关闭
        if (!isShow) {
            this.subCont.children.forEach(child => {
                child.getComponent(AttrItem).setShowSub(false);
            })
        }
    }

    //=============外部操作==============
    //点击三角，展示子项
    public onClickArrow() {
        this.setShowSub(!this._isShowSub);
    }

    //选点模式
    public onClickSelectPoint() {
        //打开编辑界面
        if (this._type == AttrCfgTypeEnum.pointArray) {
            this.onClickP(true, this.singleSelectPoint, this._dat, (pids: string[]) => {
                this._dat = pids;
                this._subItems = [];
                NodeUtil.autoRefreshChildren(this.subCont, this._dat, (nd, index, dat) => {
                    const pid = dat ?? "";
                    const subItem = nd.getComponent(AttrItem);
                    subItem.init(this._cfg.Properties[0], this, this._layer + 1, index, this._afterEditorCb, pid);
                    this._subItems.push(subItem);
                }, this.node);
            });
        }
        else if (this._type == AttrCfgTypeEnum.point) {
            this.onClickP(false, this.singleSelectPoint, this._dat, (pids: string[]) => {
                this._dat = pids[0];
            });
        }
    }

    public onClickAddBtn() {
        //自己是数组
        if (this._type == AttrCfgTypeEnum.array) {
            this._dat.push(this._cfg.Properties[0].DefaultValue);
            this.setUI();
            this.onAfterEdit();
        }
        //父节点是数组
        else if (this._parentCfg && this._parentCfg.Type == AttrCfgTypeEnum.array) {
            const curIndex = Number(this._uniqueName);
            this._parentItem.setArrayDat(true, curIndex, this._cfg.Properties[0].DefaultValue);
        }
    }

    public onClickDeleteBtn() {
        if (this._type == AttrCfgTypeEnum.array) {
            this._dat.pop();
            this.setUI();
            this.onAfterEdit();
        }
        else if (this._parentCfg && this._parentCfg.Type == AttrCfgTypeEnum.array) {
            const curIndex = Number(this._uniqueName);
            this._parentItem.setArrayDat(false, curIndex);
        }
    }

    //TODO:编辑按钮
    public onClickEditBtn() {
    }




}
