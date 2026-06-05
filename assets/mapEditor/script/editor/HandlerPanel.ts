// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import { AttrCfgType, UnitType } from "../type/mapTypes";
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

    @property(cc.Label)
    curModeLb: cc.Label;

    @property(cc.Toggle)
    autoRenameTog: cc.Toggle;

    protected onLoad(): void {
        EventManager.instance.on(MapEditorEvent.UpdateAutoRename, this.setAutoRenameUI, this);
        EventManager.instance.on(MapEditorEvent.UpdateCurModeDisplay, this.updateCurModeDisplay, this);
        EventManager.instance.on(MapEditorEvent.UpdateFile, this.updateFile, this);
        EventManager.instance.on(MapEditorEvent.ChangeStage, this.updateStageId, this);
    }

    protected onDestroy(): void {
        EventManager.instance.off(MapEditorEvent.UpdateAutoRename, this.setAutoRenameUI, this);
        EventManager.instance.off(MapEditorEvent.UpdateCurModeDisplay, this.updateCurModeDisplay, this);
        EventManager.instance.off(MapEditorEvent.UpdateFile, this.updateFile, this);
        EventManager.instance.off(MapEditorEvent.ChangeStage, this.updateStageId, this);
    }

    public afterEditStageId() {
        EditorSetting.Instance.setStageId(Number(this.curStageEditBox.string));
    }

    private setAutoRenameUI() {
        this.autoRenameTog.isChecked = EditorSetting.Instance.getAutoRename();
    }

    private updateCurModeDisplay(modeType: ModeType) {
        if (!modeType) {
            this.curModeLb.string = "无模式";
            return;
        }
        this.curModeLb.string = modeType;
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
        EventManager.instance.emit(MapEditorEvent.ShowPop, PopUid.AttrPop, itemDat, typeJson, defalutValue, "关卡属性");
    }
}
