import MapLoader from "./MapLoader";

declare var Editor: any;

/**
 * 地图数据导出器
 * 负责：JSON 导出、文件保存、下载
 */
export default class MapExporter {
  private _mapLoaderComp: MapLoader = null;
  private _levelJson: cc.JsonAsset = null;

  public init(mapLoader: cc.Node, levelJson: cc.JsonAsset) {
    this._mapLoaderComp = mapLoader.getComponent(MapLoader);
    this._levelJson = levelJson;
  }

  //==================== 导入 ====================
  public async import() {
    const result = await window.electronAPI.openFileDialog();
    if (result.success) {
      const mapData = JSON.parse(result.content);
      console.log('导入文件:', result.path);
      console.log('导入文件内容:', mapData);
    }
    return result.content;
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
    if (!this._levelJson) return;
    this._levelJson.json = JSON.parse(json);
  }

  /** 把当前 levelJson 覆盖写回 assets 下对应 json 文件（仅编辑器环境） */
  private persistToDisk(json: string) {
    if (!this._levelJson) return;
    if (typeof CC_EDITOR != "undefined" && CC_EDITOR) {
      try {
        const fs = require("fs");
        const path = require("path");
        const assetAny = this._levelJson as any;
        const uuid = assetAny?._uuid;
        if (!uuid) return;

        const filePath = (Editor as any)?.assetdb?.uuidToFspath(uuid);
        if (!filePath) return;

        const normalizedPath = path.normalize(filePath);
        fs.writeFileSync(normalizedPath, json, "utf8");
        console.log("Level JSON 已保存：", normalizedPath);
        (Editor as any)?.assetdb?.refresh("db://assets");
      } catch (err) {
        console.error("Level JSON 保存失败:", err);
      }
    }

    // Electron IPC 方式（web-desktop + Electron）
    if (typeof window.electronAPI !== "undefined") {
      console.log("开始保存");
      const filePath = "D:/fork/myEditor/mapDat/mapDatTest.json"
      console.log("准备写入文件:", filePath);
      console.log("window.electronAPI:", window.electronAPI)
      if (filePath) {
        window.electronAPI.writeFile(filePath, json)
          .then(() => console.log("Level JSON 已保存：", filePath))
          .catch((err: any) => console.error("保存失败:", err));
      }
    }
  }

  /** 下载 JSON 文件（浏览器环境） */
  public downloadJson(filename = "mapData.json") {
    const json = JSON.stringify(this._levelJson?.json ?? {});
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
declare global {
  interface Window {
    electronAPI: {
      writeFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
      openFileDialog: () => Promise<{ success: boolean; path?: string; content?: string; error?: string }>;
    };
  }
}

