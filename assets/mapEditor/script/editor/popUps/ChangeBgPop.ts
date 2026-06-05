import { MapEditorEvent } from "../../event/eventTypes";
import { EventManager } from "../../frameWork/EventManager";
import EditorSetting from "../EditorSetting";
import { EditorMapEntry, MapBgManager } from "../MapBgManager";
import PopBase from "../PopBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ChangeBgPop extends PopBase {
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

    public initPop(dat: {}): void {
        super.initPop();
        this._dat = dat;
        const curFileInfo = EditorSetting.Instance.getFileInfo();
        const mapEditorDat = MapBgManager.instance.getMapEditorDat(curFileInfo?.fileName ?? "");
        if (mapEditorDat) {
            //有配置
            this.sizeX.string = mapEditorDat.areaSize.split("|")[0];
            this.sizeY.string = mapEditorDat.areaSize.split("|")[1];
            this.areaNumLb.string = mapEditorDat.areaNumber.toString();
            this.areaOffsetEdit.string = mapEditorDat.areaOffset.toString();
            this.changeFileBgName(mapEditorDat.mapBg);
        }
        //无配置，初始值
        else {
            this.sizeX.string = `2`;
            this.sizeY.string = `2`;
            this.areaNumLb.string = `1`;
            this.areaOffsetEdit.string = `4000`;
        }
    }

    //选择现有图片集
    public async onClickSelectBg() {
        const path = await MapBgManager.instance.selectAndImportAtlas();
        this.changeFileBgName(`${path}`);
    }

    private changeFileBgName(name: string) {
        this._levelBgName = name;
        this.fileNameLb.string = this._levelBgName;
    }


    //保存配置
    public async onClickCreate() {
        const curFileInfo = EditorSetting.Instance.getFileInfo();
        if (!curFileInfo) {
            console.log("当前没有选择的地图数据！！！");
            return;
        }
        if (!this._levelBgName) {
            console.log("当前没有选择的背景图！！！");
            return;
        }
        const dat: EditorMapEntry = {
            mapDta: curFileInfo.fileName,
            mapBg: this._levelBgName,
            areaNumber: Number(this.areaNumLb.string),
            areaOffset: Number(this.areaOffsetEdit.string),
            areaSize: `${this.sizeX.string}|${this.sizeY.string}`
        }
        MapBgManager.instance.updateMapDataEntry(dat);
        //可以同步因为这个地方改的内存中的数据。
        EventManager.instance.emit(MapEditorEvent.ChangeMapBg);
        this.hidePop();
    }

}
