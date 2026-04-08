import MapDrawUnitBase from "../item/MapDrawUnitBase";
import { HoverType } from "../type/types";

const { ccclass, property } = cc._decorator;

//画节点的外轮廓
@ccclass
export default class HoverDrawer extends cc.Component {

    @property(cc.Label)
    itemName: cc.Label;

    @property(cc.Graphics)
    drawer: cc.Graphics;

    private _hoverDat: HoverType;

    draw(hoverDat: HoverType) {
        if (!hoverDat) return;
        this.node.active = true;
        this.itemName.string = hoverDat.name;
        this.drawer.clear();
        const localPos = this.drawer.node.parent.convertToNodeSpaceAR(hoverDat.worldPos);
        this.drawer.rect(localPos.x, localPos.y, hoverDat.width, hoverDat.height);
        this.drawer.stroke();
    }


    clear() {
        this.node.active = false;
    }


}
