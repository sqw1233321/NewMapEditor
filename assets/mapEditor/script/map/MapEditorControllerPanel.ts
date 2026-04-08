const { ccclass, property } = cc._decorator;

@ccclass
export default class MapEditorControllerPanel extends cc.Component {

    public onClickClose() {
        this.node.active = false;
    }
}
