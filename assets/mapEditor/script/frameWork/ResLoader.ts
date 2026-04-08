// 转换自 assets/_script/ResLoader.js
// import * as Logger from "./Logger";
import { Logger } from "./Logger";
import { StringUtil } from "./StringUtil";

type LoadAssetRequest = {
  path: string;
  type: any;
  bundle?: cc.AssetManager.Bundle | null;
  bundleName?: string;
  success?: (asset: any) => void;
  fail?: (err: any) => void;
  complete?: () => void;
};

type LoadBundleRequest = {
  bundle?: cc.AssetManager.Bundle | null;
  bundleName?: string;
  success?: (bundle: cc.AssetManager.Bundle) => void;
  fail?: (err: any) => void;
  complete?: () => void;
};

type LoadDirRequest = {
  dir: string;
  bundle?: cc.AssetManager.Bundle | null;
  bundleName?: string;
  success?: (assets: any[]) => void;
  fail?: (err: any) => void;
  complete?: () => void;
};

export class ResLoader {
  static loadRemote(option: {
    url: string;
    option?: any;
    success?: (res: any) => void;
    fail?: (err: any) => void;
    complete?: () => void;
  }): Promise<any> | void {
    const opt = option.option || {};
    const { url, success, fail, complete } = option;
    if (!success) {
      return new Promise((resolve, reject) => {
        this._loadRemote(url, opt, resolve, reject);
      });
    }
    this._loadRemote(url, opt, success, fail, complete);
  }

  private static _loadRemote(
    url: string,
    option: any,
    success?: (res: any) => void,
    fail?: (err: any) => void,
    complete?: () => void
  ): void {
    cc.assetManager.loadRemote(url, option, (err: Error, asset: any) => {
      if (err) {
        fail && fail({ errCode: -1, errMsg: err.message });
      } else {
        success && success(asset);
      }
      complete && complete();
    });
  }

  static loadAssetAny(params: { requests: LoadAssetRequest[] }): Promise<any[]> {
    const tasks: Array<Promise<any>> = [];
    for (let i = 0; i < params.requests.length; i++) {
      tasks.push(this.loadAsset(params.requests[i]) as Promise<any>);
    }
    return Promise.all(tasks);
  }

  static preload(option: { paths: string | string[]; type: any; bundle?: cc.AssetManager.Bundle; bundleName?: string }): void {
    this.loadBundle({
      bundle: option.bundle,
      bundleName: option.bundleName
    })
      .then((bundle) => {
        bundle.preload(option.paths, option.type);
      })
      .catch(() => { });
  }

  static loadAssetSync(path: string, type: any, bundleName?: string): any {
    const bundle = StringUtil.isEmpty(bundleName) ? cc.resources : cc.assetManager.getBundle(bundleName);
    return bundle ? bundle.get(path, type) : null;
  }

  static loadAsset<T>(option: LoadAssetRequest): Promise<T> {
    if (!option.success) {
      return new Promise((resolve, reject) => {
        this._loadAsset(option.path, option.type, option.bundle, option.bundleName, resolve, reject);
      });
    }
    this._loadAsset(option.path, option.type, option.bundle, option.bundleName, option.success, option.fail, option.complete);
  }

  private static _loadAsset(
    path: string,
    type: any,
    bundle: cc.AssetManager.Bundle | null | undefined,
    bundleName: string | undefined,
    success?: (asset: any) => void,
    fail?: (err: any) => void,
    complete?: () => void
  ): void {
    this.loadBundle({
      bundle,
      bundleName,
      success: (b) => {
        const cached = b.get(path, type);
        if (cached != null) {
          success && success(cached);
          complete && complete();
          return;
        }
        b.load(path, type, (err: Error, asset: any) => {
          if (err) {
            Logger.error(err);
            fail && fail({ errCode: -1, errMsg: err.message });
            complete && complete();
            return;
          }
          success && success(asset);
          complete && complete();
        });
      },
      fail: (err) => {
        fail && fail(err);
        complete && complete();
      }
    });
  }

  static loadBundle(option: LoadBundleRequest): Promise<cc.AssetManager.Bundle> {
    if (!option.success) {
      return new Promise((resolve, reject) => {
        this._loadBundle(option.bundle, option.bundleName, resolve, reject);
      });
    }
    this._loadBundle(option.bundle, option.bundleName, option.success, option.fail, option.complete);
  }

