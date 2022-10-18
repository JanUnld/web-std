import { EventEmitter, Injectable } from '@angular/core';
import { SortOrder } from '@janunld/stdlib';
import { BehaviorSubject } from 'rxjs';

export interface SortState {
  order: SortOrder;
  key: string;
}

export type ReadonlySortModel = Omit<SortModel, 'set' | 'unset'>;

export type SortModelAction = 'set' | 'unset';

export interface SortModelChange {
  model: ReadonlySortModel;
  action: SortModelAction;
  order: SortOrder;
  key: string;
}

export interface SortActionOptions {
  emitChange?: boolean;
}

@Injectable()
export class SortModel {
  protected readonly activeStates = new BehaviorSubject<SortState[]>([]);

  readonly changes = new EventEmitter<SortModelChange>();

  allowsMultiple = false;

  get value(): SortState[] {
    return this.activeStates.getValue() ?? [];
  }

  isSet(key: string, order?: SortOrder): boolean {
    if (this.value.length === 0) {
      return false;
    } else {
      const state = this.value.find((s) => s.key === key);
      return state != null && (order == null || order === state.order);
    }
  }

  isAscending(key: string): boolean {
    return this.getOrder(key) === 'ascending';
  }

  isDescending(key: string): boolean {
    return this.getOrder(key) === 'descending';
  }

  set(key: string, order: SortOrder, options?: SortActionOptions): void {
    if (this.isSet(key)) {
      if (this.allowsMultiple) {
        this.setOrder(key, order);
      } else {
        this.activeStates.next([{ key, order }]);
      }
    } else {
      if (this.allowsMultiple) {
        this.activeStates.next([...this.value, { key, order }]);
      } else {
        this.activeStates.next([{ key, order }]);
      }
    }

    if (options == null || options.emitChange) {
      this.emitChange('set', key, order);
    }
  }

  unset(options?: SortActionOptions): void;
  unset(key?: string, options?: SortActionOptions): void;
  unset(keyOrOptions?: SortActionOptions | string, options?: SortActionOptions): void {
    options = typeof keyOrOptions !== 'string' ? keyOrOptions : options;
    const key = typeof keyOrOptions === 'string' ? keyOrOptions : null;
    let removed: SortState[] = [];
    if (key == null) {
      removed = this.value;
      this.activeStates.next([]);
    } else if (this.isSet(key)) {
      const state = this.value.find((state) => state.key === key);
      if (state) {
        removed = [state];
      }
      this.activeStates.next(this.value.filter((state) => state.key !== key));
    }
    if (options == null || options.emitChange) {
      for (const r of removed) this.emitChange('unset', r.key, r.order);
    }
  }

  getOrder(key: string): SortOrder | null {
    return this.value.find((s) => s.key === key)?.order ?? null;
  }

  protected setOrder(key: string, order: SortOrder): void {
    this.activeStates.next(
      this.value.map((state) => ({
        order: state.key === key ? order : state.order,
        key: state.key,
      }))
    );
  }

  protected emitChange(action: SortModelAction, key: string, order: SortOrder): void {
    this.changes.emit({ action, key, order, model: this });
  }
}
