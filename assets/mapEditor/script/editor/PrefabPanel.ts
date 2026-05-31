// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import DynamicGetter from "./DynamicGetter/DynamicGetter";
import PrefabPanelItem from "./prefabPanel/PrefabPanelItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PrefabPanel extends cc.Component {

    @property(cc.Node)
    itemContainer: cc.Node;

    @property(cc.Prefab)
    itemPrefab: cc.Prefab;

    protected start(): void {
        const itemSettings = DynamicGetter.Ins.getItemSetting();
        for (const setting of itemSettings) {
            const itemNode = cc.instantiate(this.itemPrefab) as cc.Node;
            const controller = itemNode.getComponent(PrefabPanelItem);
            controller.init(setting);
            itemNode.parent = this.itemContainer;
        }
    }
}
