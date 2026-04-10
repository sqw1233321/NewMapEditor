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
        if (!hoverDat) {
            this.clear();
            return;
        }
        this.drawMulti(hoverDat.name, [hoverDat]);
    }

    private static readonly LINK_LINE_WIDTH = 5;

    /** 绘制多个框（例如房间 + 其下所有可编辑子节点）；可选绘制路径连线（世界坐标） */
    drawMulti(
        title: string,
        boxes: HoverType[],
        linkWorldSegments?: Array<{ p0: cc.Vec2; p1: cc.Vec2 }>
    ) {
        if (!boxes || boxes.length === 0) {
            this.clear();
            return;
        }
        this.node.active = true;
        this.itemName.string = boxes.length > 1 ? `${title} (${boxes.length})` : (title || boxes[0].name);
        this.drawer.clear();
        const parentNd = this.drawer.node.parent;
        const lineWidthBefore = this.drawer.lineWidth;

        // 矩形：不改动 strokeColor / lineWidth，沿用场景里 Graphics 的配置
        for (const h of boxes) {
            if (!h) continue;
            const localPos = parentNd.convertToNodeSpaceAR(h.worldPos);
            this.drawer.rect(localPos.x, localPos.y, h.width, h.height);
        }
        this.drawer.stroke();

        if (linkWorldSegments && linkWorldSegments.length > 0) {
            this.drawer.lineWidth = HoverDrawer.LINK_LINE_WIDTH;
            for (let i = 0; i < linkWorldSegments.length; i++) {
                const seg = linkWorldSegments[i];
                if (!seg) continue;
                const a = parentNd.convertToNodeSpaceAR(seg.p0);
                const b = parentNd.convertToNodeSpaceAR(seg.p1);
                this.drawer.moveTo(a.x, a.y);
                this.drawer.lineTo(b.x, b.y);
            }
            this.drawer.stroke();
        }
        this.drawer.lineWidth = lineWidthBefore;
    }

    clear() {
        this.node.active = false;
    }


}