  private static _loadBundle(
    bundle: cc.AssetManager.Bundle | null | undefined,
    bundleName: string | undefined,
    success?: (bundle: cc.AssetManager.Bundle) => void,
    fail?: (err: any) => void,
    complete?: () => void
  ): void {
    let realBundle = bundle || (StringUtil.isEmpty(bundleName) ? cc.resources : cc.assetManager.getBundle(bundleName!));
    if (realBundle) {
      success && success(realBundle);
      complete && complete();
      return;
    }
    cc.assetManager.loadBundle(bundleName!, (err: Error, b: cc.AssetManager.Bundle) => {
      if (err) {
        fail && fail({ errCode: -1, errMsg: err.message });
        complete && complete();
        return;
      }
      success && success(b);
      complete && complete();
    });
  }

  static preloadDir(option: { dir: string; bundle?: cc.AssetManager.Bundle; bundleName?: string }): void {
    this.loadBundle({
      bundle: option.bundle,
      bundleName: option.bundleName
    }).then((bundle) => {
      bundle.preloadDir(option.dir);
    });
  }

  static loadDir(option: LoadDirRequest): Promise<any[]> | void {
    if (!option.success) {
      return new Promise((resolve, reject) => {
        this._loadDir(option.dir, option.bundle, option.bundleName, resolve, reject);
      });
    }
    this._loadDir(option.dir, option.bundle, option.bundleName, option.success, option.fail, option.complete);
  }

  private static _loadDir(
    dir: string,
    bundle: cc.AssetManager.Bundle | null | undefined,
    bundleName: string | undefined,
    success?: (assets: any[]) => void,
    fail?: (err: any) => void,
    complete?: () => void
  ): void {
    this.loadBundle({
      bundle,
      bundleName,
      success: (b) => {
        b.loadDir(dir, (err: Error, assets: any[]) => {
          if (err) {
            fail && fail({ errCode: -1, errMsg: err.message });
            complete && complete();
            return;
          }
          success && success(assets);
          complete && complete();
        });
      },
      fail: (err) => {
        fail && fail(err);
        complete && complete();
      }
    });
  }

  static loadAssetAnySequence(option: { requests: LoadAssetRequest[] }): Promise<{ assetResults: any[]; err: any }> {
    const tasks: Array<Promise<any>> = [];
    for (let i = 0; i < option.requests.length; i++) {
      tasks.push(this.loadAsset(option.requests[i]) as Promise<any>);
    }
    const results: any[] = [];
    let index = 0;
    return new Promise((resolve) => {
      if (option.requests.length <= 0) {
        resolve({ assetResults: results, err: null });
        return;
      }
      const next = () => {
        tasks[index]
          .then((asset) => {
            results.push({ asset, option: option.requests[index] });
            index++;
            if (index === tasks.length) {
              resolve({ assetResults: results, err: null });
              return;
            }
            next();
          })
          .catch((err) => {
            index++;
            if (index === tasks.length) {
              resolve({ assetResults: results, err });
              return;
            }
          });
      };
      next();
    });
  }

  static setSpritFrame(
    sprite: cc.Sprite,
    bundleName: string | undefined,
    path: string,
    complete?: () => void
  ): void {
    this.loadAsset({
      bundleName,
      path,
      type: cc.SpriteFrame
    })
      ?.then((asset: cc.SpriteFrame) => {
        sprite.spriteFrame = asset;
        complete && complete();
      })
      .catch((err: any) => {
        console.error(err);
      });
  }

  /**
  * 通过相对文件夹路径删除所有文件夹中资源
  * @param path          资源文件夹路径
  * @param bundleName    远程资源包名
  */
  static releaseDir(path: string, bundleName: string) {
    const bundle: cc.AssetManager.Bundle | null = cc.assetManager.getBundle(bundleName);
    if (bundle) {
      var infos = bundle.getDirWithPath(path);
      if (infos) {
        infos.map((info) => {
          this.releasePrefabtDepsRecursively(bundleName, info.uuid);
        });
      }

      if (path == "" && bundleName != "resources") {
        cc.assetManager.removeBundle(bundle);
      }
    }
  }

  /** 释放预制依赖资源 */
  static releasePrefabtDepsRecursively(bundleName: string, uuid: string | cc.Asset) {
    if (uuid instanceof cc.Asset) {
      uuid.decRef();
    }
    else {
      const asset = cc.assetManager.assets.get(uuid);
      if (asset) {
        asset.decRef();
      }
    }
  }

}

