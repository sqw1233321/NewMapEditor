import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import { ModeMgr } from "../frameWork/ModeMgr";
import { AttrCfgType, AttrPopDataType, UnitType } from "../type/mapTypes";
import { ModeType } from "../type/types";
import DynamicGetter from "./DynamicGetter/DynamicGetter";
import EditorSetting from "./EditorSetting";
import { PopUid } from "./PopConfigs";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HandlerPanel extends cc.Component {

    @property(cc.EditBox)
    curStageEditBox: cc.EditBox;

    @property(cc.Label)
    curStageLb: cc.Label;

    @property(cc.Label)
    mapNameLb: cc.Label;

    @property(cc.Toggle)
    autoRenameTog: cc.Toggle;

    protected onLoad(): void {
        EventManager.instance.on(MapEditorEvent.UpdateAutoRename, this.setAutoRenameUI, this);
        EventManager.instance.on(MapEditorEvent.UpdateFile, this.updateFile, this);
        EventManager.instance.on(MapEditorEvent.ChangeStage, this.updateStageId, this);
    }

    protected onDestroy(): void {
        EventManager.instance.off(MapEditorEvent.UpdateAutoRename, this.setAutoRenameUI, this);
        EventManager.instance.off(MapEditorEvent.UpdateFile, this.updateFile, this);
        EventManager.instance.off(MapEditorEvent.ChangeStage, this.updateStageId, this);
    }

    public afterEditStageId() {
        EditorSetting.Instance.setStageId(Number(this.curStageEditBox.string));
    }

    private setAutoRenameUI() {
        this.autoRenameTog.isChecked = EditorSetting.Instance.getAutoRename();
    }

    private updateStageId(stageId: number) {
        this.curStageLb.string = stageId.toString();
    }

    private updateFile(fileName: string) {
        this.mapNameLb.string = fileName;
    }

    public onClickEditStageCfg() {
        const attrJson = DynamicGetter.Ins.getAttrSetting();
        const typeJson = attrJson.typeArr.find((t: AttrCfgType) => (t.ClassName as string) == "Stage") as AttrCfgType;
        const stageId = EditorSetting.Instance.getStageId();
        const defalutValue = [{
            className: "id",
            value: stageId
        }]
        const excelDat = DynamicGetter.Ins.getExcelJson("LevelBaseConfig");
        const itemDat = excelDat[stageId];
        const attrPopData: AttrPopDataType = {
            dat: itemDat,
            typeJson: typeJson,
            defaultValues: defalutValue,
            titleName: "关卡属性",
            unitType: "Stage",
            saveCb: (mapDat, excelDat) => {
                //回写excel数据
                DynamicGetter.Ins.writeExcelJsonElements(excelDat);
            }
        }
        EventManager.instance.emit(MapEditorEvent.ShowPop, PopUid.AttrPop, attrPopData);
    }

    //连线模式
    public onClickPathLineMode() {
        ModeMgr.instance.enterMode(ModeType.PathPointLink);
    }

    //自动命名按钮
    public onTogAutoReanme(event) {
        EditorSetting.Instance.setAutoRename(event.isChecked);
    }
}
