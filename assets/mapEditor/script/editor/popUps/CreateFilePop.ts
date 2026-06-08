import { MapEditorEvent } from "../../event/eventTypes";
import { EventManager } from "../../frameWork/EventManager";
import MapExporter from "../../item/MapExporter";
import PopBase from "../PopBase";
import { PopUid } from "../PopConfigs";
import PopManager from "../PopManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CreateFilePop extends PopBase {

    @property(cc.EditBox)
    fileNameEdit: cc.EditBox = null;


    private _dat;

    public showPop(dat: { exporter: MapExporter, cb }): void {
        super.showPop();
        this._dat = dat;
        this.fileNameEdit.string = 'newMap';
    }

    //选择现有图片集
    public onClickSelectBg() {
        EventManager.instance.emit(MapEditorEvent.ShowPop, PopUid.ChangeBgPop)
    }


    //新建文件
    public async onClickCreate() {
        const fileName = this.fileNameEdit.string;
        const jsonContent = JSON.stringify({
            "size": {
                "width": `2906`,
                "height": `3654`
            },
            "pathPoints": [],
            "rooms": [],
            "playerCreatePos": {
                "x": 0,
                "y": 0
            },
            "playerExitPos": {
                "x": 100,
                "y": 100
            },
            "areaInfo": []
        });
        const mapExporter = this._dat.exporter;
        const result = await mapExporter?.createFile(fileName, jsonContent);
        if (result.success) {
            console.log('新建成功:', result.path);
            this._dat.cb(jsonContent, fileName);
        } else if (result.reason === 'duplicate') {
            console.warn('文件已存在，无法创建:', result.path);
            // 这里可以让 Cocos 弹出提示框或询问用户是否覆盖
        } else {
            console.error('创建失败:', result.error);
        }
        this.hidePop();
    }
}
