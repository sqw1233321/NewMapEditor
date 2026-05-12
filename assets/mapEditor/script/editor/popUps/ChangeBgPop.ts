// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import MapExporter from "../../item/MapExporter";
import EditorSetting from "../EditorSetting";
import { EditorMapEntry, MapBgManager } from "../MapBgManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ChangeBgPop extends cc.Component {
    @property(cc.EditBox)
    sizeX: cc.EditBox;

    @property(cc.EditBox)
    sizeY: cc.EditBox;

    @property(cc.EditBox)
    areaNumLb: cc.EditBox;

    @property(cc.EditBox)
    areaOffsetEdit: cc.EditBox = null;

    @property(cc.Label)
    fileNameLb: cc.Label;

    private _dat;

    private _levelBgName: string = "";

    public showPop(dat: { cb }): void {
        this._dat = dat;
        this.sizeX.string = `2906`;
        this.sizeY.string = `3654`;
        this.areaNumLb.string = `0`;
        this.areaOffsetEdit.string = `4000`;
    }

    //选择现有图片集
    public async onClickSelectBg() {
        const path = await MapBgManager.instance.selectAndImportAtlas();
        this._levelBgName = `${path}`
        this.fileNameLb.string = this._levelBgName;
    }


    //保存配置
    public async onClickCreate() {
        const curFileInfo = EditorSetting.Instance.getFileInfo();
        if (!curFileInfo) return;
        const dat: EditorMapEntry = {
            mapDta: curFileInfo.fileName,
            mapBg: this._levelBgName,
            areaNumber: Number(this.areaNumLb.string),
            areaOffset: Number(this.areaOffsetEdit.string),
            areaSize: `${this.sizeX.string}|${this.sizeY.string}`
        }
        MapBgManager.instance.updateMapDataEntry(dat);
        //可以同步因为这个地方改的内存中的数据。
        this._dat.cb?.();
        this.hidePop();
    }

    private hidePop() {
        this.node.active = false;
    }
}
