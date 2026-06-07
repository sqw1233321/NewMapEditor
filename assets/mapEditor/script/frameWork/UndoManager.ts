/**
 * 快照式撤销/重做管理器
 * 使用策略：覆盖模式（撤销后新操作清除"未来"历史）
 */
export class UndoManager {
  private _snapshots: string[] = [];   // 历史快照列表
  private _position: number = -1;      // 当前指针位置
  private _maxSize: number = 30;       // 最大历史数量

  /**
   * 保存当前快照
   * @param snapshot JSON 字符串
   */
  public saveSnapshot(snapshot: string): void {
    if (!snapshot) return;

    // 撤销后新操作，清除后面的历史
    this._snapshots = this._snapshots.slice(0, this._position + 1);

    // 添加新快照
    this._snapshots.push(snapshot);
    this._position++;

    // 限制大小，超出则移除最旧的
    while (this._snapshots.length > this._maxSize) {
      this._snapshots.shift();
      this._position--;
    }
  }

  /**
   * 撤销：返回上一个状态的快照
   * @returns 上一个状态的快照，未找到则返回 null
   */
  public undo(): string | null {
    if (!this.canUndo()) {
      return null;
    }
    return this._snapshots[--this._position];
  }

  /**
   * 重做：返回下一个状态的快照
   * @returns 下一个状态的快照，未找到则返回 null
   */
  public redo(): string | null {
    if (!this.canRedo()) return null;
    this._position++;
    return this._snapshots[this._position];
  }

  /**
   * 撤销前的快照（用于恢复）
   * @returns 当前状态的快照
   */
  public getCurrentSnapshot(): string | null {
    if (this._position < 0 || this._position >= this._snapshots.length) return null;
    return this._snapshots[this._position];
  }

  /**
   * 是否可以撤销
   */
  public canUndo(): boolean {
    return this._position > 0;
  }

  /**
   * 是否可以重做
   */
  public canRedo(): boolean {
    return this._position < this._snapshots.length - 1;
  }

  /**
   * 清空所有历史
   */
  public clear(): void {
    this._snapshots.length = 0;
    this._position = -1;
  }

  /**
   * 获取当前历史数量
   */
  public getHistoryCount(): number {
    return this._snapshots.length;
  }

  /**
   * 获取当前指针位置
   */
  public getPosition(): number {
    return this._position;
  }
}
