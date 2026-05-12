// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import MapExporter from "../../item/MapExporter";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CreateFilePop extends cc.Component {

    @property(cc.EditBox)
    fileNameEdit: cc.EditBox = null;

    @property(cc.EditBox)
    sizeX: cc.EditBox;

    @property(cc.EditBox)
    sizeY: cc.EditBox;

    @property(cc.EditBox)
    areaNumLb: cc.EditBox;

    private _dat;

    public showPop(dat: { exporter: MapExporter, cb }): void {
        this._dat = dat;
        this.fileNameEdit.string = 'newMap';
        this.sizeX.string = `2906`;
        this.sizeY.string = `3654`;
        this.areaNumLb.string = `0`;
    }

    //选择现有图片集
    public onClickSelectBg() {
        
    }


    //新建文件
    public async onClickCreate() {
        const fileName = this.fileNameEdit.string;
        const jsonContent = JSON.stringify({
            "size": {
                "width": this.sizeX.string,
                "height": this.sizeY.string
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

    private hidePop() {
        this.node.active = false;
    }
}
