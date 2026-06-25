import { MapEditorEvent } from "../../event/eventTypes";
import { EventManager } from "../../frameWork/EventManager";
import DynamicGetter from "../DynamicGetter/DynamicGetter";
import PopBase from "../PopBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EditorSettingPop extends PopBase {
    @property(cc.EditBox)
    exportSelectPath: cc.EditBox;

    @property(cc.Toggle)
    saveMashismToggle: cc.Toggle;

    public showPop(): void {
        super.showPop();
        this.setUI();
    }

    private setUI() {
        this.exportSelectPath.string = DynamicGetter.Ins.getEditorSetting()["excelExportPath"] ?? "";
        this.saveMashismToggle.isChecked = DynamicGetter.Ins.getEditorSetting()["saveMashism"] ?? false;
    }

    public async onClickSelectPath() {
        const result = await window.electronAPI.openFileDialog(
            [{ name: 'All Files', extensions: ['*'] }],
            ['openDirectory']
        );
        if (result.success) {
            const path = result.path;
            console.log(`选择的导出路径: ${path}`);
            EventManager.instance.emit(MapEditorEvent.ShowTip, "选择路径成功");
            DynamicGetter.Ins.getEditorSetting()["excelExportPath"] = path;
            //存盘
            EventManager.instance.emit(MapEditorEvent.SaveExcelFile, "editorSetting");
            this.setUI();
        }
        else {
            EventManager.instance.emit(MapEditorEvent.ShowTip, "选择路径失败")
        }
    }

    public onClickSaveMashism() {
        DynamicGetter.Ins.getEditorSetting()["saveMashism"] = this.saveMashismToggle.isChecked;
        //存盘
        EventManager.instance.emit(MapEditorEvent.SaveExcelFile, "editorSetting");
        this.setUI();
    }
    
}
