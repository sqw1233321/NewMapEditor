import DynamicGetter from "../editor/DynamicGetter/DynamicGetter";
import EditorSetting from "../editor/EditorSetting";
import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import MapLoader from "./MapLoader";

declare var Editor: any;

/**
 * 地图数据导出器
 * 负责：JSON 导出、文件保存、下载
 */
export default class MapExporter {
  private _mapLoaderComp: MapLoader = null;

  public init(mapLoader: cc.Node) {
    this._mapLoaderComp = mapLoader.getComponent(MapLoader);
  }

  //==================== 新建 ====================
  public async createFile(fileName, jsonContent) {
    return await window.electronAPI.createFile(fileName, jsonContent);
  }

  //==================== 导入 ====================
  public async import() {
    const result = await window.electronAPI.openFileDialog();
    if (result.success) {
      const mapData = JSON.parse(result.content);
      console.log('导入文件:', result.path);
      console.log('导入文件内容:', mapData);
    }
    return { content: result.content, fileName: result.fileName };
  }

  // ==================== 导出 & 保存 ====================

  /** 保存（仅编辑器环境写盘） */
  public save() {
    //合法性检测
    const isValid = this._mapLoaderComp.checkMapValid()
    if (!isValid) return;

    //外部json
    const excelJson = this._mapLoaderComp?.saveExcelDat();
    if (!excelJson) return;
    this.updateExcelJson(excelJson);
    this.persistToDiskExcel(excelJson);
    //内部json
    const json = this._mapLoaderComp?.saveDat();
    if (!json) return;
    this.updateLevelJson(json);
    this.persistToDisk(json);
  }

  /** 导出（保存 + 下载） */
  public export() {
    //合法性检测
    const isValid = this._mapLoaderComp.checkMapValid()
    if (!isValid) return;
    //外部json
    const excelJson = this._mapLoaderComp?.saveExcelDat();
    if (!excelJson) return;
    this.updateExcelJson(excelJson);
    this.persistToDiskExcel(excelJson);
    //内部json
    const json = this._mapLoaderComp?.saveDat();
    if (!json) return;
    this.updateLevelJson(json);
    this.persistToDisk(json);
    this.downloadJson();
  }

  private updateExcelJson(excelSetingInfo: any[]) {
    if (!excelSetingInfo || excelSetingInfo.length === 0) return;
    excelSetingInfo.forEach((item) => {
      DynamicGetter.Ins.writeExcelJsonElements(item);
    });
  }

  /** 更新内存中的 levelJson 对象 */
  private updateLevelJson(json: string) {
    const fileInfo = EditorSetting.Instance.getFileInfo();
    if (!fileInfo) return;
    const levelJson = fileInfo.fileJson;
    if (!levelJson) return;
    fileInfo.fileJson = JSON.parse(json);
  }

  /** 把当前 levelJson 覆盖写回 assets 下对应 json 文件（仅编辑器环境） */
  private persistToDisk(json: string) {
    const fileInfo = EditorSetting.Instance.getFileInfo();
    if (!fileInfo) return;
    const levelJson = fileInfo.fileJson;
    if (!levelJson) return;
    if (CC_BUILD) {
      console.log("开始保存");
      const fileName = this._mapLoaderComp.getFileName();
      console.log("准备写入文件:", fileName);
      if (fileName) {
        window.electronAPI.writeFile(`/mapDat/${fileName}`, json)
          .then(() => {
            console.log("Level JSON 已保存：", fileName);
            EventManager.instance.emit(MapEditorEvent.ShowTip, "保存成功：" + fileName)
          })
          .catch((err: any) => {
            console.error("保存失败:", err);
            EventManager.instance.emit(MapEditorEvent.ShowTip, "保存失败: ");
          });
      }
    }
  }

  private persistToDiskExcel(excelChanges: { excelName: string, id: number, itemName: string, itemValue: any }[][]) {
    if (!excelChanges || excelChanges.length === 0) return;
    //内存写入
    excelChanges.forEach(changes => {
      DynamicGetter.Ins.writeExcelJsonElements(changes);
    })
    //开始存盘
    if (CC_BUILD) {
      console.log("开始保存excel");
      DynamicGetter.Ins.getAllExcelJsons().forEach(jsonObj => {
        const jsonName = jsonObj.jsonName;
        this.saveJsonToDisk(jsonName);
      })
    }
  }

  //保存json到磁盘
  public saveJsonToDisk(jsonName: string) {
    if (!CC_BUILD) return;
    let jsonObj = null;
    //外部json
    let path = EditorSetting.OuterJsonPath;
    jsonObj = DynamicGetter.Ins.getExcelJson(jsonName);
    //内部json
    if (!jsonObj) {
      jsonObj = DynamicGetter.Ins[jsonName];
      path = EditorSetting.EditorJsonPath;
    }
    //都不是，有问题
    if (!jsonObj) {
      console.log("保存json到磁盘错误，无jsonObj");
      EventManager.instance.emit(MapEditorEvent.ShowTip, "保存Excel失败：无jsonObj");
      return;
    }
    window.electronAPI.writeFile(`${path}${jsonName}`, JSON.stringify(jsonObj))
      .then(() => {
        console.log("Excel JSON 已保存：", jsonName);
        EventManager.instance.emit(MapEditorEvent.ShowTip, "excel保存成功：" + jsonName);
      })
      .catch((err: any) => {
        console.error("保存失败:", err);
        EventManager.instance.emit(MapEditorEvent.ShowTip, "excel保存失败: " + err);
      });
  }

  /** 下载 JSON 文件（浏览器环境） */
  public downloadJson(filename = "mapData.json") {
    const fileInfo = EditorSetting.Instance.getFileInfo();
    if (!fileInfo) return;
    const levelJson = fileInfo.fileJson;
    if (!levelJson) return;
    const json = JSON.stringify(levelJson ?? {});
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

declare var require: any;
declare var Editor: any;

