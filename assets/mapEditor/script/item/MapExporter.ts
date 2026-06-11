import DynamicGetter from "../editor/DynamicGetter/DynamicGetter";
import EditorSetting from "../editor/EditorSetting";
import StageExcelConvert from "../editor/StageExcelConvert";
import { MapEditorEvent } from "../event/eventTypes";
import { EventManager } from "../frameWork/EventManager";
import MapLoader from "./MapLoader";

/**
 * 地图数据导出器
 * 负责：JSON 导出、文件保存、下载
 */
export default class MapExporter {
  private _mapLoaderComp: MapLoader = null;

  public init(mapLoader: cc.Node) {
    this._mapLoaderComp = mapLoader.getComponent(MapLoader);
  }

  //新建地图数据
  public async createFile(fileName, jsonContent) {
    return await window.electronAPI.createFile(fileName, jsonContent);
  }

  //导入地图数据
  public async import() {
    const filters = [{ name: 'JSON Files', extensions: ['json'] }];
    const result = await window.electronAPI.openFileDialog(filters);
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
    this.writeExcelObject(excelJson);
    this.saveAllDiskExcels();
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
    this.writeExcelObject(excelJson);
    this.saveAllDiskExcels();
    //内部json
    const json = this._mapLoaderComp?.saveDat();
    if (!json) return;
    this.updateLevelJson(json);
    this.persistToDisk(json);
    this.downloadJson();
  }

  /** 更新内存中的地图数据*/
  private updateLevelJson(json: string) {
    const fileInfo = EditorSetting.Instance.getFileInfo();
    if (!fileInfo) return;
    const levelJson = fileInfo.fileJson;
    if (!levelJson) return;
    fileInfo.fileJson = JSON.parse(json);
  }

  /** 把当前地图数据覆盖写回 assets 下对应 json 文件 */
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
        window.electronAPI.writeFile(`${EditorSetting.MapDatPath}${fileName}`, json)
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

  //写入excel内存对象
  private writeExcelObject(excelWriteInfo: { excelName: string, id: number, itemName: string, itemValue: any }[][]) {
    //先将关卡表的一些特殊字段置为空
    const stageId = EditorSetting.Instance.getStageId();
    StageExcelConvert.setDefault(stageId);
    //内存写入
    excelWriteInfo?.forEach(changes => {
      DynamicGetter.Ins.writeExcelJsonElements(changes);
    })
    //关卡表特殊的处理
    //关卡名写入
    const levelName = EditorSetting.Instance.getFileInfo().fileName?.split(".")[0] ?? "";
    //关卡表查漏补缺
    StageExcelConvert.fillProperties(stageId);
    DynamicGetter.Ins.writeExcelJsonElement("LevelBaseConfig", EditorSetting.Instance.getStageId(), "levelRes1", levelName);
  }

  //保存所有excel到磁盘
  public saveAllDiskExcels(savePath?) {
    if (!CC_BUILD) return;
    DynamicGetter.Ins.getAllExcelJsons().forEach(jsonObj => {
      this.saveJsonToDisk(jsonObj.jsonName, savePath);
    })
  }

  //保存json到磁盘
  public saveJsonToDisk(jsonName: string, savePath?) {
    if (!CC_BUILD) return;
    let jsonObj = null;
    //外部json
    let path = savePath || EditorSetting.OuterJsonPath;
    jsonObj = DynamicGetter.Ins.getExcelJson(jsonName);
    //内部json
    if (!jsonObj) {
      jsonObj = DynamicGetter.Ins[jsonName];
      path = savePath || EditorSetting.EditorJsonPath;
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

  /** 下载 JSON 文件 */
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

  //导入外部excel到编辑器内部
  public async importExcel() {
    if (!CC_BUILD) return;
    const filters = [{ name: 'JSON Files', extensions: ['json'] }];
    const result = await window.electronAPI.openFileDialog(filters);
    if (!result.success) return;
    const jsonObj = JSON.parse(result.content);
    const jsonName = result.fileName.split(".")[0];
    const path = EditorSetting.OuterJsonPath;
    //写入json
    window.electronAPI.writeFile(`${path}${jsonName}`, JSON.stringify(jsonObj))
      .then(() => {
        console.log("excel导入成功: ", jsonName);
        EventManager.instance.emit(MapEditorEvent.ShowTip, "excel导入成功: " + jsonName);
        //内存写入
        DynamicGetter.Ins.setExcelJson(jsonName, jsonObj);
      })
      .catch((err: any) => {
        console.error("excel导入失败: ", err);
        EventManager.instance.emit(MapEditorEvent.ShowTip, "excel导入失败: " + err);
      });
  }

  //导出excel到外部文件
  public async exportExcel() {
    if (!CC_BUILD) return;
    const exportPath = DynamicGetter.Ins.getEditorSetting().excelExportPath;
    //进行json到excel的转化，到excelAsset文件夹下
    const excelPath = EditorSetting.ExcelPath;
    const jsonPath = EditorSetting.OuterJsonPath;
    //todo:把jsonPath下的文件转化为excel然后存到excelPath里面
    //window.electronAPI.jsonToExcel(jsonPath, excelPath);
    //复制文件到一个绝对路径
    //TODO:现在先用jsonPath，完成了上面的todo之后换成excelPath
    const result = await window.electronAPI.copyFiles(jsonPath, exportPath);
    if (!result.success) {
      EventManager.instance.emit(MapEditorEvent.ShowTip, "excel导出失败: " + result.error);
      console.log("excel导出失败: " + result.error);
    }
    else {
      EventManager.instance.emit(MapEditorEvent.ShowTip, "excel导出成功!!!");
      console.log("excel导出成功");
    }
  }

}

declare var require: any;
declare var Editor: any;

