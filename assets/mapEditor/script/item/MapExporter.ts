import EditorSetting from "../editor/EditorSetting";
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
    const json = this._mapLoaderComp?.saveDat();
    if (!json) return;
    this.updateLevelJson(json);
    this.persistToDisk(json);
  }

  /** 导出（保存 + 下载） */
  public export() {
    const json = this._mapLoaderComp?.saveDat();
    if (!json) return;
    this.updateLevelJson(json);
    this.persistToDisk(json);
    this.downloadJson();
  }

  // ==================== 私有方法 ====================

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
    // Electron IPC 方式（web-desktop + Electron）
    if (typeof window.electronAPI !== "undefined") {
      console.log("开始保存");
      const fileName = this._mapLoaderComp.getFileName();
      console.log("准备写入文件:", fileName);
      console.log("window.electronAPI:", window.electronAPI)
      if (fileName) {
        window.electronAPI.writeFile(fileName, json)
          .then(() => console.log("Level JSON 已保存：", fileName))
          .catch((err: any) => console.error("保存失败:", err));
      }
    }
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

