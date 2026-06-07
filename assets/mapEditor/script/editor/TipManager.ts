import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";

const { ccclass, property } = cc._decorator;
@ccclass
export default class TipManager extends cc.Component {
    @property(cc.Prefab)
    tipPrefab: cc.Prefab = null;
    @property(cc.Node)
    tipLayer: cc.Node = null;
    private _pool: cc.Node[] = [];

    protected onLoad(): void {
        EventManager.instance.on(MapEditorEvent.ShowTip, this.showTip, this);
        // 预热节点池
        for (let i = 0; i < 5; i++) {
            this._pool.push(this.createTipNode());
        }
    }

    protected onDestroy(): void {
        EventManager.instance.off(MapEditorEvent.ShowTip, this.showTip, this);
    }

    private createTipNode(): cc.Node {
        const node = cc.instantiate(this.tipPrefab);
        node.parent = this.tipLayer;
        node.active = false;
        return node;
    }

    private getTipNode(): cc.Node {
        let tip = this._pool.pop();
        if (!tip) {
            tip = this.createTipNode();
        }
        return tip;
    }

    private returnTipNode(tip: cc.Node): void {
        tip.active = false;
        tip.stopAllActions();
        tip.setPosition(0, 0);
        this._pool.push(tip);
    }

    public showTip(str: string, duration: number = 2): void {
        const tip = this.getTipNode();
        const label = tip.children[1].getComponent(cc.Label);
        label.string = str;
        tip.active = true;
        tip.opacity = 0;
        tip.y = -50; // 从下方起始位置

        tip.stopAllActions();

        const slideIn = cc.spawn(
            cc.moveTo(0.25, tip.x, 0),
            cc.fadeIn(0.25)
        );

        tip.runAction(cc.sequence(
            slideIn,
            cc.delayTime(duration),
            cc.fadeOut(0.3),
            cc.callFunc(() => this.returnTipNode(tip))
        ));
    }

}
