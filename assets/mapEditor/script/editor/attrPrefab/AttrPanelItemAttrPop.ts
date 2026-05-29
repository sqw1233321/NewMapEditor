// import { AttrPanelPropertyType } from "../../type/mapTypes";
// import { PopConfig, PopUid } from "../PopConfigs";
// import PopManager from "../PopManager";
// import AttrPop from "../popUps/AttrPop";
// import AttrPanelItemBase from "./AttrPanelItemBase";


// const { ccclass, property } = cc._decorator;

// //通用属性面板item,编辑point
// @ccclass
// export default class AttrPanelItemAttrPop extends AttrPanelItemBase {
//     @property(cc.Node)
//     attrsCont: cc.Node;

//     private _dat;
//     private _popUid: PopUid;

//     public init(cfg: AttrPanelPropertyType, cb: any, dat) {
//         super.init(cfg, cb, dat);
//         this._dat = dat;
//         const popName = this._cfg.PopName;
//         const uid = PopConfig[popName];
//         if (!uid) {
//             console.log("AttrPanelItemAttrPop 有问题 uid不存在！！！");
//             return;
//         }
//         this.setUI();
//     }

//     private setUI() {
//         this.descLb.string = this._cfg.Name;
//     }

//     public onClickOpenPop() {
//         PopManager.ins.showPopUp(this._popUid, [this._popUid, this._cfg.Properties, this._dat]);
//     }

//     public getDat() {
//         const popNd = PopManager.ins.getPopNd(this._popUid);
//         if (!popNd) return;
//         const attrPop = popNd.getComponent(AttrPop);
//         const str = attrPop.getDat();
//         return str;
//     }
// }
